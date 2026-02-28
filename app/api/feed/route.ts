import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth-options';
import { z } from 'zod';

const CITY_TAGS: Record<string, string[]> = {
  Toronto:   ['Toronto', '多伦多', 'GTA', 'Brampton', 'Mississauga', 'Markham', 'Scarborough', 'North York', '约克'],
  Vancouver: ['Vancouver', '温哥华', 'Surrey', 'Burnaby', 'Richmond', '列治文', '本拿比', 'Coquitlam', 'Langley'],
  Montreal:  ['Montreal', '蒙特利尔', 'Quebec', '魁北克', 'Laval'],
  Calgary:   ['Calgary', '卡尔加里', 'Alberta', '阿尔伯塔'],
  Ottawa:    ['Ottawa', '渥太华', 'Gatineau'],
  Guelph:    ['Guelph', '圭尔夫', 'Waterloo', 'Kitchener', 'Cambridge', 'KW', '滑铁卢', '基奇纳'],
};

const getFeedSchema = z.object({
  page:     z.coerce.number().default(1),
  limit:    z.coerce.number().default(10),
  category: z.string().optional(),
  city:     z.string().optional(),
  sortBy:   z.enum(['latest', 'popular', 'trending']).default('latest'),
});

/**
 * GET /api/feed
 *
 * 过滤策略由数据库 news_categories.filter_type 动态驱动：
 *   ALL            → 全部内容，不过滤
 *   USER_INTERESTS → 按登录用户的 UserInterest 标签匹配
 *   RSS_SOURCE     → feedSource.type === 'RSS'
 *   YOUTUBE_SOURCE → feedSource.type === 'YOUTUBE'
 *   KEYWORDS       → 按分类 keywords JSON 匹配 article_tags.tag 或 frontendCategory
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<any>>>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const params = getFeedSchema.parse({
      page:     searchParams.get('page')     ?? undefined,
      limit:    searchParams.get('limit')    ?? undefined,
      category: searchParams.get('category') ?? undefined,
      city:     searchParams.get('city')     ?? undefined,
      sortBy:   searchParams.get('sortBy')   ?? undefined,
    });

    const session = await getServerSession(authOptions);
    const userId  = (session?.user as { id?: string } | undefined)?.id ?? null;
    const skip    = (params.page - 1) * params.limit;

    // ── User interests (only needed for USER_INTERESTS filter) ─────────────
    const userInterests = userId
      ? await prisma.userInterest.findMany({
          where:  { userId },
          select: { tag: true },
        })
      : [];
    const interestTags = userInterests.map((i: { tag: string }) => i.tag);

    // ── Build base where ────────────────────────────────────────────────────
    const where: any = { isActive: true };

    // ── Resolve category filter from DB ─────────────────────────────────────
    const catName = params.category;
    if (catName && catName !== '全部') {
      const catConfig = await prisma.newsCategory.findFirst({
        where:  { name: catName, isActive: true },
        select: { filterType: true, keywords: true },
      });

      const filterType = catConfig?.filterType ?? 'KEYWORDS';
      const keywords: string[] = catConfig?.keywords
        ? (() => { try { return JSON.parse(catConfig.keywords); } catch { return []; } })()
        : [];

      switch (filterType) {
        case 'ALL':
          // no additional filter
          break;

        case 'USER_INTERESTS':
          if (interestTags.length > 0) {
            where.tags = { some: { tag: { in: interestTags } } };
          }
          break;

        case 'RSS_SOURCE':
          where.feedSource = { type: 'RSS' };
          break;

        case 'YOUTUBE_SOURCE':
          where.feedSource = { type: 'YOUTUBE' };
          break;

        case 'GEO_BASED': {
          const cityName = params.city ?? (session?.user as any)?.city ?? null;
          if (cityName) {
            const cityKeywords = CITY_TAGS[cityName] ?? [cityName];
            where.OR = [
              { tags: { some: { tag: { in: cityKeywords } } } },
              { frontendCategory: { in: cityKeywords } },
            ];
          }
          break;
        }

        case 'KEYWORDS':
        default:
          // Match by keywords in article_tags OR frontendCategory string (legacy)
          if (keywords.length > 0) {
            where.OR = [
              { frontendCategory: catName },
              { tags: { some: { tag: { in: keywords } } } },
            ];
          } else {
            // Fallback: exact frontendCategory match
            where.frontendCategory = catName;
          }
          break;
      }
    }

    // ── Sort ─────────────────────────────────────────────────────────────────
    let orderBy: any = { publishedAt: 'desc' };
    if (params.sortBy === 'popular') {
      orderBy = { viewCount: 'desc' };
    } else if (params.sortBy === 'trending') {
      where.publishedAt = {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };
      orderBy = { likeCount: 'desc' };
    }

    // ── Query ────────────────────────────────────────────────────────────────
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          tags: { select: { tag: true } },
          newsCategory: { select: { name: true, icon: true } },
          ...(userId
            ? {
                userInteractions: {
                  where:  { userId },
                  select: { isLiked: true, isBookmarked: true, isShared: true },
                },
              }
            : {}),
        },
        skip,
        take:    params.limit,
        orderBy,
      }),
      prisma.article.count({ where }),
    ]);

    const enrichedArticles = articles.map((article: any) => ({
      ...article,
      tags:            article.tags.map((t: { tag: string }) => t.tag),
      userInteraction: article.userInteractions?.[0] ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items:      enrichedArticles,
        total,
        page:       params.page,
        limit:      params.limit,
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
