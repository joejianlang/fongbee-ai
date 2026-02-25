/**
 * /api/orders
 *
 * POST — 创建订单（PENDING 状态，Stripe Manual Capture Intent）
 * GET  — 获取当前用户订单列表
 *
 * 状态机: PENDING → AUTHORIZED → CRON_CAPTURING → CAPTURED → IN_PROGRESS
 *         → PENDING_SETTLEMENT → COMPLETED → SETTLED
 *         取消: CANCELLED / CANCELLED_FORFEITED
 *         异常: REFUNDED / DISPUTED
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/auth-options';
import { createManualCaptureIntent } from '@/lib/payment/stripe';
import { ApiResponse, PaginatedResponse } from '@/lib/types';

const PAD_THRESHOLD_CAD = parseFloat(process.env.PAD_THRESHOLD_CAD ?? '1000');

const createOrderSchema = z.object({
  serviceType: z.enum(['standard', 'simple_custom', 'complex_custom']).default('standard'),
  serviceId: z.string().optional(),
  customRequestId: z.string().optional(),
  projectId: z.string().optional(),
  scheduledStartTime: z.string().datetime(),
  scheduledEndTime: z.string().datetime(),
  serviceAddress: z.string().optional(),
  serviceNotes: z.string().optional(),
});

// ── POST /api/orders ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const customerId = session.user.id;

  try {
    const body = await req.json();
    const validated = createOrderSchema.parse(body);

    // ── 1. 解析服务详情 + 金额 ────────────────────────────────────────────────
    let totalAmount = 0;
    let serviceProviderId = '';
    let serviceCategoryId: string | null = null;

    if (validated.serviceType === 'standard' && validated.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: validated.serviceId },
        select: { basePrice: true, serviceProviderId: true, categoryId: true, isAvailable: true },
      });
      if (!service) {
        return NextResponse.json({ success: false, message: '服务不存在' }, { status: 404 });
      }
      if (!service.isAvailable) {
        return NextResponse.json({ success: false, message: '服务暂不可用' }, { status: 400 });
      }
      totalAmount = Number(service.basePrice);
      serviceProviderId = service.serviceProviderId;
      serviceCategoryId = service.categoryId;

    } else if (validated.serviceType === 'simple_custom' && validated.customRequestId) {
      const customRequest = await prisma.customRequest.findUnique({
        where: { id: validated.customRequestId },
        include: { selectedBid: { select: { amount: true, serviceProviderId: true } } },
      });
      if (!customRequest?.selectedBid) {
        return NextResponse.json({ success: false, message: '定制请求未选中报价' }, { status: 400 });
      }
      totalAmount = Number(customRequest.selectedBid.amount);
      serviceProviderId = customRequest.selectedBid.serviceProviderId;

    } else if (validated.serviceType === 'complex_custom' && validated.projectId) {
      const milestone = await prisma.milestone.findFirst({
        where: { projectId: validated.projectId, status: 'PENDING', orderId: null },
        orderBy: { milestoneNumber: 'asc' },
        select: { amount: true, serviceProviderId: true },
      });
      if (!milestone) {
        return NextResponse.json({ success: false, message: '无待支付里程碑' }, { status: 400 });
      }
      totalAmount = Number(milestone.amount);
      serviceProviderId = milestone.serviceProviderId;
    } else {
      return NextResponse.json({ success: false, message: '参数不完整' }, { status: 400 });
    }

    // ── 2. 获取支付政策 ───────────────────────────────────────────────────────
    const paymentPolicy =
      (await prisma.paymentPolicy.findFirst({
        where: {
          serviceType: validated.serviceType,
          serviceCategoryId: serviceCategoryId,
        },
      })) ??
      (await prisma.paymentPolicy.findFirst({
        where: { serviceType: validated.serviceType, serviceCategoryId: null },
      }));

    if (!paymentPolicy) {
      return NextResponse.json({ success: false, message: '支付政策未配置' }, { status: 500 });
    }

    // ── 3. 计算定金和划扣时间 ─────────────────────────────────────────────────
    const depositAmount =
      Math.round(totalAmount * (paymentPolicy.depositPercentage / 100) * 100) / 100;
    const remainingAmount = Math.round((totalAmount - depositAmount) * 100) / 100;
    const scheduledStartTime = new Date(validated.scheduledStartTime);
    const scheduledCaptureAt = new Date(
      scheduledStartTime.getTime() - paymentPolicy.autoCaptureHoursBefore * 3600 * 1000
    );

    // ── 4. PAD 检测（≥ CAD $1,000 需要预授权借记协议） ────────────────────────
    const requiresPAD = totalAmount >= PAD_THRESHOLD_CAD;
    let padAuthorizationId: string | null = null;

    if (requiresPAD) {
      const activePad = await prisma.pADAuthorization.findFirst({
        where: { userId: customerId, status: 'ACTIVE' },
        orderBy: { authorizedAt: 'desc' },
      });
      if (!activePad) {
        return NextResponse.json({
          success: false,
          message: `订单金额 CAD $${totalAmount.toFixed(2)} 超过 $${PAD_THRESHOLD_CAD}，需要签署 PAD 预授权协议。`,
          data: { requiresPAD: true, padSetupUrl: '/app/pad-setup' },
        }, { status: 402 });
      }
      padAuthorizationId = activePad.id;
    }

    // ── 5. 创建订单（先写 DB，再创建 Stripe Intent） ────────────────────────────
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        serviceType: validated.serviceType,
        serviceId: validated.serviceId,
        customRequestId: validated.customRequestId,
        projectId: validated.projectId,
        customerId,
        serviceProviderId,
        paymentPolicyId: paymentPolicy.id,
        totalAmount,
        depositAmount,
        remainingAmount,
        scheduledStartTime,
        scheduledEndTime: new Date(validated.scheduledEndTime),
        scheduledCaptureAt,
        serviceAddress: validated.serviceAddress,
        serviceNotes: validated.serviceNotes,
        padAuthorizationId,
      },
    });

    // ── 6. 创建 Stripe Manual Capture Intent ─────────────────────────────────
    const { intentId, clientSecret } = await createManualCaptureIntent({
      amountCad: depositAmount,
      orderId: order.id,
      customerId,
      serviceProviderId,
      description: `${validated.serviceType} 定金 - ${orderNumber}`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeIntentId: intentId, stripeIntentStatus: 'requires_payment_method' },
    });

    return NextResponse.json({
      success: true,
      message: '订单创建成功，请完成支付授权',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        stripeIntentId: intentId,
        stripeClientSecret: clientSecret,
        totalAmount,
        depositAmount,
        remainingAmount,
        scheduledCaptureAt: scheduledCaptureAt.toISOString(),
        autoCaptureHoursBefore: paymentPolicy.autoCaptureHoursBefore,
        requiresPAD,
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: '参数错误', error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('[Orders POST]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}

// ── GET /api/orders ───────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<unknown>>>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')));
  const skip = (page - 1) * limit;

  const isProvider = session.user.role === 'SERVICE_PROVIDER';
  const providerRecord = isProvider
    ? await prisma.serviceProvider.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
    : null;

  const where: Record<string, unknown> =
    isProvider && providerRecord
      ? { serviceProviderId: providerRecord.id }
      : { customerId: session.user.id };

  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        service: { select: { title: true, basePrice: true } },
        serviceProvider: {
          select: {
            businessName: true,
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
        payments: {
          select: { type: true, amount: true, createdAt: true, stripeStatus: true },
        },
        review: { select: { rating: true, comment: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: { items: orders, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
