/**
 * GET /api/feed/articles/[id]
 *
 * Public endpoint: get single article and record a view interaction.
 * Increments Article.viewCount.
 * If user is authenticated, also creates/updates UserArticleInteraction.viewedAt.
 */

import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';

interface RouteParams {
  params: { id: string };
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id, isActive: true },
      include: {
        tags: { select: { tag: true, confidence: true } },
        feedSource: { select: { name: true, type: true, category: true, language: true } },
        embedding: { select: { model: true } },
      },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }

    // Increment view count (fire-and-forget)
    prisma.article
      .update({
        where: { id: params.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    // Record view interaction for authenticated users
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (userId) {
      prisma.userArticleInteraction
        .upsert({
          where: { userId_articleId: { userId, articleId: params.id } },
          create: { userId, articleId: params.id, viewedAt: new Date() },
          update: { viewedAt: new Date() },
        })
        .catch(() => {});
    }

    return NextResponse.json({ success: true, data: article });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
