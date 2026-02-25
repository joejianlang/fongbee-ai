// POST /api/custom-requests/:id/bids — 服务商提交报价
// GET  /api/custom-requests/:id/bids — 查看报价列表

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { ApiResponse } from '@/lib/types';

const bidSchema = z.object({
  amount: z.number().positive(),
  estimatedDuration: z.string().optional(),
  proposal: z.string().min(10).max(2000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'SERVICE_PROVIDER') {
    return NextResponse.json({ success: false, message: 'Forbidden: 仅服务商可报价' }, { status: 403 });
  }

  const body = await req.json();
  let validated: z.infer<typeof bidSchema>;
  try {
    validated = bidSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: '输入验证失败', error: error.errors[0].message },
        { status: 400 }
      );
    }
    throw error;
  }

  // 获取服务商记录
  const sp = await prisma.serviceProvider.findFirst({
    where: { userId: session.user.id },
    select: { id: true, businessName: true },
  });
  if (!sp) {
    return NextResponse.json({ success: false, message: '服务商账户不存在' }, { status: 404 });
  }

  // 检查需求
  const customRequest = await prisma.customRequest.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, customerId: true, requestNumber: true,
      isDirected: true, directedToJson: true, isOpenToAll: true, biddingDeadline: true },
  });
  if (!customRequest) {
    return NextResponse.json({ success: false, message: '需求不存在' }, { status: 404 });
  }
  if (customRequest.status !== 'OPEN') {
    return NextResponse.json({ success: false, message: '该需求已不接受报价' }, { status: 400 });
  }

  // 检查投标截止日期
  if (customRequest.biddingDeadline && new Date() > customRequest.biddingDeadline) {
    return NextResponse.json({ success: false, message: '投标已截止' }, { status: 400 });
  }

  // 检查定向需求
  if (customRequest.isDirected && !customRequest.isOpenToAll) {
    const allowedIds: string[] = customRequest.directedToJson
      ? JSON.parse(customRequest.directedToJson)
      : [];
    if (!allowedIds.includes(sp.id)) {
      return NextResponse.json({ success: false, message: '该需求为定向需求，您未在邀请列表' }, { status: 403 });
    }
  }

  // 检查是否已经报价
  const existingBid = await prisma.bid.findUnique({
    where: { customRequestId_serviceProviderId: { customRequestId: params.id, serviceProviderId: sp.id } },
  });
  if (existingBid) {
    return NextResponse.json({ success: false, message: '您已对此需求报价，请勿重复提交' }, { status: 409 });
  }

  const bid = await prisma.bid.create({
    data: {
      customRequestId: params.id,
      serviceProviderId: sp.id,
      amount: validated.amount,
      estimatedDuration: validated.estimatedDuration,
      proposal: validated.proposal,
    },
  });

  // 通知客户
  await prisma.notification.create({
    data: {
      userId: customRequest.customerId,
      type: 'BID_RECEIVED',
      title: '收到新报价',
      message: `服务商 ${sp.businessName} 对您的需求 ${customRequest.requestNumber} 提交了报价 CAD $${validated.amount.toFixed(2)}。`,
      actionUrl: `/app/custom-requests/${params.id}`,
    },
  });

  return NextResponse.json({
    success: true,
    message: '报价提交成功',
    data: {
      id: bid.id,
      amount: Number(bid.amount),
      status: bid.status,
    },
  });
}

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
    select: { customerId: true },
  });
  if (!customRequest) {
    return NextResponse.json({ success: false, message: '需求不存在' }, { status: 404 });
  }

  // 只有客户本人或管理员可以看所有报价
  if (customRequest.customerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const bids = await prisma.bid.findMany({
    where: { customRequestId: params.id },
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
    orderBy: { amount: 'asc' }, // 按价格升序
  });

  return NextResponse.json({
    success: true,
    data: bids.map((b) => ({
      id: b.id,
      amount: Number(b.amount),
      estimatedDuration: b.estimatedDuration,
      proposal: b.proposal,
      status: b.status,
      isSelected: b.isSelected,
      serviceProvider: b.serviceProvider,
      createdAt: b.createdAt,
    })),
  });
}
