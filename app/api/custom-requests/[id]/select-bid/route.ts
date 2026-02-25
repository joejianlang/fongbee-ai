// POST /api/custom-requests/:id/select-bid
//
// 客户选择报价，生成订单（简单定制流程的核心节点）
//
// 流程:
// 1. 验证: 需求是 OPEN, Bid 是 OPEN, 客户是本人
// 2. 更新 CustomRequest.selectedBidId, status -> ACCEPTED
// 3. 其他 Bid -> REJECTED
// 4. 获取 PaymentPolicy (simple_custom 全局政策)
// 5. 创建 Order (PENDING) + Stripe PaymentIntent
// 6. 通知中标服务商

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { createManualCaptureIntent } from '@/lib/payment/stripe';
import { ApiResponse } from '@/lib/types';

const schema = z.object({
  bidId: z.string(),
  scheduledStartTime: z.string().datetime(),
  scheduledEndTime: z.string().datetime(),
  serviceAddress: z.string().optional(),
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
  let validated: z.infer<typeof schema>;
  try {
    validated = schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: '输入验证失败', error: error.errors[0].message },
        { status: 400 }
      );
    }
    throw error;
  }

  // 查询需求
  const customRequest = await prisma.customRequest.findUnique({
    where: { id: params.id },
    include: {
      template: { select: { name: true, categoryId: true } },
      bids: { where: { id: validated.bidId } },
    },
  });

  if (!customRequest) {
    return NextResponse.json({ success: false, message: '需求不存在' }, { status: 404 });
  }
  if (customRequest.customerId !== session.user.id) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }
  if (customRequest.status !== 'OPEN') {
    return NextResponse.json({ success: false, message: '需求已不可选择报价' }, { status: 400 });
  }

  const selectedBid = customRequest.bids[0];
  if (!selectedBid) {
    return NextResponse.json({ success: false, message: '报价不存在' }, { status: 404 });
  }
  if (selectedBid.status !== 'OPEN') {
    return NextResponse.json({ success: false, message: '该报价已失效' }, { status: 400 });
  }

  // 获取支付政策（简单定制服务使用 simple_custom 全局政策）
  const paymentPolicy = await prisma.paymentPolicy.findFirst({
    where: {
      serviceType: 'simple_custom',
      serviceCategoryId: null, // 全局政策
    },
  });
  if (!paymentPolicy) {
    return NextResponse.json({ success: false, message: '未找到支付政策配置' }, { status: 500 });
  }

  // 获取服务商
  const serviceProvider = await prisma.serviceProvider.findUnique({
    where: { id: selectedBid.serviceProviderId },
    select: { id: true, businessName: true, userId: true },
  });
  if (!serviceProvider) {
    return NextResponse.json({ success: false, message: '服务商不存在' }, { status: 404 });
  }

  // PAD 检查
  const totalAmount = Number(selectedBid.amount);
  const padThreshold = parseFloat(process.env.PAD_THRESHOLD_CAD ?? '1000');
  if (totalAmount >= padThreshold) {
    const activePad = await prisma.pADAuthorization.findFirst({
      where: { userId: session.user.id, status: 'ACTIVE' },
    });
    if (!activePad) {
      return NextResponse.json({
        success: false,
        message: `订单金额 CAD $${totalAmount.toFixed(2)} 超过 $${padThreshold}，需先完成 PAD 预授权协议。`,
        data: { requiresPad: true, padSetupUrl: '/app/settings/pad' },
      }, { status: 402 });
    }
  }

  // 计算定金
  const depositPercentage = paymentPolicy.depositPercentage ?? 30;
  const depositAmount = Math.round(totalAmount * depositPercentage / 100 * 100) / 100;

  // scheduledCaptureAt
  const scheduledStart = new Date(validated.scheduledStartTime);
  const scheduledCaptureAt = new Date(
    scheduledStart.getTime() - paymentPolicy.autoCaptureHoursBefore * 3600000
  );

  // 生成订单号
  const orderCount = await prisma.order.count();
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

  // 创建 Order (PENDING)
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: session.user.id,
      serviceProviderId: selectedBid.serviceProviderId,
      customRequestId: params.id,
      paymentPolicyId: paymentPolicy.id,
      serviceType: 'simple_custom',
      totalAmount,
      depositAmount,
      remainingAmount: totalAmount - depositAmount,
      scheduledStartTime: new Date(validated.scheduledStartTime),
      scheduledEndTime: new Date(validated.scheduledEndTime),
      scheduledCaptureAt,
      serviceAddress: validated.serviceAddress,
      status: 'PENDING',
    },
  });

  // 创建 Stripe PaymentIntent
  const { intentId, clientSecret } = await createManualCaptureIntent({
    amountCad: depositAmount,
    orderId: order.id,
    customerId: session.user.id,
    serviceProviderId: selectedBid.serviceProviderId,
    description: `定制服务定金 ${orderNumber}`,
  });

  // 事务: 更新需求状态 + Bid 状态 + Order stripeIntentId
  await prisma.$transaction([
    // 更新需求
    prisma.customRequest.update({
      where: { id: params.id },
      data: {
        status: 'ACCEPTED',
        selectedBidId: selectedBid.id,
      },
    }),
    // 中标 Bid
    prisma.bid.update({
      where: { id: selectedBid.id },
      data: { status: 'ACCEPTED', isSelected: true, acceptedAt: new Date() },
    }),
    // 其他 Bid -> REJECTED
    prisma.bid.updateMany({
      where: {
        customRequestId: params.id,
        id: { not: selectedBid.id },
        status: 'OPEN',
      },
      data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: '客户选择了其他报价' },
    }),
    // 更新 Order 的 stripeIntentId
    prisma.order.update({
      where: { id: order.id },
      data: { stripeIntentId: intentId },
    }),
    // 通知中标服务商
    prisma.notification.create({
      data: {
        userId: serviceProvider.userId,
        type: 'ORDER_CONFIRMED',
        title: '恭喜！您的报价被选中',
        message: `客户选择了您的报价，订单 ${orderNumber} 已创建，金额 CAD $${totalAmount.toFixed(2)}。`,
        relatedOrderId: order.id,
        actionUrl: `/app/orders/${order.id}`,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: '报价选择成功，请完成支付',
    data: {
      orderId: order.id,
      orderNumber,
      stripeClientSecret: clientSecret,
      depositAmount,
      totalAmount,
    },
  });
}
