/**
 * POST /api/orders/:id/authorize
 *
 * 客户完成前端 Stripe 授权后调用
 * PENDING → AUTHORIZED
 *
 * 前端流程:
 * 1. createOrder → 获取 stripeClientSecret
 * 2. stripe.confirmCardPayment(clientSecret) — 客户输入卡号
 * 3. 调用此接口，传入 stripePaymentIntentId 验证
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { verifyAuthorization } from '@/lib/payment/stripe';
import { ApiResponse } from '@/lib/types';

const schema = z.object({
  stripePaymentIntentId: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { stripePaymentIntentId } = schema.parse(body);

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 });
  if (order.customerId !== session.user.id) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }
  if (order.status !== 'PENDING') {
    return NextResponse.json({ success: false, message: `当前状态 ${order.status} 不允许授权` }, { status: 400 });
  }

  // 验证 Stripe Intent 状态
  const { authorized, status, amountCad } = await verifyAuthorization(stripePaymentIntentId);
  if (!authorized) {
    return NextResponse.json({
      success: false,
      message: `Stripe 授权未完成，当前状态: ${status}`,
    }, { status: 400 });
  }

  // 事务: 更新订单 + 记录 Payment
  const [updatedOrder] = await prisma.$transaction([
    prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'AUTHORIZED',
        authorizedAt: new Date(),
        stripeIntentId: stripePaymentIntentId,
        stripeIntentStatus: 'requires_capture',
      },
    }),
    prisma.payment.create({
      data: {
        orderId: params.id,
        type: 'AUTHORIZE',
        amount: amountCad,
        stripeTransactionId: stripePaymentIntentId,
        stripeStatus: 'requires_capture',
      },
    }),
    prisma.notification.create({
      data: {
        userId: order.customerId,
        type: 'ORDER_CONFIRMED',
        title: '订单已确认',
        message: `订单 ${order.orderNumber} 定金授权成功，服务将在 ${order.scheduledCaptureAt?.toLocaleString('zh-CA')} 自动划扣。`,
        relatedOrderId: order.id,
        actionUrl: `/app/orders/${order.id}`,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: '支付授权成功',
    data: {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      authorizedAt: updatedOrder.authorizedAt,
      scheduledCaptureAt: updatedOrder.scheduledCaptureAt,
    },
  });
}
