// POST /api/custom-requests — 客户提交简单定制服务需求
// GET  /api/custom-requests — 列表（客户查自己/服务商查可投标）
//
// 流程: 客户填写表单 -> 服务商看到需求并报价(Bid) -> 客户选择报价 -> 生成 Order

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/auth-options';
import { ApiResponse } from '@/lib/types';

// ── 创建需求 schema ───────────────────────────────────────────────────────────
const createSchema = z.object({
  templateId: z.string(),
  formResponses: z.record(z.unknown()), // 表单答案 {fieldId: value}
  isDirected: z.boolean().default(false),
  directedTo: z.array(z.string()).optional(), // 指定服务商
  biddingDeadline: z.string().datetime().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  let validated: z.infer<typeof createSchema>;
  try {
    validated = createSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: '输入验证失败', error: error.errors[0].message },
        { status: 400 }
      );
    }
    throw error;
  }

  // 验证模板存在
  const template = await prisma.customServiceTemplate.findUnique({
    where: { id: validated.templateId },
    include: { steps: { include: { fields: true } } },
  });
  if (!template) {
    return NextResponse.json({ success: false, message: '服务模板不存在' }, { status: 404 });
  }

  // 生成请求编号
  const count = await prisma.customRequest.count();
  const requestNumber = `CRQ-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const customRequest = await prisma.customRequest.create({
    data: {
      requestNumber,
      customerId: session.user.id,
      templateId: validated.templateId,
      formResponsesJson: JSON.stringify(validated.formResponses),
      isDirected: validated.isDirected,
      directedToJson: validated.directedTo ? JSON.stringify(validated.directedTo) : null,
      isOpenToAll: !validated.isDirected,
      biddingDeadline: validated.biddingDeadline ? new Date(validated.biddingDeadline) : null,
    },
  });

  // 如果是定向需求，通知指定服务商
  if (validated.isDirected && validated.directedTo?.length) {
    // 获取服务商的 userId
    const providers = await prisma.serviceProvider.findMany({
      where: { id: { in: validated.directedTo } },
      select: { id: true, userId: true, businessName: true },
    });

    await prisma.notification.createMany({
      data: providers.map((p) => ({
        userId: p.userId,
        type: 'BID_RECEIVED',
        title: '收到定向服务需求',
        message: `客户 ${session.user.name ?? '匿名'} 向您发送了定向服务需求 ${requestNumber}，请查看并报价。`,
        relatedOrderId: null,
        actionUrl: `/app/custom-requests/${customRequest.id}`,
      })),
    });
  }

  return NextResponse.json({
    success: true,
    message: '需求提交成功',
    data: {
      id: customRequest.id,
      requestNumber: customRequest.requestNumber,
      status: customRequest.status,
    },
  });
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
  const status = searchParams.get('status');

  let where: Record<string, unknown>;

  if (session.user.role === 'CUSTOMER') {
    // 客户查看自己的需求
    where = {
      customerId: session.user.id,
      ...(status ? { status } : {}),
    };
  } else if (session.user.role === 'SERVICE_PROVIDER') {
    // 服务商查看可投标的需求
    const sp = await prisma.serviceProvider.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    where = {
      status: 'OPEN',
      OR: [
        { isOpenToAll: true },
        { isDirected: true, directedToJson: { contains: sp?.id ?? '' } },
      ],
    };
  } else if (session.user.role === 'ADMIN') {
    where = status ? { status } : {};
  } else {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const [items, total] = await Promise.all([
    prisma.customRequest.findMany({
      where: where as Prisma.CustomRequestWhereInput,
      include: {
        customer: { select: { id: true, firstName: true, avatar: true } },
        template: { select: { id: true, name: true } },
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customRequest.count({ where: where as Prisma.CustomRequestWhereInput }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      items: items.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        templateTitle: r.template.name,
        status: r.status,
        bidCount: r._count.bids,
        biddingDeadline: r.biddingDeadline,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
