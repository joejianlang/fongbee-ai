/**
 * POST /api/webhooks/stripe
 *
 * Stripe Webhook 处理器
 *
 * 配置: Stripe Dashboard → Webhooks → 添加端点
 * 事件:
 *   - payment_intent.requires_action — 需要 3DS 验证，通知客户
 *   - payment_intent.payment_failed  — 支付失败，通知客户
 *   - payment_intent.canceled         — 授权已过期或取消
 *   - transfer.created               — 结算转账成功
 *
 * 本地测试: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/payment/stripe';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Webhook] Received: ${event.type}`);

  try {
    switch (event.type) {
      // ── 支付失败 ────────────────────────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const order = await prisma.order.findFirst({
          where: { stripeIntentId: intent.id },
        });
        if (order) {
          await prisma.notification.create({
            data: {
              userId: order.customerId,
              type: 'PAYMENT_FAILED',
              title: '支付失败',
              message: `订单 ${order.orderNumber} 支付失败，请检查您的支付方式。`,
              relatedOrderId: order.id,
              actionUrl: `/app/orders/${order.id}`,
            },
          });
          // 更新 Payment 记录
          await prisma.payment.create({
            data: {
              orderId: order.id,
              type: 'AUTHORIZE',
              amount: Number(order.depositAmount),
              stripeTransactionId: intent.id,
              stripeStatus: 'failed',
              errorMessage: intent.last_payment_error?.message,
              errorCode: intent.last_payment_error?.code ?? undefined,
            },
          });
        }
        break;
      }

      // ── 授权取消/过期 ────────────────────────────────────────────────────────
      case 'payment_intent.canceled': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const order = await prisma.order.findFirst({
          where: { stripeIntentId: intent.id, status: { in: ['PENDING', 'AUTHORIZED'] } },
        });
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancellationReason: `Stripe Intent 已取消: ${intent.cancellation_reason}`,
            },
          });
        }
        break;
      }

      // ── 需要额外验证（3DS） ──────────────────────────────────────────────────
      case 'payment_intent.requires_action': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const order = await prisma.order.findFirst({
          where: { stripeIntentId: intent.id },
        });
        if (order) {
          await prisma.notification.create({
            data: {
              userId: order.customerId,
              type: 'PAYMENT_FAILED',
              title: '需要额外验证',
              message: `订单 ${order.orderNumber} 需要银行额外验证，请在应用内完成。`,
              relatedOrderId: order.id,
              actionUrl: `/app/orders/${order.id}`,
            },
          });
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Webhook] Error handling ${event.type}:`, err);
    // 返回 200 避免 Stripe 重试（业务错误不是传输错误）
  }

  return NextResponse.json({ received: true });
}
