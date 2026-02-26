import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

const createSalesPartnerSchema = z.object({
  userId: z.string().min(1),
  companyName: z.string().max(100).optional(),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD']).default('BRONZE'),
  description: z.string().max(500).optional(),
});

const updateSalesPartnerSchema = z.object({
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  companyName: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

function generateReferralCode(): string {
  return 'SP' + crypto.randomBytes(12).toString('hex').toUpperCase().substring(0, 14);
}

export interface SalesPartnerDetail {
  id: string;
  userId: string;
  companyName?: string;
  tier: string;
  status: string;
  referralCode: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  totalUsersInvited?: number;
  totalProvidersInvited?: number;
  weekUsersInvited?: number;
  monthUsersInvited?: number;
}

/**
 * GET /api/admin/sales-partners
 * 获取所有销售合伙人
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<any[]>>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const tier = searchParams.get('tier');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (tier) where.tier = tier;
    if (status) where.status = status;

    const partners = await prisma.salesPartner.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatar: true },
        },
        stats: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: partners.map((p) => ({
        id: p.id,
        userId: p.userId,
        email: p.user.email,
        name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' '),
        avatar: p.user.avatar,
        companyName: p.companyName,
        tier: p.tier,
        status: p.status,
        referralCode: p.referralCode,
        description: p.description,
        totalUsersInvited: p.stats?.totalUsersInvited || 0,
        totalProvidersInvited: p.stats?.totalProvidersInvited || 0,
        weekUsersInvited: p.stats?.weekUsersInvited || 0,
        monthUsersInvited: p.stats?.monthUsersInvited || 0,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取销售合伙人失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sales-partners
 * 创建新销售合伙人
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<SalesPartnerDetail>>> {
  try {
    const body = await req.json();
    const data = createSalesPartnerSchema.parse(body);

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    // 生成唯一邀请码
    let referralCode = generateReferralCode();
    let exists = await prisma.salesPartner.findUnique({
      where: { referralCode },
    });
    while (exists) {
      referralCode = generateReferralCode();
      exists = await prisma.salesPartner.findUnique({
        where: { referralCode },
      });
    }

    const partner = await prisma.salesPartner.create({
      data: {
        userId: data.userId,
        tier: data.tier,
        companyName: data.companyName,
        description: data.description,
        referralCode,
      },
    });

    // 创建统计记录
    await prisma.salesPartnerStats.create({
      data: {
        partnerId: partner.id,
      },
    });

    // Admin log
    await prisma.adminLog.create({
      data: {
        action: 'CREATE',
        resourceType: 'SalesPartner',
        resourceId: partner.id,
        changesJson: JSON.stringify(data),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: partner.id,
        userId: partner.userId,
        companyName: partner.companyName ?? undefined,
        tier: partner.tier,
        status: partner.status,
        referralCode: partner.referralCode,
        description: partner.description ?? undefined,
        createdAt: partner.createdAt.toISOString(),
        updatedAt: partner.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建销售合伙人失败' },
      { status: 500 }
    );
  }
}
