/**
 * GET /api/admin/data-deletions
 *
 * 管理员查看所有数据删除请求（CPPA 合规审计）
 *
 * Query params:
 *   status — PENDING | PROCESSING | COMPLETED | PARTIALLY_RETAINED
 *   page   — 页码（默认 1）
 *   limit  — 每页条数（默认 20）
 */

import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { Prisma } from '@prisma/client';

const querySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'PARTIALLY_RETAINED']).optional(),
  page:   z.coerce.number().min(1).default(1),
  limit:  z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<unknown>>>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    status: sp.get('status') || undefined,
    page:   sp.get('page'),
    limit:  sp.get('limit'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { status, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.DataDeletionRequestWhereInput = {};
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.dataDeletionRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, status: true, isAnonymized: true, createdAt: true },
        },
      },
      orderBy: { requestedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.dataDeletionRequest.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      items: requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
