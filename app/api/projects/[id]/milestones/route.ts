// GET  /api/projects/:id/milestones — 查看项目里程碑列表
// POST /api/projects/:id/milestones/:milestoneId/pay — 为单个里程碑付款（在 [id] route 处理）

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { ApiResponse } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { customerId: true, serviceProviderId: true },
  });
  if (!project) {
    return NextResponse.json({ success: false, message: '项目不存在' }, { status: 404 });
  }

  // 权限检查
  const sp = session.user.role === 'SERVICE_PROVIDER'
    ? await prisma.serviceProvider.findFirst({ where: { userId: session.user.id }, select: { id: true } })
    : null;

  const hasAccess =
    project.customerId === session.user.id ||
    (sp && sp.id === project.serviceProviderId) ||
    session.user.role === 'ADMIN';

  if (!hasAccess) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const milestones = await prisma.milestone.findMany({
    where: { projectId: params.id },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          depositAmount: true,
          totalAmount: true,
          stripeIntentId: true,
        },
      },
    },
    orderBy: { milestoneNumber: 'asc' },
  });

  return NextResponse.json({
    success: true,
    data: milestones.map((m) => ({
      id: m.id,
      milestoneNumber: m.milestoneNumber,
      title: m.title,
      description: m.description,
      startDate: m.startDate,
      endDate: m.endDate,
      actualStartDate: m.actualStartDate,
      actualEndDate: m.actualEndDate,
      deliverables: m.deliverables,
      amount: Number(m.amount),
      depositPercentage: m.depositPercentage,
      status: m.status,
      paymentStatus: m.paymentStatus,
      order: m.order
        ? {
            id: m.order.id,
            status: m.order.status,
            depositAmount: Number(m.order.depositAmount),
            totalAmount: Number(m.order.totalAmount),
          }
        : null,
    })),
  });
}
