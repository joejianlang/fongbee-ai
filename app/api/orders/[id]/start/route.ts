/**
 * POST /api/orders/:id/start
 *
 * 用户确认"开始工作"
 * CAPTURED → IN_PROGRESS
 * 此时定金从托管转给服务商
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { ApiResponse } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { escrow: true },
  });
  if (!order) return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 });
  if (order.customerId !== session.user.id) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }
  if (order.status !== 'CAPTURED') {
    return NextResponse.json({ success: false, message: `状态 ${order.status} 不允许开始工作` }, { status: 400 });
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.order.update({
      where: { id: params.id },
      data: { status: 'IN_PROGRESS', actualStartTime: now },
    }),
    // 托管定金释放给服务商
    ...(order.escrow
      ? [
          prisma.escrow.update({
            where: { id: order.escrow.id },
            data: {
              status: 'RELEASED_TO_PROVIDER',
              releasedAt: now,
              releasedTo: order.serviceProviderId,
            },
          }),
        ]
      : []),
    // 通知服务商
    prisma.notification.create({
      data: {
        userId: order.serviceProviderId, // 注意: serviceProviderId 是 ServiceProvider.id，需通过 user 关联
        type: 'ORDER_STARTED',
        title: '服务已开始',
        message: `客户已确认开始，订单 ${order.orderNumber} 进入进行中状态。`,
        relatedOrderId: order.id,
        actionUrl: `/app/orders/${order.id}`,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: '服务已开始',
    data: { orderId: order.id, status: 'IN_PROGRESS', actualStartTime: now },
  });
}
