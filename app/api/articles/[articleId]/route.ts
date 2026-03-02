import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MOCK_ARTICLES } from '@/lib/mockData';

export async function GET(
  _req: Request,
  { params }: { params: { articleId: string } }
) {
  const { articleId } = params;

  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        feedSource: { select: { name: true, type: true, id: true } },
        tags: { select: { tag: true } },
      },
    });

    if (!article) {
      const mock = MOCK_ARTICLES.find((a) => a.id === articleId);
      if (mock) return NextResponse.json({ success: true, data: mock });
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const data = {
      id: article.id,
      title: article.title,
      titleZh: (article as Record<string, unknown>).titleZh as string | null ?? null,
      sourceName: article.feedSource?.name ?? (article as Record<string, unknown>).sourceName as string ?? '',
      sourceType: article.feedSource?.type ?? 'RSS',
      sourceId: article.feedSource?.id ?? null,
      sourceUrl: article.sourceUrl ?? null,
      category: (article as Record<string, unknown>).frontendCategory as string ?? article.category ?? '',
      publishedAt: article.publishedAt.toISOString(),
      imageUrl: article.imageUrl ?? null,
      tags: article.tags?.map((t) => t.tag) ?? [],
      viewCount: (article as Record<string, unknown>).viewCount as number ?? 0,
      likeCount: (article as Record<string, unknown>).likeCount as number ?? 0,
      shareCount: (article as Record<string, unknown>).shareCount as number ?? 0,
      summary: article.summary ?? null,
      summaryZh: (article as Record<string, unknown>).summaryZh as string | null ?? null,
      content: article.content ?? null,
      fiveW1H: (article as Record<string, unknown>).fiveW1H as string | null ?? null,
      sentiment: (article as Record<string, unknown>).sentiment as string | null ?? null,
    };

    return NextResponse.json({ success: true, data });
  } catch {
    const mock = MOCK_ARTICLES.find((a) => a.id === articleId);
    if (mock) return NextResponse.json({ success: true, data: mock });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
