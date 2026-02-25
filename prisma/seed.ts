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

  // 3. Create payment policies
  const policies = await Promise.all([
    prisma.paymentPolicy.upsert({
      where: { serviceType_serviceCategoryId: { serviceType: 'standard', serviceCategoryId: null } },
      update: {},
      create: {
        serviceType: 'standard',
        autoCaptureHoursBefore: 48,
        isAutoCaptureEnabled: true,
        cancellationCutoffHours: 48,
        forfeitturePercentage: 20,
        depositPercentage: 30,
        refundDays: 7,
        createdBy: adminUser.id,
      },
    }),
    prisma.paymentPolicy.upsert({
      where: { serviceType_serviceCategoryId: { serviceType: 'simple_custom', serviceCategoryId: null } },
      update: {},
      create: {
        serviceType: 'simple_custom',
        autoCaptureHoursBefore: 36,
        isAutoCaptureEnabled: true,
        cancellationCutoffHours: 36,
        forfeitturePercentage: 15,
        depositPercentage: 20,
        refundDays: 7,
        createdBy: adminUser.id,
      },
    }),
    prisma.paymentPolicy.upsert({
      where: { serviceType_serviceCategoryId: { serviceType: 'complex_custom', serviceCategoryId: null } },
      update: {},
      create: {
        serviceType: 'complex_custom',
        autoCaptureHoursBefore: 72,
        isAutoCaptureEnabled: false, // Manual handling for complex projects
        cancellationCutoffHours: 72,
        forfeitturePercentage: 25,
        depositPercentage: 50,
        refundDays: 14,
        createdBy: adminUser.id,
      },
    }),
  ]);

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
