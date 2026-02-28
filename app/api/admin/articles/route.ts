import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createArticleSchema = z.object({
  type: z.enum([
    'USER_AGREEMENT',
    'PROVIDER_AGREEMENT',
    'PARTNER_AGREEMENT',
    'CONFIDENTIALITY_AGREEMENT',
    'ANNOUNCEMENT',
    'KNOWLEDGE_ARTICLE',
    'FORUM_RULES',
  ]),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  content: z.string().min(1),
  slug: z.string().min(1).max(100),
  author: z.string().optional(),
  tags: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

export interface ContentArticleDetail {
  id: string;
  slug: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  content: string;
  plainText?: string;
  author?: string;
  tags?: string;
  coverImage?: string;
  status: string;
  viewCount: number;
  likeCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
}

const getQuerySchema = z.object({
  type:   z.string().optional(),
  status: z.string().optional(),
  page:   z.coerce.number().min(1).default(1),
  limit:  z.coerce.number().min(1).max(100).default(10),
});

/**
 * GET /api/admin/articles
 * 获取内容文章列表（分页）
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<ContentArticleDetail>>>> {
  try {
    const sp = req.nextUrl.searchParams;
    const parsed = getQuerySchema.safeParse({
      type:   sp.get('type')   || undefined,
      status: sp.get('status') || undefined,
      page:   sp.get('page')   || undefined,
      limit:  sp.get('limit')  || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { type, status, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type)   where.type   = type;
    if (status) where.status = status;

    const [articles, total] = await Promise.all([
      prisma.contentArticle.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contentArticle.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: articles.map((a) => ({
          id: a.id,
          slug: a.slug,
          type: a.type,
          title: a.title,
          subtitle: a.subtitle ?? undefined,
          description: a.description ?? undefined,
          content: a.content,
          plainText: a.plainText ?? undefined,
          author: a.author ?? undefined,
          tags: a.tags ?? undefined,
          coverImage: a.coverImage ?? undefined,
          status: a.status,
          viewCount: a.viewCount,
          likeCount: a.likeCount,
          publishedAt: a.publishedAt?.toISOString(),
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
          createdById: a.createdById ?? undefined,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取文章失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/articles
 * 创建新文章（自动创建第一个版本）
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<ContentArticleDetail>>> {
  try {
    const body = await req.json();
    const data = createArticleSchema.parse(body);

    // 从HTML生成纯文本
    const plainText = data.content
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();

    const article = await prisma.contentArticle.create({
      data: {
        ...data,
        plainText,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
    });

    // 创建第一个版本
    await prisma.contentArticleVersion.create({
      data: {
        articleId: article.id,
        version: 1,
        title: article.title,
        subtitle: article.subtitle,
        description: article.description,
        content: article.content,
        plainText: plainText,
        changesSummary: 'Initial version',
      },
    });

    // Admin log
    await prisma.adminLog.create({
      data: {
        action: 'CREATE',
        resourceType: 'ContentArticle',
        resourceId: article.id,
        changesJson: JSON.stringify(data),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: article.id,
        slug: article.slug,
        type: article.type,
        title: article.title,
        subtitle: article.subtitle ?? undefined,
        description: article.description ?? undefined,
        content: article.content,
        plainText: plainText,
        author: article.author ?? undefined,
        tags: article.tags ?? undefined,
        coverImage: article.coverImage ?? undefined,
        status: article.status,
        viewCount: article.viewCount,
        likeCount: article.likeCount,
        publishedAt: article.publishedAt?.toISOString(),
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        createdById: article.createdById ?? undefined,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建文章失败' },
      { status: 500 }
    );
  }
}
