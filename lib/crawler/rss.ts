/**
 * RSS Feed Crawler
 *
 * Uses rss-parser to fetch and parse RSS feeds.
 * Deduplicates by externalId (guid).
 * Falls back to og:image scraping when the feed item has no image.
 * Returns newly created articles and crawl metadata.
 */

import Parser from 'rss-parser';
import { prisma } from '@/lib/db';
import type { FeedSource } from '@prisma/client';

// Configure custom XML namespace fields so rss-parser includes them
type CustomItem = {
  'media:content'?: { $?: { url?: string }; url?: string } | Array<{ $?: { url?: string } }>;
  'media:thumbnail'?: { $?: { url?: string }; url?: string };
  'media:group'?: {
    'media:thumbnail'?: { $?: { url?: string }; url?: string };
    'media:content'?: { $?: { url?: string } };
  };
  contentEncoded?: string;
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  timeout: 15000,
  headers: {
    'User-Agent': 'YouFuJia-NewsBot/1.0 (+https://youfujia.ca)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content',   'media:content',   { keepArray: false }],
      ['media:thumbnail', 'media:thumbnail'],
      ['media:group',     'media:group'],
      ['content:encoded', 'contentEncoded'],
    ],
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
      const content = item.contentEncoded ?? item.content ?? item.summary ?? '';
      const author = item.creator ?? item.author ?? (feed.title ? `${feed.title}` : undefined);

      // 1. Try extracting image from RSS item fields
      let imageUrl = extractImageUrl(item, content);

      // 2. Fallback: scrape og:image from the article page (non-blocking, 4s timeout)
      if (!imageUrl && sourceUrl.startsWith('http')) {
        imageUrl = await fetchOgImage(sourceUrl);
      }

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

/** Extract image URL from various RSS item fields */
function extractImageUrl(item: Parser.Item & CustomItem, content: string): string | undefined {
  // 1. Enclosure (standard RSS)
  if (item.enclosure?.url) return item.enclosure.url;

  // 2. media:content — rss-parser returns either an object or array
  const mc = item['media:content'];
  if (mc) {
    if (Array.isArray(mc)) {
      // Sort by width desc to get the largest image
      const sorted = [...mc].sort((a, b) => {
        const wa = Number((a as Record<string, unknown>)?.$?.['width'] ?? 0);
        const wb = Number((b as Record<string, unknown>)?.$?.['width'] ?? 0);
        return wb - wa;
      });
      for (const m of sorted) {
        const url = (m as Record<string, unknown>)?.$?.['url'] as string | undefined
          ?? (m as Record<string, unknown>)?.['url'] as string | undefined;
        if (url) return url;
      }
    } else if (typeof mc === 'object') {
      const url = (mc.$?.url) ?? (mc as Record<string, unknown>)?.['url'] as string | undefined;
      if (url) return url;
    }
  }

  // 3. media:thumbnail
  const mt = item['media:thumbnail'];
  if (mt && typeof mt === 'object') {
    const url = mt.$?.url ?? (mt as Record<string, unknown>)?.['url'] as string | undefined;
    if (url) return url;
  }

  // 4. media:group (YouTube-style feeds)
  const mg = item['media:group'];
  if (mg && typeof mg === 'object') {
    const thumb = mg['media:thumbnail'];
    if (thumb) {
      const url = (thumb as Record<string, unknown>)?.$?.['url'] as string | undefined
        ?? (thumb as Record<string, unknown>)?.['url'] as string | undefined;
      if (url) return url;
    }
  }

  // 5. First <img> in content/content:encoded
  if (content) {
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1]) return imgMatch[1];
  }

  return undefined;
}

/** Fetch og:image from an article URL with a short timeout */
async function fetchOgImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000); // 4-second timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'YouFuJia-NewsBot/1.0 (+https://youfujia.ca)',
        Accept: 'text/html',
      },
    });
    clearTimeout(timer);

    if (!res.ok) return undefined;

    // Read only the first 20 KB — og:image is always in <head>
    const reader = res.body?.getReader();
    if (!reader) return undefined;

    let html = '';
    let bytesRead = 0;
    const MAX_BYTES = 20 * 1024; // 20 KB

    while (bytesRead < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      bytesRead += value.byteLength;
      // Stop once we see </head> — no point reading the body
      if (html.includes('</head>')) break;
    }
    reader.cancel();

    // Match og:image or twitter:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
      ?? html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

    const imgUrl = ogMatch?.[1];
    if (!imgUrl) return undefined;

    // Make relative URLs absolute
    if (imgUrl.startsWith('//')) return `https:${imgUrl}`;
    if (imgUrl.startsWith('/')) {
      const origin = new URL(url).origin;
      return `${origin}${imgUrl}`;
    }
    return imgUrl;
  } catch {
    // Timeout, network error, etc. — silently ignore
    return undefined;
  }
}
