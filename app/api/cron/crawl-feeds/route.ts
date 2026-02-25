/**
 * POST /api/cron/crawl-feeds
 *
 * Cron job: Crawls all active FeedSources where nextCrawlAt <= now (or null).
 * Batch limit: 20 sources per run.
 * Calculates nextCrawlAt by adding 6 hours for default cron schedule.
 * Auth: x-cron-key header.
 */

import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { crawlRssSource } from '@/lib/crawler/rss';
import { crawlYouTubeSource } from '@/lib/crawler/youtube';

const BATCH_LIMIT = 20;

/**
 * Parse crawlCron string to determine the next crawl interval in ms.
 * Supports common patterns; defaults to 6 hours.
 */
function getNextCrawlAt(crawlCron: string): Date {
  const now = new Date();
  // Parse simple interval patterns
  // "*/15 * * * *" -> 15 minutes
  // "0 */6 * * *" -> 6 hours
  // "0 */1 * * *" -> 1 hour
  const minuteMatch = crawlCron.match(/^\*\/(\d+) \* \* \* \*$/);
  if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1], 10);
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  const hourMatch = crawlCron.match(/^0 \*\/(\d+) \* \* \*$/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1], 10);
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  // Default: 6 hours
  return new Date(now.getTime() + 6 * 60 * 60 * 1000);
}

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
  const now = new Date();
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    newArticles: 0,
    errors: [] as string[],
  };

  try {
    // Find active sources due for crawling
    const sources = await prisma.feedSource.findMany({
      where: {
        isActive: true,
        OR: [
          { nextCrawlAt: null },
          { nextCrawlAt: { lte: now } },
        ],
      },
      orderBy: { lastCrawledAt: 'asc' },
      take: BATCH_LIMIT,
    });

    console.log(`[crawl-feeds] Found ${sources.length} sources to crawl`);

    for (const source of sources) {
      results.processed++;
      const crawlStart = Date.now();

      try {
        let crawlResult: { newCount: number; totalCount: number; errors: string[] };

        if (source.type === 'RSS') {
          crawlResult = await crawlRssSource(source);
        } else if (source.type === 'YOUTUBE') {
          crawlResult = await crawlYouTubeSource(source);
        } else {
          throw new Error(`Unknown feed type: ${source.type}`);
        }

        const durationMs = Date.now() - crawlStart;
        results.newArticles += crawlResult.newCount;

        const status = crawlResult.errors.length === 0
          ? 'SUCCESS'
          : crawlResult.newCount > 0
          ? 'PARTIAL'
          : 'FAILED';

        // Create crawl log
        await prisma.feedCrawlLog.create({
          data: {
            sourceId: source.id,
            status,
            itemCount: crawlResult.newCount,
            errorMsg: crawlResult.errors.length > 0
              ? crawlResult.errors.slice(0, 3).join('; ')
              : null,
            durationMs,
          },
        });

        // Update source metadata
        await prisma.feedSource.update({
          where: { id: source.id },
          data: {
            lastCrawledAt: now,
            nextCrawlAt: getNextCrawlAt(source.crawlCron),
            errorCount: status === 'FAILED' ? source.errorCount + 1 : 0,
            lastErrorMsg: status === 'FAILED' && crawlResult.errors.length > 0
              ? crawlResult.errors[0]
              : null,
          },
        });

        results.succeeded++;
        console.log(`[crawl-feeds] ${source.name}: ${crawlResult.newCount} new articles (${durationMs}ms)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.failed++;
        results.errors.push(`${source.name}: ${msg}`);

        const durationMs = Date.now() - crawlStart;

        await prisma.feedCrawlLog.create({
          data: {
            sourceId: source.id,
            status: 'FAILED',
            itemCount: 0,
            errorMsg: msg.slice(0, 500),
            durationMs,
          },
        }).catch(() => {});

        await prisma.feedSource.update({
          where: { id: source.id },
          data: {
            errorCount: source.errorCount + 1,
            lastErrorMsg: msg.slice(0, 500),
            nextCrawlAt: getNextCrawlAt(source.crawlCron),
          },
        }).catch(() => {});

        console.error(`[crawl-feeds] ${source.name} failed: ${msg}`);
      }
    }

    const totalMs = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      message: `Crawled ${results.processed} sources in ${totalMs}ms`,
      data: {
        ...results,
        durationMs: totalMs,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[crawl-feeds] Fatal error:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
