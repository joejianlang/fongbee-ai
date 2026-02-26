import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateSalesPartnerSchema = z.object({
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  companyName: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

/**
 * GET /api/admin/sales-partners/[id]
 * 获取销售合伙人详情及统计
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const partner = await prisma.salesPartner.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        stats: true,
        invitations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ success: false, error: '销售合伙人不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: partner.id,
        userId: partner.userId,
        companyName: partner.companyName,
        tier: partner.tier,
        status: partner.status,
        referralCode: partner.referralCode,
        description: partner.description,
        createdAt: partner.createdAt.toISOString(),
        updatedAt: partner.updatedAt.toISOString(),
        stats: partner.stats,
        recentInvitations: partner.invitations.map((inv) => ({
          id: inv.id,
          type: inv.inviteeType,
          email: inv.inviteeEmail,
          phone: inv.inviteePhone,
          status: inv.status,
          createdAt: inv.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取销售合伙人失败' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/sales-partners/[id]
 * 更新销售合伙人信息
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await req.json();
    const updates = updateSalesPartnerSchema.parse(body);

    const partner = await prisma.salesPartner.update({
      where: { id: params.id },
      data: updates,
      include: { stats: true },
    });

    // Admin log
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        resourceType: 'SalesPartner',
        resourceId: partner.id,
        changesJson: JSON.stringify(updates),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: partner.id,
        tier: partner.tier,
        status: partner.status,
        companyName: partner.companyName,
        description: partner.description,
        updatedAt: partner.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新销售合伙人失败' },
      { status: 500 }
    );
  }
}
