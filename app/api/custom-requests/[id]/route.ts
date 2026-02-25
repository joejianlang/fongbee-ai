// GET /api/custom-requests/:id — 查看需求详情（含 bids）

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { ApiResponse } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const customRequest = await prisma.customRequest.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      template: {
        select: {
          id: true,
          name: true,
          steps: {
            orderBy: { stepNumber: 'asc' },
            include: { fields: { orderBy: { displayOrder: 'asc' } } },
          },
        },
      },
      bids: {
        include: {
          serviceProvider: {
            select: {
              id: true,
              businessName: true,
              averageRating: true,
              totalReviews: true,
              isVerified: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      selectedBid: {
        include: {
          serviceProvider: { select: { id: true, businessName: true } },
        },
      },
    },
  });

  if (!customRequest) {
    return NextResponse.json({ success: false, message: '需求不存在' }, { status: 404 });
  }

  // 权限: 客户本人、服务商、管理员
  const isCustomer = customRequest.customerId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';

  if (!isCustomer && !isAdmin) {
    // 允许任何 SERVICE_PROVIDER 查看公开需求详情
    if (session.user.role !== 'SERVICE_PROVIDER') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      id: customRequest.id,
      requestNumber: customRequest.requestNumber,
      status: customRequest.status,
      formResponses: JSON.parse(customRequest.formResponsesJson),
      template: customRequest.template,
      biddingDeadline: customRequest.biddingDeadline,
      bids: customRequest.bids.map((b) => ({
        id: b.id,
        amount: Number(b.amount),
        estimatedDuration: b.estimatedDuration,
        proposal: b.proposal,
        status: b.status,
        isSelected: b.isSelected,
        serviceProvider: b.serviceProvider,
        createdAt: b.createdAt,
      })),
      selectedBid: customRequest.selectedBid
        ? {
            id: customRequest.selectedBid.id,
            amount: Number(customRequest.selectedBid.amount),
            serviceProvider: customRequest.selectedBid.serviceProvider,
          }
        : null,
      createdAt: customRequest.createdAt,
    },
  });
}
