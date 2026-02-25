import { PrismaClient, UserRole, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create categories
  const categories = await Promise.all([
    prisma.serviceCategory.upsert({
      where: { name: '家庭清洁' },
      update: {},
      create: {
        name: '家庭清洁',
        nameEn: 'Home Cleaning',
        icon: 'sparkles',
        color: '#10b981',
      },
    }),
    prisma.serviceCategory.upsert({
      where: { name: '搬家服务' },
      update: {},
      create: {
        name: '搬家服务',
        nameEn: 'Moving Services',
        icon: 'truck',
        color: '#3b82f6',
      },
    }),
    prisma.serviceCategory.upsert({
      where: { name: '家电维修' },
      update: {},
      create: {
        name: '家电维修',
        nameEn: 'Appliance Repair',
        icon: 'wrench',
        color: '#f59e0b',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // 2. Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@youfujia.com' },
    update: {},
    create: {
      email: 'admin@youfujia.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      city: 'Guelph',
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // 3. Create payment policies (用 findFirst+create 替代 upsert，因为 null serviceCategoryId 在 @@unique 中行为特殊)
  const policyDefs = [
    { serviceType: 'standard',      autoCaptureHoursBefore: 48, isAutoCaptureEnabled: true,  cancellationCutoffHours: 48, forfeiturePercentage: 20, depositPercentage: 30, refundDays: 7 },
    { serviceType: 'simple_custom', autoCaptureHoursBefore: 36, isAutoCaptureEnabled: true,  cancellationCutoffHours: 36, forfeiturePercentage: 15, depositPercentage: 20, refundDays: 7 },
    { serviceType: 'complex_custom',autoCaptureHoursBefore: 72, isAutoCaptureEnabled: false, cancellationCutoffHours: 72, forfeiturePercentage: 25, depositPercentage: 50, refundDays: 14 },
  ];
  const policies = await Promise.all(
    policyDefs.map(async (def) => {
      const existing = await prisma.paymentPolicy.findFirst({
        where: { serviceType: def.serviceType, serviceCategoryId: null },
      });
      if (existing) return existing;
      return prisma.paymentPolicy.create({
        data: { ...def, serviceCategoryId: null, createdBy: adminUser.id },
      });
    })
  );

  console.log(`✅ Created ${policies.length} payment policies`);

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
