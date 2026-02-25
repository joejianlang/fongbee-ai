// POST /api/projects — 管理员或双方创建复杂项目
// GET  /api/projects — 列表（客户/服务商/管理员）

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/auth-options';
import { ApiResponse } from '@/lib/types';

const createProjectSchema = z.object({
  serviceProviderId: z.string(),
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  scope: z.string().optional(),
  location: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  estimatedStartDate: z.string().datetime(),
  estimatedEndDate: z.string().datetime(),
  totalProjectValue: z.number().positive(),
  milestones: z.array(z.object({
    milestoneNumber: z.number().int().positive(),
    title: z.string().min(2),
    description: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    deliverables: z.string().optional(),
    amount: z.number().positive(),
    depositPercentage: z.number().int().min(0).max(100).optional(),
  })).min(1).max(20),
});

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  // 客户或管理员可创建项目
  if (!['CUSTOMER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  let validated: z.infer<typeof createProjectSchema>;
  try {
    validated = createProjectSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: '输入验证失败', error: error.errors[0].message },
        { status: 400 }
      );
    }
    throw error;
  }

  // 验证里程碑金额之和 = 总金额
  const milestonesTotal = validated.milestones.reduce((sum, m) => sum + m.amount, 0);
  if (Math.abs(milestonesTotal - validated.totalProjectValue) > 0.01) {
    return NextResponse.json({
      success: false,
      message: `里程碑金额之和 (CAD $${milestonesTotal.toFixed(2)}) 必须等于项目总金额 (CAD $${validated.totalProjectValue.toFixed(2)})`,
    }, { status: 400 });
  }

  // 验证服务商存在
  const sp = await prisma.serviceProvider.findUnique({
    where: { id: validated.serviceProviderId },
    select: { id: true },
  });
  if (!sp) {
    return NextResponse.json({ success: false, message: '服务商不存在' }, { status: 404 });
  }

  // 生成项目编号
  const count = await prisma.project.count();
  const projectNumber = `PRJ-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  // 获取支付政策 (COMPLEX_PROJECT)
  const paymentPolicy = await prisma.paymentPolicy.findFirst({
    where: { serviceType: 'COMPLEX_PROJECT', serviceCategoryId: null },
  });

  // 事务: 创建项目 + 里程碑
  const project = await prisma.$transaction(async (tx) => {
    const proj = await tx.project.create({
      data: {
        projectNumber,
        customerId: session.user.id,
        serviceProviderId: validated.serviceProviderId,
        title: validated.title,
        description: validated.description,
        scope: validated.scope,
        location: validated.location,
        latitude: validated.latitude,
        longitude: validated.longitude,
        estimatedStartDate: new Date(validated.estimatedStartDate),
        estimatedEndDate: new Date(validated.estimatedEndDate),
        totalProjectValue: validated.totalProjectValue,
        paymentPolicyId: paymentPolicy?.id,
        status: 'DRAFT',
      },
    });

    // 创建里程碑
    await tx.milestone.createMany({
      data: validated.milestones.map((m) => ({
        projectId: proj.id,
        serviceProviderId: validated.serviceProviderId,
        milestoneNumber: m.milestoneNumber,
        title: m.title,
        description: m.description,
        startDate: new Date(m.startDate),
        endDate: new Date(m.endDate),
        deliverables: m.deliverables,
        amount: m.amount,
        depositPercentage: m.depositPercentage ?? 30,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      })),
    });

    return proj;
  });

  return NextResponse.json({
    success: true,
    message: '项目创建成功，请创建合同',
    data: {
      id: project.id,
      projectNumber: project.projectNumber,
      status: project.status,
      totalProjectValue: validated.totalProjectValue,
      milestoneCount: validated.milestones.length,
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

  let where: Record<string, unknown> = {};

  if (session.user.role === 'CUSTOMER') {
    where = { customerId: session.user.id, ...(status ? { status } : {}) };
  } else if (session.user.role === 'SERVICE_PROVIDER') {
    const sp = await prisma.serviceProvider.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    where = { serviceProviderId: sp?.id, ...(status ? { status } : {}) };
  } else if (session.user.role === 'ADMIN') {
    where = status ? { status } : {};
  }

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where: where as Prisma.ProjectWhereInput,
      include: {
        customer: { select: { id: true, firstName: true, avatar: true } },
        serviceProvider: { select: { id: true, businessName: true } },
        _count: { select: { milestones: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where: where as Prisma.ProjectWhereInput }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      items: items.map((p) => ({
        id: p.id,
        projectNumber: p.projectNumber,
        title: p.title,
        status: p.status,
        totalProjectValue: Number(p.totalProjectValue),
        milestoneCount: p._count.milestones,
        customer: p.customer,
        serviceProvider: p.serviceProvider,
        estimatedStartDate: p.estimatedStartDate,
        estimatedEndDate: p.estimatedEndDate,
        createdAt: p.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
