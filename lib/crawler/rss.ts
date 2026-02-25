/**
 * RSS Feed Crawler
 *
 * Uses rss-parser to fetch and parse RSS feeds.
 * Deduplicates by externalId (guid).
 * Returns newly created articles and crawl metadata.
 */

import Parser from 'rss-parser';
import { prisma } from '@/lib/db';
import type { FeedSource } from '@prisma/client';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'YouFuJia-NewsBot/1.0 (+https://youfujia.ca)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
});

interface CrawlResult {
  newCount: number;
  totalCount: number;
  errors: string[];
}

export async function crawlRssSource(source: FeedSource): Promise<CrawlResult> {
  const errors: string[] = [];
  let totalCount = 0;
  let newCount = 0;

  const feed = await parser.parseURL(source.url);
  const items = feed.items ?? [];
  totalCount = items.length;

  for (const item of items) {
    try {
      const externalId = item.guid ?? item.link ?? item.id ?? '';
      if (!externalId) {
        errors.push(`Skipping item with no guid/link: ${item.title ?? 'untitled'}`);
        continue;
      }

      const sourceUrl = item.link ?? externalId;
      if (!sourceUrl) {
        errors.push(`Skipping item with no sourceUrl: ${item.title ?? 'untitled'}`);
        continue;
      }

      // Deduplicate by externalId
      const existing = await prisma.article.findUnique({
        where: { externalId },
        select: { id: true },
      });
      if (existing) continue;

      // Also check sourceUrl uniqueness
      const existingByUrl = await prisma.article.findUnique({
        where: { sourceUrl },
        select: { id: true },
      });
      if (existingByUrl) continue;

      const title = item.title ?? 'Untitled';
      const itemFull = item as Parser.Item & { contentEncoded?: string; 'content:encoded'?: string };
      const content = itemFull.contentEncoded ?? item.content ?? item.summary ?? itemFull['content:encoded'] ?? '';
      const author = item.creator ?? item.author ?? (feed.title ? `${feed.title}` : undefined);
      const imageUrl = extractImageUrl(item);
      const publishedAt = item.pubDate
        ? new Date(item.pubDate)
        : item.isoDate
        ? new Date(item.isoDate)
        : new Date();

      await prisma.article.create({
        data: {
          feedSourceId: source.id,
          externalId,
          title,
          originalTitle: title,
          content: content || title,
          author,
          imageUrl,
          sourceUrl,
          publishedAt,
          isActive: true,
        },
      });

      newCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Item error: ${msg}`);
    }
  }

  return { newCount, totalCount, errors };
}

function extractImageUrl(item: Parser.Item): string | undefined {
  // Try enclosure
  if (item.enclosure?.url) return item.enclosure.url;

  // Try media:content or media:thumbnail (common in RSS)
  const itemAny = item as Record<string, unknown>;
  const mediaContent = itemAny['media:content'];
  if (mediaContent && typeof mediaContent === 'object') {
    const mc = mediaContent as Record<string, unknown>;
    if (typeof mc.url === 'string') return mc.url;
    if (Array.isArray(mc) && mc.length > 0) {
      const first = mc[0] as Record<string, unknown>;
      if (typeof first.url === 'string') return first.url;
    }
  }

  const mediaThumbnail = itemAny['media:thumbnail'];
  if (mediaThumbnail && typeof mediaThumbnail === 'object') {
    const mt = mediaThumbnail as Record<string, unknown>;
    if (typeof mt.url === 'string') return mt.url;
  }

  // Try extracting first img src from content
  const itemAny2 = item as Parser.Item & { contentEncoded?: string };
  const content = item.content ?? itemAny2.contentEncoded ?? '';
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) return imgMatch[1];

  return undefined;
}
