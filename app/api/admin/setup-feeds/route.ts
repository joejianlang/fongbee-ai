/**
 * POST /api/admin/setup-feeds
 *
 * 一次性初始化：往数据库插入新闻来源 + 修正分类 filterType。
 * 仅 ADMIN 可调用。幂等（upsert），可安全重复执行。
 */

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { NextRequest, NextResponse } from 'next/server';
import { FeedType } from '@prisma/client';

const FEED_SOURCES = [
  { id: 'national-post', name: 'National Post',    type: FeedType.RSS, url: 'https://nationalpost.com/feed',                  category: '传统新闻媒体' },
  { id: 'cnn',           name: 'CNN World',        type: FeedType.RSS, url: 'https://rss.cnn.com/rss/edition.rss',            category: '传统新闻媒体' },
  { id: 'cbc',           name: 'CBC News',         type: FeedType.RSS, url: 'https://www.cbc.ca/cmlink/rss-topstories',       category: '传统新闻媒体' },
  { id: 'verge',         name: 'The Verge',        type: FeedType.RSS, url: 'https://www.theverge.com/rss/index.xml',         category: '网络专业媒体' },
  { id: 'techcrunch',    name: 'TechCrunch',       type: FeedType.RSS, url: 'https://techcrunch.com/feed/',                   category: '网络专业媒体' },
  { id: 'axios',         name: 'Axios',            type: FeedType.RSS, url: 'https://api.axios.com/feed/',                    category: '网络专业媒体' },
  { id: 'bloomberg',     name: 'Reuters Business', type: FeedType.RSS, url: 'https://feeds.reuters.com/reuters/businessNews', category: '财经' },
  { id: 'variety',       name: 'Variety',          type: FeedType.RSS, url: 'https://variety.com/feed/',                     category: '文化娱乐' },
  { id: 'espn',          name: 'ESPN',             type: FeedType.RSS, url: 'https://www.espn.com/espn/rss/news',             category: '体育' },
];

const CATEGORY_FILTERS = [
  { name: '全部',         filterType: 'ALL',            keywords: null },
  { name: '关注',         filterType: 'USER_INTERESTS', keywords: null },
  { name: '传统新闻媒体', filterType: 'RSS_SOURCE',     keywords: null },
  { name: 'YouTube网红',  filterType: 'YOUTUBE_SOURCE', keywords: null },
  { name: '网络专业媒体', filterType: 'RSS_SOURCE',     keywords: null },
  { name: '本地',         filterType: 'GEO_BASED',      keywords: null },
  { name: '热点',         filterType: 'KEYWORDS',       keywords: ['breaking','world','hot','热点','突发','全球'] },
  { name: '政治',         filterType: 'KEYWORDS',       keywords: ['politics','government','election','policy','政治','选举','政府'] },
  { name: '科技',         filterType: 'KEYWORDS',       keywords: ['tech','technology','AI','software','startup','Apple','Google','科技','人工智能'] },
  { name: '财经',         filterType: 'KEYWORDS',       keywords: ['finance','market','stock','economy','business','invest','财经','股市','经济'] },
  { name: '文化娱乐',     filterType: 'KEYWORDS',       keywords: ['entertainment','movie','music','celebrity','culture','娱乐','电影','音乐'] },
  { name: '体育',         filterType: 'KEYWORDS',       keywords: ['sports','NBA','NFL','soccer','hockey','Olympics','体育','足球','篮球'] },
];

export async function POST(req: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Upsert feed sources
    const sourceResults = await Promise.allSettled(
      FEED_SOURCES.map((src) =>
        prisma.feedSource.upsert({
          where: { id: src.id },
          update: { name: src.name, url: src.url, category: src.category, isActive: true },
          create: { ...src, isActive: true, errorCount: 0, crawlCron: '0 * * * *', language: 'en' },
        })
      )
    );

    const sourcesAdded = sourceResults.filter((r) => r.status === 'fulfilled').length;
    const sourceErrors = sourceResults
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => r.reason?.message ?? String(r.reason));

    // 2. Update category filterTypes
    const catResults = await Promise.allSettled(
      CATEGORY_FILTERS.map((cat) =>
        prisma.newsCategory.updateMany({
          where: { name: cat.name },
          data: {
            filterType: cat.filterType,
            ...(cat.keywords ? { keywords: JSON.stringify(cat.keywords) } : {}),
          },
        })
      )
    );
    const catsUpdated = catResults.filter((r) => r.status === 'fulfilled').length;

    return NextResponse.json({
      success: true,
      sourcesAdded,
      catsUpdated,
      sourceErrors,
      message: `已添加 ${sourcesAdded} 个新闻来源，更新 ${catsUpdated} 个分类过滤规则。请前往 GitHub Actions → Cron - Crawl Feeds → Run workflow 触发抓取。`,
    });
  } catch (error) {
    console.error('setup-feeds error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
