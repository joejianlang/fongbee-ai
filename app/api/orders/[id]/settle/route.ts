/**
 * POST /api/orders/:id/settle
 *
 * T+7 结算（管理员 / Cron 调用）
 * COMPLETED → SETTLED
 * 将资金从平台托管转给服务商（Stripe Connect Transfer）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { getStripe, calculatePlatformFee } from '@/lib/payment/stripe';
import { ApiResponse } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      serviceProvider: { select: { stripeAccountId: true, stripeVerified: true } },
    },
  });

  if (!order) return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 });
  if (order.status !== 'COMPLETED') {
    return NextResponse.json({ success: false, message: `状态 ${order.status} 不允许结算` }, { status: 400 });
  }
  if (!order.serviceProvider.stripeVerified || !order.serviceProvider.stripeAccountId) {
    return NextResponse.json({ success: false, message: '服务商 Stripe 账户未验证' }, { status: 400 });
  }

  const totalPaid = Number(order.totalAmount);
  const platformFee = calculatePlatformFee(totalPaid);
  const providerAmount = totalPaid - platformFee;

  const stripe = getStripe();

  // Stripe Connect Transfer
  const transfer = await stripe.transfers.create({
    amount: Math.round(providerAmount * 100),
    currency: 'cad',
    destination: order.serviceProvider.stripeAccountId,
    description: `结算 ${order.orderNumber}`,
    metadata: { orderId: order.id },
  });

  const now = new Date();

  await prisma.$transaction([
    prisma.order.update({
      where: { id: params.id },
      data: { status: 'SETTLED', settledAt: now },
    }),
    prisma.payment.create({
      data: {
        orderId: params.id,
        type: 'TRANSFER',
        amount: providerAmount,
        stripeTransactionId: transfer.id,
        stripeStatus: 'succeeded',
        transferredAt: now,
      },
    }),
    prisma.escrow.update({
      where: { orderId: params.id },
      data: { status: 'RELEASED_TO_PROVIDER', releasedAt: now, releasedTo: order.serviceProviderId },
    }),
    prisma.payout.create({
      data: {
        serviceProviderId: order.serviceProviderId,
        amount: providerAmount,
        period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        status: 'COMPLETED',
        stripePayoutId: transfer.id,
        paidAt: now,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: '结算完成',
    data: {
      orderId: order.id,
      status: 'SETTLED',
      providerAmount,
      platformFee,
      stripeTransferId: transfer.id,
    },
  });
}
