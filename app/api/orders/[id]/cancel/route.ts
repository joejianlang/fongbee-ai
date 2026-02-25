/**
 * POST /api/orders/:id/cancel
 *
 * 取消订单（状态机: PENDING/AUTHORIZED → CANCELLED 或 CANCELLED_FORFEITED）
 *
 * 违约金规则（来自 PaymentPolicy）:
 * - 取消时间 > cancellationCutoffHours 前: 全额退款 → CANCELLED
 * - 取消时间 ≤ cancellationCutoffHours 前: 定金没收 → CANCELLED_FORFEITED
 *
 * 可取消状态: PENDING, AUTHORIZED, CAPTURED
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { cancelAuthorization, refundPayment } from '@/lib/payment/stripe';
import { ApiResponse } from '@/lib/types';

const schema = z.object({
  reason: z.string().optional(),
});

const CANCELLABLE_STATUSES = ['PENDING', 'AUTHORIZED', 'CAPTURED'];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { reason } = schema.parse(body);

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { paymentPolicy: true },
  });

  if (!order) return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 });

  // 客户或管理员可取消
  if (order.customerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return NextResponse.json({
      success: false,
      message: `状态 ${order.status} 的订单不可取消`,
    }, { status: 400 });
  }

  const now = new Date();
  const scheduledStart = order.scheduledStartTime;
  const hoursUntilService = (scheduledStart.getTime() - now.getTime()) / 3600000;
  const cutoffHours = order.paymentPolicy.cancellationCutoffHours;

  // 判断是否在违约金窗口内
  const isForfeit = order.status !== 'PENDING' && hoursUntilService <= cutoffHours;
  const newStatus = isForfeit ? 'CANCELLED_FORFEITED' : 'CANCELLED';

  let forfeitedAmount = 0;
  let refundAmount = 0;

  if (order.status === 'PENDING') {
    // 还未授权，无需 Stripe 操作
  } else if (order.status === 'AUTHORIZED' || order.status === 'CAPTURED') {
    if (isForfeit) {
      // 定金没收：计算违约金
      forfeitedAmount =
        Math.round(Number(order.depositAmount) * (order.paymentPolicy.forfeiturePercentage / 100) * 100) / 100;
      refundAmount = Number(order.depositAmount) - forfeitedAmount;

      if (order.stripeIntentId) {
        if (refundAmount > 0) {
          // 部分退款
          await refundPayment(order.stripeIntentId, refundAmount);
        }
        // 剩余部分留作违约金（平台持有）
      }
    } else {
      // 全额退款
      refundAmount = Number(order.depositAmount);
      if (order.stripeIntentId) {
        await cancelAuthorization(order.stripeIntentId);
      }
    }
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        cancelledAt: now,
        cancelledBy: session.user.id,
        cancellationReason: reason,
        forfeitedAmount: forfeitedAmount,
      },
    }),
    ...(refundAmount > 0
      ? [
          prisma.payment.create({
            data: {
              orderId: params.id,
              type: 'REFUND',
              amount: refundAmount,
              stripeStatus: 'succeeded',
            },
          }),
        ]
      : []),
    prisma.notification.create({
      data: {
        userId: order.customerId,
        type: 'ORDER_CONFIRMED',
        title: isForfeit ? '订单取消（违约金已扣除）' : '订单已取消',
        message: isForfeit
          ? `订单 ${order.orderNumber} 已取消，因距服务时间不足 ${cutoffHours} 小时，扣除违约金 CAD $${forfeitedAmount.toFixed(2)}，退款 CAD $${refundAmount.toFixed(2)}。`
          : `订单 ${order.orderNumber} 已取消，定金将全额退款。`,
        relatedOrderId: order.id,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: isForfeit ? `订单已取消，违约金 CAD $${forfeitedAmount.toFixed(2)}` : '订单已取消，全额退款',
    data: {
      orderId: order.id,
      status: newStatus,
      forfeitedAmount,
      refundAmount,
    },
  });
}
