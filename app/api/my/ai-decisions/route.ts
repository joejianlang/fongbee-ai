/**
 * GET /api/my/ai-decisions
 *
 * CPPA 算法透明度 — 查询当前用户的 AI 决策日志
 *
 * Query params:
 *   page         — 页码（默认 1）
 *   limit        — 每页条数（默认 10，最大 50）
 *   decisionType — 过滤类型（可选）: CONTENT_RECOMMENDATION | SERVICE_RANKING |
 *                  PRICE_SUGGESTION | FRAUD_DETECTION | CONTRACT_ANALYSIS
 *   from         — 开始日期 ISO 字符串（可选）
 *   to           — 结束日期 ISO 字符串（可选）
 *
 * 用户可据此了解平台 AI 如何影响其体验，并提出申诉（appealUrl）
 */

import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { Prisma } from '@prisma/client';

const querySchema = z.object({
  page:         z.coerce.number().min(1).default(1),
  limit:        z.coerce.number().min(1).max(50).default(10),
  decisionType: z.enum([
    'CONTENT_RECOMMENDATION',
    'SERVICE_RANKING',
    'PRICE_SUGGESTION',
    'FRAUD_DETECTION',
    'CONTRACT_ANALYSIS',
  ]).optional(),
  from: z.string().optional(),
  to:   z.string().optional(),
});

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<unknown>>>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    page:         sp.get('page'),
    limit:        sp.get('limit'),
    decisionType: sp.get('decisionType') || undefined,
    from:         sp.get('from') || undefined,
    to:           sp.get('to')   || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { page, limit, decisionType, from, to } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.AIDecisionLogWhereInput = { userId: session.user.id };

  if (decisionType) where.decisionType = decisionType;

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);
  }

  const [logs, total] = await Promise.all([
    prisma.aIDecisionLog.findMany({
      where,
      select: {
        id:           true,
        decisionType: true,
        inputSummary: true,
        outputSummary:true,
        explanation:  true,
        modelUsed:    true,
        costUsd:      true,
        appealUrl:    true,
        createdAt:    true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take:  limit,
    }),
    prisma.aIDecisionLog.count({ where }),
  ]);

  // 每条记录的 explanation 是中英文 JSON，直接透传
  const items = logs.map((log) => ({
    ...log,
    explanationParsed: (() => {
      try { return JSON.parse(log.explanation); } catch { return log.explanation; }
    })(),
  }));

  return NextResponse.json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
