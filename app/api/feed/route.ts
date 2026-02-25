import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const getFeedSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  categoryId: z.string().optional(),
  sortBy: z.enum(['latest', 'popular', 'trending']).default('latest'),
});

/**
 * GET /api/feed
 * 获取个性化新闻流
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<any>>>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const params = getFeedSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      categoryId: searchParams.get('categoryId'),
      sortBy: searchParams.get('sortBy'),
    });

    // TODO: Get user ID from session
    const userId = 'user-id';

    const skip = (params.page - 1) * params.limit;

    // Get user interests
    const userInterests = await prisma.userInterest.findMany({
      where: { userId },
      select: { tag: true, weight: true },
    });

    const interestTags = userInterests.map((i) => i.tag);

    // Build query
    const where: any = {
      isActive: true,
    };

    if (interestTags.length > 0) {
      where.tags = {
        some: {
          tag: {
            in: interestTags,
          },
        },
      };
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    if (params.sortBy === 'popular') {
      orderBy = { viewCount: 'desc' };
    } else if (params.sortBy === 'trending') {
      // Trending: recent + popular
      where.publishedAt = {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      };
      orderBy = { likeCount: 'desc' };
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          tags: {
            select: { tag: true },
          },
          userInteractions: {
            where: { userId },
            select: { isLiked: true, isBookmarked: true, isShared: true },
          },
        },
        skip,
        take: params.limit,
        orderBy,
      }),
      prisma.article.count({ where }),
    ]);

    // Enrich with user interaction data
    const enrichedArticles = articles.map((article) => ({
      ...article,
      tags: article.tags.map((t) => t.tag),
      userInteraction: article.userInteractions[0],
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: enrichedArticles,
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取 feed 失败',
      },
      { status: 500 }
    );
  }
}
