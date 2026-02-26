import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

const createSalesPartnerSchema = z.object({
  userId: z.string().min(1, '用户ID必填'),
  companyName: z.string().min(1, '公司名称必填').max(200),
  businessPhone: z.string().optional(),
  invitationId: z.string().optional(),
});

function generateReferralCode(): string {
  return 'SP' + crypto.randomBytes(12).toString('hex').toUpperCase().substring(0, 14);
}

/**
 * POST /api/sales-partners
 * 创建销售合伙人账户（从邀请注册流程调用）
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await req.json();
    const data = createSalesPartnerSchema.parse(body);

    // 检查用户是否已有销售合伙人账户
    const existingPartner = await prisma.salesPartner.findUnique({
      where: { userId: data.userId },
    });

    if (existingPartner) {
      return NextResponse.json(
        { success: false, error: '该用户已是销售合伙人' },
        { status: 400 }
      );
    }

    // 如果提供了invitationId，验证邀请
    if (data.invitationId) {
      const invitation = await prisma.salesPartnerInvitation.findUnique({
        where: { id: data.invitationId },
      });

      if (!invitation) {
        return NextResponse.json(
          { success: false, error: '邀请不存在' },
          { status: 404 }
        );
      }

      if (new Date() > invitation.expiresAt) {
        return NextResponse.json(
          { success: false, error: '邀请已过期' },
          { status: 400 }
        );
      }

      if (invitation.status !== 'PENDING') {
        return NextResponse.json(
          { success: false, error: `邀请状态已是 ${invitation.status}` },
          { status: 400 }
        );
      }
    }

    // 生成唯一的邀请码
    let referralCode = generateReferralCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.salesPartner.findUnique({
        where: { referralCode },
      });
      if (!existing) break;
      referralCode = generateReferralCode();
      attempts++;
    }

    if (attempts >= 5) {
      return NextResponse.json(
        { success: false, error: '生成邀请码失败，请重试' },
        { status: 500 }
      );
    }

    // 创建销售合伙人
    const partner = await prisma.salesPartner.create({
      data: {
        userId: data.userId,
        companyName: data.companyName,
        referralCode,
        tier: 'BRONZE', // 新注册默认为青铜级
        status: 'ACTIVE',
        description: `${data.companyName} - 销售合伙人`,
      },
    });

    // 创建初始统计记录
    await prisma.salesPartnerStats.create({
      data: {
        partnerId: partner.id,
        totalUsersInvited: 0,
        totalProvidersInvited: 0,
        weekUsersInvited: 0,
        monthUsersInvited: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: partner.id,
        userId: partner.userId,
        companyName: partner.companyName,
        tier: partner.tier,
        status: partner.status,
        referralCode: partner.referralCode,
        createdAt: partner.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建销售合伙人失败' },
      { status: 500 }
    );
  }
}
