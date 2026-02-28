/**
 * GET /api/admin/pipeline/stats
 * Real AI pipeline statistics from the database.
 * Requires ADMIN role.
 */

import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const now      = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Run all DB queries in parallel
    const [
      totalArticles,
      unprocessed,
      processedToday,
      failedToday,
      categoryDist,
      recentArticles,
    ] = await Promise.all([
      // Total active articles
      prisma.article.count({ where: { isActive: true } }),

      // Unprocessed: no aiProcessedAt
      prisma.article.count({
        where: { isActive: true, aiProcessedAt: null },
      }),

      // Processed today: has aiProcessedAt today
      prisma.article.count({
        where: {
          isActive: true,
          aiProcessedAt: { gte: dayStart },
        },
      }),

      // Failed today: created today but still unprocessed
      prisma.article.count({
        where: {
          isActive: true,
          aiProcessedAt: null,
          createdAt: { gte: new Date(Date.now() - 24 * 3600000) },
        },
      }),

      // Category distribution
      prisma.article.groupBy({
        by: ['frontendCategory'],
        where: { isActive: true, frontendCategory: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Recent 10 articles with step info
      prisma.article.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          aiProcessedAt: true,
          frontendCategory: true,
          feedSource: { select: { name: true } },
          tags: { select: { tag: true }, take: 3 },
          embedding: {
            select: { id: true },
          },
        },
      }),
    ]);

    // Build recent log with per-step status
    const recent = recentArticles.map((a) => {
      const processed  = !!a.aiProcessedAt;
      const hasEmbedding = !!a.embedding;

      let status: 'success' | 'partial' | 'failed' = 'failed';
      if (processed && hasEmbedding) status = 'success';
      else if (processed) status = 'partial';

      return {
        id:       a.id,
        title:    `${a.feedSource?.name ?? 'Unknown'}: ${a.title}`,
        status,
        category: a.frontendCategory,
        steps: {
          summary:   processed,
          tags:      a.tags.length > 0,
          sentiment: processed,
          embedding: hasEmbedding,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        unprocessed,
        processedToday,
        failedToday,
        totalArticles,
        categoryDist: categoryDist.map((c) => ({
          name:  c.frontendCategory ?? '未分类',
          count: c._count.id,
        })),
        recent,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
