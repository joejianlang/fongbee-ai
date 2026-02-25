// POST /api/projects/:id/milestones/:milestoneId/pay
//
// 为里程碑创建支付订单（PENDING）+ Stripe PaymentIntent
// 里程碑付款 = 标准 Order 创建，status 为 complex_custom
//
// 前置条件: Project.status = ACTIVE (合同已生效)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../../../auth/[...nextauth]/auth-options';
import { createManualCaptureIntent } from '@/lib/payment/stripe';
import { ApiResponse } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // 分开查询里程碑和项目，避免复杂 include 类型问题
  const milestoneData = await prisma.milestone.findUnique({
    where: { id: params.milestoneId },
  });
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { paymentPolicy: true },
  });

  if (!milestoneData || !project) {
    return NextResponse.json({ success: false, message: '数据不存在' }, { status: 404 });
  }

  if (milestoneData.projectId !== params.id) {
    return NextResponse.json({ success: false, message: '里程碑不存在' }, { status: 404 });
  }

  // 权限: 只有客户可发起里程碑付款
  if (project.customerId !== session.user.id) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  // 前置检查
  if (project.status !== 'ACTIVE') {
    return NextResponse.json({ success: false, message: '项目合同尚未生效，不可支付' }, { status: 400 });
  }
  if (!project.activeContractId) {
    return NextResponse.json({ success: false, message: '项目尚无有效合同' }, { status: 400 });
  }
  if (milestoneData.orderId) {
    return NextResponse.json({ success: false, message: '该里程碑已存在支付订单' }, { status: 409 });
  }
  if (milestoneData.status !== 'PENDING') {
    return NextResponse.json({
      success: false,
      message: `里程碑状态 ${milestoneData.status} 不可发起支付`,
    }, { status: 400 });
  }

  const paymentPolicy = project.paymentPolicy;
  if (!paymentPolicy) {
    return NextResponse.json({ success: false, message: '未配置支付政策' }, { status: 500 });
  }

  const totalAmount = Number(milestoneData.amount);
  const depositPercentage = milestoneData.depositPercentage ?? paymentPolicy.depositPercentage ?? 30;
  const depositAmount = Math.round(totalAmount * depositPercentage / 100 * 100) / 100;

  // PAD 检查
  const padThreshold = parseFloat(process.env.PAD_THRESHOLD_CAD ?? '1000');
  if (totalAmount >= padThreshold) {
    const activePad = await prisma.pADAuthorization.findFirst({
      where: { userId: session.user.id, status: 'ACTIVE' },
    });
    if (!activePad) {
      return NextResponse.json({
        success: false,
        message: `里程碑金额 CAD $${totalAmount} 超过 $${padThreshold}，需先完成 PAD 协议。`,
        data: { requiresPad: true, padSetupUrl: '/app/settings/pad' },
      }, { status: 402 });
    }
  }

  // scheduledCaptureAt = 里程碑开始时间 - autoCaptureHoursBefore
  const scheduledCaptureAt = new Date(
    milestoneData.startDate.getTime() - paymentPolicy.autoCaptureHoursBefore * 3600000
  );

  // 生成订单号
  const orderCount = await prisma.order.count();
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

  // 创建 Order
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: session.user.id,
      serviceProviderId: project.serviceProviderId,
      projectId: params.id,
      paymentPolicyId: paymentPolicy.id,
      serviceType: 'COMPLEX_PROJECT',
      totalAmount,
      depositAmount,
      remainingAmount: totalAmount - depositAmount,
      scheduledStartTime: milestoneData.startDate,
      scheduledEndTime: milestoneData.endDate,
      scheduledCaptureAt,
      status: 'PENDING',
    },
  });

  // 创建 Stripe PaymentIntent
  const { intentId, clientSecret } = await createManualCaptureIntent({
    amountCad: depositAmount,
    orderId: order.id,
    customerId: session.user.id,
    serviceProviderId: project.serviceProviderId,
    description: `里程碑付款: ${milestoneData.title} (${orderNumber})`,
  });

  // 更新 Order + Milestone
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { stripeIntentId: intentId },
    }),
    prisma.milestone.update({
      where: { id: params.milestoneId },
      data: { orderId: order.id },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: '里程碑支付订单创建成功',
    data: {
      orderId: order.id,
      orderNumber,
      stripeClientSecret: clientSecret,
      depositAmount,
      totalAmount,
      milestoneTitle: milestoneData.title,
    },
  });
}
