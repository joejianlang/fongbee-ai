import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const confirmPaymentSchema = z.object({
  stripePaymentIntentId: z.string(),
});

/**
 * POST /api/orders/:id/confirm-payment
 * 支付确认（客户端 Stripe 支付后调用）
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json();
    const validated = confirmPaymentSchema.parse(body);

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { paymentPolicy: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: '订单不存在' },
        { status: 404 }
      );
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: '订单状态不允许支付' },
        { status: 400 }
      );
    }

    // Verify Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(
      validated.stripePaymentIntentId
    );

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { success: false, message: '支付验证失败' },
        { status: 400 }
      );
    }

    // Record payment
    await prisma.payment.create({
      data: {
        orderId: params.id,
        type: 'AUTHORIZE',
        amount: Number(order.depositAmount),
        stripeTransactionId: paymentIntent.id,
        stripeStatus: paymentIntent.status,
      },
    });

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'AUTHORIZED',
        authorizedAt: new Date(),
        stripeIntentStatus: paymentIntent.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: '支付确认成功',
      data: {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        authorizedAt: updatedOrder.authorizedAt,
        scheduledCaptureAt: updatedOrder.scheduledCaptureAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: '输入验证失败',
          error: error.errors[0].message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '支付确认失败',
      },
      { status: 500 }
    );
  }
}
