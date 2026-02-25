/**
 * POST /api/orders/:id/complete
 *
 * 用户确认完工，支付尾款
 * IN_PROGRESS → PENDING_SETTLEMENT（确认完工）
 * PENDING_SETTLEMENT → COMPLETED（尾款支付成功）
 *
 * Body:
 * { action: "confirm_completion" }  — 确认完工，等待尾款
 * { action: "pay_remaining", stripePaymentIntentId: string }  — 尾款支付成功
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { verifyAuthorization } from '@/lib/payment/stripe';
import { ApiResponse } from '@/lib/types';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('confirm_completion') }),
  z.object({
    action: z.literal('pay_remaining'),
    stripePaymentIntentId: z.string(),
  }),
]);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const validated = schema.parse(body);

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 });
  if (order.customerId !== session.user.id) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();

  // ── confirm_completion: IN_PROGRESS → PENDING_SETTLEMENT ────────────────────
  if (validated.action === 'confirm_completion') {
    if (order.status !== 'IN_PROGRESS') {
      return NextResponse.json({ success: false, message: `状态 ${order.status} 不允许确认完工` }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: params.id },
      data: { status: 'PENDING_SETTLEMENT', actualEndTime: now },
    });

    return NextResponse.json({
      success: true,
      message: '完工已确认，请支付尾款',
      data: { orderId: order.id, status: 'PENDING_SETTLEMENT', remainingAmount: Number(order.remainingAmount) },
    });
  }

  // ── pay_remaining: PENDING_SETTLEMENT → COMPLETED ───────────────────────────
  if (order.status !== 'PENDING_SETTLEMENT') {
    return NextResponse.json({ success: false, message: `状态 ${order.status} 不允许支付尾款` }, { status: 400 });
  }

  const { authorized, amountCad } = await verifyAuthorization(validated.stripePaymentIntentId);
  if (!authorized) {
    return NextResponse.json({ success: false, message: '尾款支付未完成' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: params.id },
      data: { status: 'COMPLETED', completedAt: now },
    }),
    prisma.payment.create({
      data: {
        orderId: params.id,
        type: 'CAPTURE',
        amount: amountCad,
        stripeTransactionId: validated.stripePaymentIntentId,
        stripeStatus: 'succeeded',
      },
    }),
    prisma.notification.create({
      data: {
        userId: order.customerId,
        type: 'ORDER_COMPLETED',
        title: '订单完成',
        message: `订单 ${order.orderNumber} 已完成，感谢您的信任！`,
        relatedOrderId: order.id,
        actionUrl: `/app/orders/${order.id}/review`,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: '订单已完成',
    data: { orderId: order.id, status: 'COMPLETED', completedAt: now },
  });
}
