/**
 * POST /api/cron/process-articles
 *
 * Cron job: AI processes unprocessed articles.
 * Finds articles where aiProcessedAt IS NULL AND isActive = true.
 * Limit: 10 articles per run (AI cost control).
 * Auth: x-cron-key header.
 */

import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { processArticle } from '@/lib/ai/pipeline';

const BATCH_LIMIT = 10;

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  // Verify cron API key
  const cronKey = req.headers.get('x-cron-key');
  if (cronKey !== process.env.CRON_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    totalCostUsd: 0,
    errors: [] as string[],
  };

  try {
    // Find unprocessed articles
    const articles = await prisma.article.findMany({
      where: {
        aiProcessedAt: null,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH_LIMIT,
      select: { id: true, title: true },
    });

    console.log(`[process-articles] Found ${articles.length} unprocessed articles`);

    for (const article of articles) {
      results.processed++;

      try {
        const result = await processArticle(article.id);
        results.totalCostUsd += result.totalCostUsd;

        if (result.success) {
          results.succeeded++;
          console.log(`[process-articles] OK: ${article.title.slice(0, 60)} (cost: $${result.totalCostUsd.toFixed(6)})`);
        } else {
          results.failed++;
          const errMsg = result.errors.join(', ');
          results.errors.push(`${article.id}: ${errMsg}`);
          console.warn(`[process-articles] Partial: ${article.title.slice(0, 60)} - ${errMsg}`);
        }
      } catch (err) {
        results.failed++;
        const msg = err instanceof Error ? err.message : String(err);
        results.errors.push(`${article.id}: ${msg}`);
        console.error(`[process-articles] Failed: ${article.title.slice(0, 60)} - ${msg}`);
      }
    }

    const totalMs = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} articles in ${totalMs}ms`,
      data: {
        ...results,
        totalCostUsd: parseFloat(results.totalCostUsd.toFixed(6)),
        durationMs: totalMs,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[process-articles] Fatal error:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
