/**
 * CPPA 第 7 条 — 被遗忘权（Right to Erasure）
 *
 * POST /api/my/data-deletion
 *   提交删除请求，写入 DataDeletionRequest (status=PENDING)
 *   后台 Cron (/api/cron/process-deletions) 将在 30 天内完成匿名化
 *   财务记录（Order、Payment）保留 7 年（PIPEDA/CRA 要求）
 *
 * GET /api/my/data-deletion
 *   查询当前用户的删除请求状态
 */

import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';

export async function POST(_req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // 防止重复提交（如已有 PENDING / PROCESSING 请求）
  const existing = await prisma.dataDeletionRequest.findFirst({
    where: { userId, status: { in: ['PENDING', 'PROCESSING'] } },
    orderBy: { requestedAt: 'desc' },
  });

  if (existing) {
    return NextResponse.json(
      {
        success: false,
        message: '您已有一个正在处理的删除请求',
        data: { requestId: existing.id, status: existing.status, requestedAt: existing.requestedAt },
      },
      { status: 409 }
    );
  }

  // 创建删除请求
  const request = await prisma.dataDeletionRequest.create({
    data: {
      userId,
      status: 'PENDING',
      retentionReason: '财务记录（订单、支付）依据加拿大税法保留 7 年（PIPEDA/CRA 合规）',
    },
  });

  // 通知用户
  await prisma.notification.create({
    data: {
      userId,
      type: 'SYSTEM_ALERT',
      title: '数据删除请求已提交',
      message: '您的账户数据删除请求已收到。我们将在 30 天内完成匿名化处理，届时您将收到确认通知。财务记录因法律要求将保留 7 年。',
      actionUrl: '/app/settings/data-deletion',
    },
  });

  return NextResponse.json(
    {
      success: true,
      message: '删除请求已提交，我们将在 30 天内完成处理',
      data: {
        requestId:       request.id,
        status:          request.status,
        requestedAt:     request.requestedAt,
        retentionReason: request.retentionReason,
        estimatedCompletionDays: 30,
      },
    },
    { status: 201 }
  );
}

export async function GET(_req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const requests = await prisma.dataDeletionRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { requestedAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: requests,
  });
}
