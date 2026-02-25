import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * POST /api/cron/capture-payments
 * Stripe 48h 自动划扣 Cron Job
 * 应由外部定时服务（如 Vercel Cron、EasyCron）定期调用
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Verify API key from cron service
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Find orders that need to be captured
    const ordersToCapture = await prisma.order.findMany({
      where: {
        status: 'AUTHORIZED',
        scheduledCaptureAt: {
          lte: now,
        },
        actualCapturedAt: null,
        stripeIntentId: {
          not: null,
        },
      },
      include: {
        paymentPolicy: true,
        serviceProvider: true,
        customer: true,
      },
    });

    console.log(`🔄 Found ${ordersToCapture.length} orders to capture`);

    for (const order of ordersToCapture) {
      results.processed++;

      try {
        if (!order.stripeIntentId) {
          throw new Error('Missing Stripe Intent ID');
        }

        // Verify payment policy allows auto-capture
        if (!order.paymentPolicy.isAutoCaptureEnabled) {
          console.log(`⏭️ Skipping order ${order.id} - auto-capture disabled`);
          continue;
        }

        // Confirm Stripe PaymentIntent
        const confirmedIntent = await stripe.paymentIntents.confirm(
          order.stripeIntentId
        );

        if (confirmedIntent.status === 'succeeded') {
          // Update order status
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'CAPTURED',
              actualCapturedAt: now,
              stripeIntentStatus: 'succeeded',
            },
          });

          // Record payment
          await prisma.payment.create({
            data: {
              orderId: order.id,
              type: 'CAPTURE',
              amount: Number(order.depositAmount),
              stripeTransactionId: confirmedIntent.id,
              stripeStatus: 'succeeded',
            },
          });

          // Create escrow for provider
          await prisma.escrow.upsert({
            where: { orderId: order.id },
            update: {
              status: 'RELEASED_TO_PROVIDER',
              releasedAt: now,
              releasedTo: 'provider',
            },
            create: {
              orderId: order.id,
              amount: Number(order.depositAmount),
              status: 'RELEASED_TO_PROVIDER',
              releasedAt: now,
              releasedTo: 'provider',
            },
          });

          results.succeeded++;
          console.log(`✅ Captured order ${order.orderNumber}`);

          // TODO: Send notification to customer and provider
        } else if (confirmedIntent.status === 'requires_payment_method') {
          // Payment method required - notify customer
          console.warn(
            `⚠️ Order ${order.orderNumber} requires payment method`
          );
          results.failed++;
          results.errors.push(
            `Order ${order.orderNumber}: Payment method required`
          );

          // TODO: Send notification to customer
        }
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.errors.push(`Order ${order.orderNumber}: ${errorMsg}`);
        console.error(
          `❌ Failed to capture order ${order.orderNumber}:`,
          error
        );

        // Record error for retry
        await prisma.payment.create({
          data: {
            orderId: order.id,
            type: 'CAPTURE',
            amount: Number(order.depositAmount),
            errorMessage: errorMsg,
            errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
            retryCount: 1,
          },
        });

        // TODO: Send error notification to admin
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Capture job completed',
      data: results,
    });
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cron job failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Alternative: Use node-cron for local development
 * This should be started separately in your backend
 */
export async function setupPaymentCron() {
  try {
    const cron = await import('node-cron');

    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      console.log('🔄 Running payment capture cron job...');

      try {
        const now = new Date();
        const ordersToCapture = await prisma.order.findMany({
          where: {
            status: 'AUTHORIZED',
            scheduledCaptureAt: { lte: now },
            actualCapturedAt: null,
            stripeIntentId: { not: null },
          },
          include: { paymentPolicy: true },
        });

        for (const order of ordersToCapture) {
          if (!order.stripeIntentId) continue;
          if (!order.paymentPolicy.isAutoCaptureEnabled) continue;

          try {
            const confirmedIntent = await stripe.paymentIntents.confirm(
              order.stripeIntentId
            );

            if (confirmedIntent.status === 'succeeded') {
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  status: 'CAPTURED',
                  actualCapturedAt: now,
                },
              });

              console.log(`✅ Captured order ${order.orderNumber}`);
            }
          } catch (error) {
            console.error(`❌ Capture failed for ${order.orderNumber}`, error);
          }
        }
      } catch (error) {
        console.error('❌ Cron job error:', error);
      }
    });

    console.log('✅ Payment capture cron job started');
  } catch (error) {
    console.error('Failed to setup cron job:', error);
  }
}
