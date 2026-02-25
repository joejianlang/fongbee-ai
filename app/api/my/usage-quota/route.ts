/**
 * GET /api/my/usage-quota
 *
 * 查询当前用户的 AI Token 使用量（今日 / 历史）
 *
 * Query params:
 *   date — 查询日期 YYYY-MM-DD（默认今天）
 */

import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const dateParam = req.nextUrl.searchParams.get('date');
  const targetDate = dateParam ? new Date(dateParam) : new Date();

  // 对齐到 UTC 日期开始（去掉时分秒）
  const dayStart = new Date(
    Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate())
  );
  const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);

  const quota = await prisma.aIUsageQuota.findFirst({
    where: {
      userId: session.user.id,
      date:   { gte: dayStart, lte: dayEnd },
    },
  });

  const tokensUsed  = quota?.tokensUsed  ?? 0;
  const tokensLimit = quota?.tokensLimit ?? 50000;

  return NextResponse.json({
    success: true,
    data: {
      date:              dayStart.toISOString().split('T')[0],
      tokensUsed,
      tokensLimit,
      tokensRemaining:   Math.max(0, tokensLimit - tokensUsed),
      usagePercentage:   Math.round((tokensUsed / tokensLimit) * 100),
      costUsd:           quota?.costUsd ?? 0,
    },
  });
}
