import { prisma } from '@/lib/db';

const ORIGINAL_CATEGORIES = [
  { name: '家庭清洁', slug: 'home-cleaning', icon: '🧹', color: '#10b981' },
  { name: '家政服务', slug: 'housekeeping', icon: '👩‍🍳', color: '#3b82f6' },
  { name: '物业维修', slug: 'property-maintenance', icon: '🔧', color: '#f59e0b' },
  { name: '财务咨询', slug: 'financial-consulting', icon: '💰', color: '#8b5cf6' },
  { name: '园艺绿化', slug: 'landscaping', icon: '🌿', color: '#06b6d4' },
  { name: '家电维修', slug: 'appliance-repair', icon: '🔌', color: '#ec4899' },
  { name: '摄影摄像', slug: 'photography', icon: '📸', color: '#14b8a6' },
  { name: '翻译口译', slug: 'translation', icon: '🗣️', color: '#f97316' },
  { name: '美容美发', slug: 'beauty-salon', icon: '💇', color: '#e11d48' },
  { name: '宠物服务', slug: 'pet-services', icon: '🐕', color: '#059669' },
  { name: '餐饮外送', slug: 'food-delivery', icon: '🍔', color: '#dc2626' },
  { name: '其他服务', slug: 'other-services', icon: '⭐', color: '#6366f1' },
];

async function restoreCategories() {
  try {
    // Delete existing categories
    await prisma.serviceCategory.deleteMany();
    console.log('✅ Cleared existing categories');

    // Create original categories
    for (let i = 0; i < ORIGINAL_CATEGORIES.length; i++) {
      const cat = ORIGINAL_CATEGORIES[i];
      await prisma.serviceCategory.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          displayOrder: i,
          isActive: true,
        },
      });
    }

    console.log('✅ Restored all original service categories');
    console.log(`📊 Total categories: ${ORIGINAL_CATEGORIES.length}`);
    ORIGINAL_CATEGORIES.forEach((cat, idx) => {
      console.log(`  ${idx + 1}. ${cat.icon} ${cat.name} (${cat.slug})`);
    });
  } catch (error) {
    console.error('❌ Error restoring categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreCategories();
