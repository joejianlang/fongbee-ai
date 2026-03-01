/**
 * POST /api/admin/backfill-images
 *
 * For articles already in the DB that have no imageUrl,
 * fetch og:image from the article's sourceUrl and update the record.
 * Processes up to 50 articles per call to avoid timeout.
 * Admin-only.
 */

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { NextRequest, NextResponse } from 'next/server';

const BATCH = 50;
const FETCH_TIMEOUT_MS = 4000;
const MAX_BYTES = 20 * 1024; // 20 KB — og:image is always in <head>

async function fetchOgImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'YouFuJia-NewsBot/1.0 (+https://youfujia.ca)',
        Accept: 'text/html',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return undefined;

    const reader = res.body?.getReader();
    if (!reader) return undefined;

    let html = '';
    let bytesRead = 0;
    while (bytesRead < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      bytesRead += value.byteLength;
      if (html.includes('</head>')) break;
    }
    reader.cancel();

    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

    const imgUrl = ogMatch?.[1];
    if (!imgUrl) return undefined;
    if (imgUrl.startsWith('//')) return `https:${imgUrl}`;
    if (imgUrl.startsWith('/')) return `${new URL(url).origin}${imgUrl}`;
    return imgUrl;
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Find articles with no imageUrl
  const articles = await prisma.article.findMany({
    where: { imageUrl: null, isActive: true },
    select: { id: true, sourceUrl: true },
    orderBy: { publishedAt: 'desc' },
    take: BATCH,
  });

  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    if (!article.sourceUrl.startsWith('http')) { skipped++; continue; }
    const imageUrl = await fetchOgImage(article.sourceUrl);
    if (imageUrl) {
      await prisma.article.update({
        where: { id: article.id },
        data: { imageUrl },
      }).catch(() => {});
      updated++;
    } else {
      skipped++;
    }
  }

  const remaining = await prisma.article.count({ where: { imageUrl: null, isActive: true } });

  return NextResponse.json({
    success: true,
    checked: articles.length,
    updated,
    skipped,
    remaining,
    message: `已处理 ${articles.length} 篇，补充图片 ${updated} 篇，跳过 ${skipped} 篇。还有 ${remaining} 篇无图片。`,
  });
}
