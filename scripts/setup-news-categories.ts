import { prisma } from '@/lib/db';

async function setupNewsCategories() {
  console.log('Setting up news categories...');

  const newsCategoryDefs = [
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

  let created = 0;
  for (const def of newsCategoryDefs) {
    try {
      const existing = await prisma.newsCategory.findUnique({
        where: { name: def.name },
      });
      if (!existing) {
        await prisma.newsCategory.create({
          data: {
            name: def.name,
            slug: def.slug,
            displayOrder: def.displayOrder,
            isActive: true,
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`Failed to create category ${def.name}:`, error);
    }
  }

  console.log(`✅ Created ${created} news categories`);
}

setupNewsCategories()
  .then(() => {
    console.log('✨ Setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
