import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateReferralCode(): string {
  return 'SP' + crypto.randomBytes(12).toString('hex').toUpperCase().substring(0, 14);
}

async function initSalesPartners() {
  try {
    // 检查是否已有销售合伙人
    const existingCount = await prisma.salesPartner.count();
    console.log(`📊 Current sales partners: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⏭️  Sales partners already exist, skipping initialization');
      return;
    }

    // 为演示用户创建销售合伙人（需要先有用户）
    const user = await prisma.user.findFirst({
      where: { email: 'fongbeead@gmail.com' }, // 管理员账户
    });

    if (!user) {
      console.log('⚠️  No user found for creating sales partners. Please create users first.');
      return;
    }

    // 只创建一个销售合伙人（userId有唯一约束）
    const referralCode = generateReferralCode();

    const partner = await prisma.salesPartner.create({
      data: {
        userId: user.id,
        tier: 'GOLD',
        companyName: '优服佳销售合伙人公司',
        description: '示例销售合伙人 - 可邀请用户和服务商入驻',
        referralCode,
      },
    });

    // 创建统计记录
    await prisma.salesPartnerStats.create({
      data: {
        partnerId: partner.id,
        // 为演示添加一些虚拟统计数据
        totalUsersInvited: 45,
        totalProvidersInvited: 12,
        weekUsersInvited: 8,
        monthUsersInvited: 20,
      },
    });

    // 创建绑定到此销售合伙人的示例用户和服务商
    // 这演示了 "一个用户只能绑定一个销售合伙人" 的约束
    const bindingCount = await prisma.user.count({
      where: { invitedBySalesPartnerId: partner.id }
    });

    if (bindingCount === 0) {
      // 创建一个被此销售合伙人邀请的示例用户
      const sampleUser = await prisma.user.findFirst({
        where: {
          email: { contains: 'demo' }
        },
      });

      if (sampleUser && !sampleUser.invitedBySalesPartnerId) {
        await prisma.user.update({
          where: { id: sampleUser.id },
          data: { invitedBySalesPartnerId: partner.id },
        });
        console.log(`✅ Bound demo user to sales partner`);
      }
    }

    console.log(`✅ Created GOLD tier sales partner`);
    console.log(`   Company: 优服佳销售合伙人公司`);
    console.log(`   Referral Code: ${referralCode}`);
    console.log(`   Total Users Invited: 45`);
    console.log(`   Total Providers Invited: 12`);
    console.log(`   Binding Rule: 一个用户/服务商只能绑定一个销售合伙人`);

    const finalCount = await prisma.salesPartner.count();
    console.log(`\n📊 Total sales partners: ${finalCount}`);
    console.log('✅ Sales partners initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing sales partners:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initSalesPartners();
