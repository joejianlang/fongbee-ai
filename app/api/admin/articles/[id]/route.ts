import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  slug: z.string().min(1).max(100).optional(),
  author: z.string().optional(),
  tags: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  changesSummary: z.string().optional(),
});

/**
 * GET /api/admin/articles/[id]
 * 获取单个文章及其所有版本
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const article = await prisma.contentArticle.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ success: false, error: '文章不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: article.id,
        slug: article.slug,
        type: article.type,
        title: article.title,
        subtitle: article.subtitle,
        description: article.description,
        content: article.content,
        plainText: article.plainText,
        author: article.author,
        tags: article.tags,
        coverImage: article.coverImage,
        status: article.status,
        viewCount: article.viewCount,
        likeCount: article.likeCount,
        publishedAt: article.publishedAt?.toISOString(),
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        createdById: article.createdById,
        versions: article.versions.map((v) => ({
          version: v.version,
          title: v.title,
          changesSummary: v.changesSummary,
          createdAt: v.createdAt.toISOString(),
          editorId: v.editorId,
        })),
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
 * PATCH /api/admin/articles/[id]
 * 更新文章（创建新版本）
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await req.json();
    const updates = updateArticleSchema.parse(body);

    const article = await prisma.contentArticle.findUnique({
      where: { id: params.id },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (!article) {
      return NextResponse.json({ success: false, error: '文章不存在' }, { status: 404 });
    }

    // 生成纯文本
    const plainText =
      updates.content?.replace(/<[^>]*>/g, '').trim() ||
      article.plainText;

    // 更新文章
    const updatedArticle = await prisma.contentArticle.update({
      where: { id: params.id },
      data: {
        ...updates,
        plainText,
        publishedAt: updates.status === 'PUBLISHED' ? new Date() : article.publishedAt,
      },
    });

    // 创建新版本
    const lastVersion = article.versions[0];
    const newVersion = await prisma.contentArticleVersion.create({
      data: {
        articleId: article.id,
        version: (lastVersion?.version || 0) + 1,
        title: updates.title || article.title,
        subtitle: updates.subtitle !== undefined ? updates.subtitle : article.subtitle,
        description: updates.description !== undefined ? updates.description : article.description,
        content: updates.content || article.content,
        plainText,
        changesSummary: updates.changesSummary || 'Updated',
        previousVersion: lastVersion?.version,
      },
    });

    // Admin log
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        resourceType: 'ContentArticle',
        resourceId: article.id,
        changesJson: JSON.stringify(updates),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedArticle.id,
        slug: updatedArticle.slug,
        type: updatedArticle.type,
        title: updatedArticle.title,
        subtitle: updatedArticle.subtitle,
        description: updatedArticle.description,
        content: updatedArticle.content,
        plainText: updatedArticle.plainText,
        author: updatedArticle.author,
        tags: updatedArticle.tags,
        coverImage: updatedArticle.coverImage,
        status: updatedArticle.status,
        viewCount: updatedArticle.viewCount,
        likeCount: updatedArticle.likeCount,
        publishedAt: updatedArticle.publishedAt?.toISOString(),
        createdAt: updatedArticle.createdAt.toISOString(),
        updatedAt: updatedArticle.updatedAt.toISOString(),
        createdById: updatedArticle.createdById,
        newVersion: newVersion.version,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新文章失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/articles/[id]
 * 删除文章（软删除，归档）
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const article = await prisma.contentArticle.findUnique({
      where: { id: params.id },
    });

    if (!article) {
      return NextResponse.json({ success: false, error: '文章不存在' }, { status: 404 });
    }

    // 软删除 - 改为ARCHIVED状态
    await prisma.contentArticle.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    });

    // Admin log
    await prisma.adminLog.create({
      data: {
        action: 'DELETE',
        resourceType: 'ContentArticle',
        resourceId: article.id,
      },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除文章失败' },
      { status: 500 }
    );
  }
}
