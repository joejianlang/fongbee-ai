/**
 * POST /api/feed/articles/[id]/interact
 *
 * Authenticated: record like/bookmark/share interaction.
 * Updates UserArticleInteraction and Article counters.
 * Updates UserInterest weights for all article tags (+0.1 per interaction).
 *
 * Body: { action: "like"|"bookmark"|"share" }
 */

import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/auth-options';
import { z } from 'zod';

const interactSchema = z.object({
  action: z.enum(['like', 'bookmark', 'share']),
});

interface RouteParams {
  params: { id: string };
}

const INTEREST_WEIGHT_DELTA: Record<string, number> = {
  like: 0.2,
  bookmark: 0.3,
  share: 0.1,
};

export async function POST(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body: unknown = await req.json();
    const { action } = interactSchema.parse(body);

    // Check article exists
    const article = await prisma.article.findUnique({
      where: { id: params.id, isActive: true },
      include: { tags: { select: { tag: true } } },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }

    // Upsert interaction
    const updateData: Record<string, unknown> = {};
    const createData: Record<string, unknown> = {
      userId,
      articleId: params.id,
    };

    if (action === 'like') {
      updateData.isLiked = true;
      createData.isLiked = true;
    } else if (action === 'bookmark') {
      updateData.isBookmarked = true;
      createData.isBookmarked = true;
    } else if (action === 'share') {
      updateData.isShared = true;
      createData.isShared = true;
    }

    await prisma.userArticleInteraction.upsert({
      where: { userId_articleId: { userId, articleId: params.id } },
      create: createData as Parameters<typeof prisma.userArticleInteraction.create>[0]['data'],
      update: updateData,
    });

    // Update article counter
    if (action === 'like') {
      await prisma.article.update({
        where: { id: params.id },
        data: { likeCount: { increment: 1 } },
      });
    } else if (action === 'share') {
      await prisma.article.update({
        where: { id: params.id },
        data: { shareCount: { increment: 1 } },
      });
    }

    // Update UserInterest weights for all article tags
    const weightDelta = INTEREST_WEIGHT_DELTA[action] ?? 0.1;
    for (const tagRecord of article.tags) {
      await prisma.userInterest.upsert({
        where: { userId_tag: { userId, tag: tagRecord.tag } },
        create: { userId, tag: tagRecord.tag, weight: 1.0 + weightDelta },
        update: { weight: { increment: weightDelta } },
      });
    }

    // Log AI decision for CPPA compliance (CONTENT_RECOMMENDATION)
    await prisma.aIDecisionLog.create({
      data: {
        userId,
        decisionType: 'CONTENT_RECOMMENDATION',
        inputSummary: `User ${action}d article: ${article.title.slice(0, 80)}`,
        outputSummary: `Interest weights updated for ${article.tags.length} tags (+${weightDelta} each)`,
        explanation: JSON.stringify({
          en: `Your ${action} action has been recorded and will improve your personalized feed.`,
          zh: `您的${action}操作已记录，将改善您的个性化信息流。`,
        }),
        modelUsed: 'none',
        costUsd: 0,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `${action} recorded`,
      data: { action, articleId: params.id },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid action', data: err.errors },
        { status: 400 }
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
