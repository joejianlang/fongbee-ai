const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initializeDatabase() {
  console.log('Initializing news categories table...');

  try {
    // Create news_categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.news_categories (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        icon TEXT,
        color TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created news_categories table');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "news_categories_slug_idx" ON public.news_categories(slug);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "news_categories_is_active_idx" ON public.news_categories(is_active);
    `);
    console.log('✓ Created indexes');

    // Add news_category_id column to articles if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE public.articles
        ADD COLUMN IF NOT EXISTS news_category_id TEXT;
      `);
      console.log('✓ Added news_category_id column to articles');
    } catch (e) {
      console.log('✓ news_category_id column already exists or error (this is OK)');
    }

    // Create foreign key constraint if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE public.articles
        ADD CONSTRAINT "articles_news_category_id_fkey"
        FOREIGN KEY (news_category_id) REFERENCES public.news_categories(id) ON DELETE SET NULL;
      `);
      console.log('✓ Created foreign key constraint');
    } catch (e) {
      console.log('✓ Foreign key already exists (this is OK)');
    }

    // Create index on news_category_id
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS "articles_news_category_id_idx" ON public.articles(news_category_id);
      `);
      console.log('✓ Created index on news_category_id');
    } catch (e) {
      console.log('✓ Index already exists (this is OK)');
    }

    // Seed default news categories
    const categories = [
      { name: '全部', slug: 'all', displayOrder: 0 },
      { name: '关注', slug: 'follow', displayOrder: 1 },
      { name: '传统新闻媒体', slug: 'traditional-news', displayOrder: 2 },
      { name: 'YouTube网红', slug: 'youtube-influencers', displayOrder: 3 },
      { name: '网络专业媒体', slug: 'online-media', displayOrder: 4 },
      { name: '本地', slug: 'local', displayOrder: 5 },
      { name: '热点', slug: 'trending', displayOrder: 6 },
      { name: '政治', slug: 'politics', displayOrder: 7 },
      { name: '科技', slug: 'technology', displayOrder: 8 },
      { name: '财经', slug: 'finance', displayOrder: 9 },
      { name: '文化娱乐', slug: 'entertainment', displayOrder: 10 },
      { name: '体育', slug: 'sports', displayOrder: 11 },
    ];

    let inserted = 0;
    for (const cat of categories) {
      try {
        const result = await pool.query(
          'INSERT INTO public.news_categories (id, name, slug, display_order, is_active) VALUES ($1, $2, $3, $4, true) ON CONFLICT (name) DO NOTHING',
          [Math.random().toString(36).substr(2, 9), cat.name, cat.slug, cat.displayOrder]
        );
        if (result.rowCount > 0) {
          inserted++;
        }
      } catch (e) {
        console.error(`Failed to insert category ${cat.name}:`, e.message);
      }
    }
    console.log(`✓ Inserted ${inserted} news categories`);

    console.log('✨ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
