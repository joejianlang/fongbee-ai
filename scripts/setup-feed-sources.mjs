/**
 * 初始化新闻来源 + 修正分类过滤类型
 *
 * 用法（本地）:
 *   node scripts/setup-feed-sources.mjs
 *
 * 用法（生产）:
 *   DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres" \
 *   node scripts/setup-feed-sources.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/* ── 1. RSS 来源定义 ──────────────────────────────────────── */
const FEED_SOURCES = [
  // 传统新闻媒体
  {
    id:       'national-post',
    name:     'National Post',
    type:     'RSS',
    url:      'https://nationalpost.com/feed',
    language: 'en',
    category: '传统新闻媒体',
  },
  {
    id:       'cnn',
    name:     'CNN World',
    type:     'RSS',
    url:      'https://rss.cnn.com/rss/edition.rss',
    language: 'en',
    category: '传统新闻媒体',
  },
  {
    id:       'cbc',
    name:     'CBC News',
    type:     'RSS',
    url:      'https://www.cbc.ca/cmlink/rss-topstories',
    language: 'en',
    category: '传统新闻媒体',
  },

  // 网络专业媒体
  {
    id:       'verge',
    name:     'The Verge',
    type:     'RSS',
    url:      'https://www.theverge.com/rss/index.xml',
    language: 'en',
    category: '网络专业媒体',
  },
  {
    id:       'techcrunch',
    name:     'TechCrunch',
    type:     'RSS',
    url:      'https://techcrunch.com/feed/',
    language: 'en',
    category: '网络专业媒体',
  },
  {
    id:       'axios',
    name:     'Axios',
    type:     'RSS',
    url:      'https://api.axios.com/feed/',
    language: 'en',
    category: '网络专业媒体',
  },

  // 财经
  {
    id:       'bloomberg',
    name:     'Reuters Business',
    type:     'RSS',
    url:      'https://feeds.reuters.com/reuters/businessNews',
    language: 'en',
    category: '财经',
  },

  // 文化娱乐
  {
    id:       'variety',
    name:     'Variety',
    type:     'RSS',
    url:      'https://variety.com/feed/',
    language: 'en',
    category: '文化娱乐',
  },

  // 体育
  {
    id:       'espn',
    name:     'ESPN',
    type:     'RSS',
    url:      'https://www.espn.com/espn/rss/news',
    language: 'en',
    category: '体育',
  },
];

/* ── 2. 分类过滤类型修正 ──────────────────────────────────── */
const CATEGORY_FILTER_UPDATES = [
  { name: '全部',       filterType: 'ALL' },
  { name: '关注',       filterType: 'USER_INTERESTS' },
  { name: '传统新闻媒体', filterType: 'RSS_SOURCE' },
  { name: 'YouTube网红', filterType: 'YOUTUBE_SOURCE' },
  { name: '网络专业媒体', filterType: 'RSS_SOURCE' },
  { name: '本地',       filterType: 'GEO_BASED' },
  // 话题分类用 KEYWORDS
  { name: '热点',       filterType: 'KEYWORDS', keywords: ['breaking', 'world', 'hot', '热点', '突发', '全球'] },
  { name: '政治',       filterType: 'KEYWORDS', keywords: ['politics', 'government', 'election', 'policy', '政治', '选举', '政府'] },
  { name: '科技',       filterType: 'KEYWORDS', keywords: ['tech', 'technology', 'AI', 'software', 'startup', 'Apple', 'Google', '科技', '人工智能'] },
  { name: '财经',       filterType: 'KEYWORDS', keywords: ['finance', 'market', 'stock', 'economy', 'business', 'invest', '财经', '股市', '经济'] },
  { name: '文化娱乐',   filterType: 'KEYWORDS', keywords: ['entertainment', 'movie', 'music', 'celebrity', 'culture', '娱乐', '电影', '音乐'] },
  { name: '体育',       filterType: 'KEYWORDS', keywords: ['sports', 'NBA', 'NFL', 'soccer', 'hockey', 'Olympics', '体育', '足球', '篮球'] },
];

/* ── Main ────────────────────────────────────────────────── */
async function main() {
  console.log('🚀 Setting up feed sources...\n');

  // Upsert feed sources
  let addedCount = 0;
  for (const src of FEED_SOURCES) {
    const result = await prisma.feedSource.upsert({
      where: { id: src.id },
      update: {
        name:     src.name,
        url:      src.url,
        language: src.language,
        category: src.category,
        isActive: true,
      },
      create: {
        id:         src.id,
        name:       src.name,
        type:       src.type,
        url:        src.url,
        language:   src.language,
        category:   src.category,
        isActive:   true,
        errorCount: 0,
        crawlCron:  '0 * * * *',
      },
    });
    console.log(`  ✅ ${result.name} (${result.id})`);
    addedCount++;
  }

  console.log(`\n📰 ${addedCount} feed sources configured.\n`);

  // Update news category filterTypes
  let updatedCats = 0;
  for (const cat of CATEGORY_FILTER_UPDATES) {
    const updated = await prisma.newsCategory.updateMany({
      where: { name: cat.name },
      data: {
        filterType: cat.filterType,
        ...(cat.keywords ? { keywords: JSON.stringify(cat.keywords) } : {}),
      },
    });
    if (updated.count > 0) {
      console.log(`  🏷️  ${cat.name} → filterType: ${cat.filterType}`);
      updatedCats++;
    }
  }

  console.log(`\n🗂️  ${updatedCats} categories updated.\n`);
  console.log('✨ Done! Now trigger the crawler:');
  console.log('   curl -X GET https://fongbee-ai.vercel.app/api/cron/crawl-feeds \\');
  console.log('     -H "Authorization: Bearer <CRON_SECRET>"');
  console.log('\n   Or via GitHub Actions → Actions → Cron - Crawl Feeds → Run workflow');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
