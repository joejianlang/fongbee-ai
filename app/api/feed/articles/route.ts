/**
 * GET /api/feed/articles
 *
 * Public endpoint: paginated article listing with filters.
 * Query params:
 *   page (default 1)
 *   limit (default 10, max 50)
 *   category (FeedSource.category filter)
 *   sentiment ("positive"|"negative"|"neutral")
 *   tag (filter by ArticleTag.tag)
 *   search (title contains, case-insensitive)
 *   feedSourceId
 *   sortBy ("latest"|"popular"|"trending", default "latest")
 */

import { prisma } from '@/lib/db';
import type { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.string().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  feedSourceId: z.string().optional(),
  sortBy: z.enum(['latest', 'popular', 'trending']).default('latest'),
});

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<unknown>>>> {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const params = querySchema.parse(searchParams);

    const { page, limit, category, sentiment, tag, search, feedSourceId, sortBy } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { isActive: true };

    if (sentiment) where.sentiment = sentiment;
    if (feedSourceId) where.feedSourceId = feedSourceId;
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.feedSource = { category };
    }
    if (tag) {
      where.tags = {
        some: { tag: { equals: tag, mode: 'insensitive' } },
      };
    }

    // Build orderBy
    let orderBy: Record<string, string>;
    switch (sortBy) {
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'trending':
        orderBy = { likeCount: 'desc' };
        break;
      default:
        orderBy = { publishedAt: 'desc' };
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          tags: { select: { tag: true, confidence: true } },
          feedSource: { select: { name: true, type: true, category: true } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: articles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' } as ApiResponse<PaginatedResponse<unknown>>,
        { status: 400 }
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: msg } as ApiResponse<PaginatedResponse<unknown>>,
      { status: 500 }
    );
  }
}
