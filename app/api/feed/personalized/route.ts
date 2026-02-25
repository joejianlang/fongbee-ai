/**
 * GET /api/feed/personalized
 *
 * Authenticated: Returns a personalized feed based on:
 * 1. Embedding-based cosine similarity (if user has viewed articles)
 * 2. Tag matching against UserInterest weights
 * 3. Falls back to latest articles if no history
 *
 * Query params:
 *   page (default 1)
 *   limit (default 10, max 50)
 *
 * CPPA: AI decision logged to AIDecisionLog.
 */

import { prisma } from '@/lib/db';
import type { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ── Cosine Similarity (in-memory, no pgvector) ────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    normA += (a[i] ?? 0) ** 2;
    normB += (b[i] ?? 0) ** 2;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Personalized Feed ─────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<unknown>>>> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' } as ApiResponse<PaginatedResponse<unknown>>,
      { status: 401 }
    );
  }

  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { page, limit } = querySchema.parse(searchParams);
    const skip = (page - 1) * limit;

    // Fetch user interests (tag weights)
    const userInterests = await prisma.userInterest.findMany({
      where: { userId },
      orderBy: { weight: 'desc' },
      take: 20,
    });

    const interestTags = userInterests.map((i) => i.tag);
    const tagWeightMap = new Map(userInterests.map((i) => [i.tag, i.weight]));

    // Fetch user's recently viewed article IDs to exclude
    const viewedInteractions = await prisma.userArticleInteraction.findMany({
      where: { userId, viewedAt: { not: null } },
      select: { articleId: true },
      orderBy: { viewedAt: 'desc' },
      take: 100,
    });
    const viewedIds = new Set(viewedInteractions.map((v) => v.articleId));

    // Fetch candidate articles
    // Strategy: if user has interests, prefer tag-matching articles
    // Otherwise, fall back to latest
    let candidateWhere: Record<string, unknown> = { isActive: true };

    if (interestTags.length > 0) {
      candidateWhere = {
        isActive: true,
        tags: {
          some: { tag: { in: interestTags } },
        },
      };
    }

    const CANDIDATE_POOL = Math.max(limit * 5, 100);

    const candidates = await prisma.article.findMany({
      where: candidateWhere,
      orderBy: { publishedAt: 'desc' },
      take: CANDIDATE_POOL,
      include: {
        tags: { select: { tag: true, confidence: true } },
        embedding: { select: { vectorJson: true } },
        feedSource: { select: { name: true, type: true, category: true } },
      },
    });

    // Fetch user's liked article embeddings for similarity computation
    const likedInteractions = await prisma.userArticleInteraction.findMany({
      where: { userId, isLiked: true },
      select: { articleId: true },
      take: 10,
    });

    let userVector: number[] | null = null;
    if (likedInteractions.length > 0) {
      const likedEmbeddings = await prisma.articleEmbedding.findMany({
        where: { articleId: { in: likedInteractions.map((l) => l.articleId) } },
        select: { vectorJson: true },
      });

      if (likedEmbeddings.length > 0) {
        // Average the liked article vectors
        const vectors = likedEmbeddings
          .map((e) => {
            try {
              return JSON.parse(e.vectorJson) as number[];
            } catch {
              return null;
            }
          })
          .filter((v): v is number[] => v !== null);

        if (vectors.length > 0 && vectors[0]) {
          const dim = vectors[0].length;
          const avgVector = new Array<number>(dim).fill(0);
          for (const vec of vectors) {
            for (let i = 0; i < dim; i++) {
              avgVector[i] = (avgVector[i] ?? 0) + (vec[i] ?? 0);
            }
          }
          for (let i = 0; i < dim; i++) {
            avgVector[i] = (avgVector[i] ?? 0) / vectors.length;
          }
          userVector = avgVector;
        }
      }
    }

    // Score each candidate
    interface ScoredArticle {
      article: (typeof candidates)[0];
      score: number;
    }

    const scored: ScoredArticle[] = candidates.map((article) => {
      let score = 0;

      // Tag-based score
      for (const tagRecord of article.tags) {
        const weight = tagWeightMap.get(tagRecord.tag) ?? 0;
        score += weight * (tagRecord.confidence ?? 1.0);
      }

      // Embedding similarity score (if available)
      if (userVector && article.embedding?.vectorJson) {
        try {
          const articleVector = JSON.parse(article.embedding.vectorJson) as number[];
          const similarity = cosineSimilarity(userVector, articleVector);
          score += similarity * 2; // Weight embedding score higher
        } catch {
          // Ignore parse errors
        }
      }

      // Recency boost (decay over 7 days)
      const ageMs = Date.now() - article.publishedAt.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0, 1 - ageDays / 7) * 0.5;
      score += recencyBoost;

      // Exclude already viewed articles
      if (viewedIds.has(article.id)) {
        score *= 0.1; // Heavy penalty but don't exclude entirely
      }

      return { article, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Paginate
    const total = scored.length;
    const paged = scored.slice(skip, skip + limit);
    const articles = paged.map((s) => s.article);

    // Log AI decision (CPPA compliance)
    await prisma.aIDecisionLog.create({
      data: {
        userId,
        decisionType: 'CONTENT_RECOMMENDATION',
        inputSummary: `User ${userId}: ${interestTags.length} interest tags, ${viewedIds.size} viewed articles`,
        outputSummary: `Ranked ${scored.length} candidates, returned top ${articles.length} for page ${page}`,
        explanation: JSON.stringify({
          en: 'Articles were ranked using your interest tags and reading history via cosine similarity of semantic embeddings.',
          zh: '文章根据您的兴趣标签和阅读历史，通过语义向量余弦相似度排序推荐。',
        }),
        modelUsed: 'text-embedding-3-small',
        costUsd: 0,
      },
    }).catch(() => {});

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
