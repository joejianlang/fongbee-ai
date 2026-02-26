import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string().max(100).optional(),
  type: z.enum(['USER', 'SERVICE_PROVIDER', 'SALES_PARTNER']),
});

/**
 * POST /api/admin/sales-partners/[id]/invite
 * 销售合伙人发送邀请（生成邀请链接和邀请码）
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await req.json();
    const data = inviteSchema.parse(body);

    // 验证销售合伙人存在
    const partner = await prisma.salesPartner.findUnique({
      where: { id: params.id },
    });

    if (!partner) {
      return NextResponse.json({ success: false, error: '销售合伙人不存在' }, { status: 404 });
    }

    // 邀请过期时间（30天后）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 创建邀请记录
    const invitation = await prisma.salesPartnerInvitation.create({
      data: {
        partnerId: partner.id,
        inviteeEmail: data.email,
        inviteePhone: data.phone,
        inviteeName: data.name,
        inviteeType: data.type,
        status: 'PENDING',
        expiresAt,
      },
    });

    // 生成销售合伙人注册链接（包含邀请码和合伙人的referralCode）
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register/sales-partner?referral=${partner.referralCode}&invitation=${invitation.id}`;

    // 获取短信模板（发送邀请SMS）
    const smsTemplate = await prisma.sMSTemplate.findUnique({
      where: { type: 'PROVIDER_INVITE' },
    });

    if (smsTemplate && (data.phone || data.email)) {
      // TODO: 发送短信邀请
      // 这里可以根据类型发送不同的邀请消息
      console.log(`📱 SMS邀请将发送到: ${data.phone || data.email}`);
    }

    // Admin log
    await prisma.adminLog.create({
      data: {
        action: 'CREATE',
        resourceType: 'SalesPartnerInvitation',
        resourceId: invitation.id,
        changesJson: JSON.stringify({
          partnerId: partner.id,
          inviteeEmail: data.email,
          inviteePhone: data.phone,
          type: data.type,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        invitationId: invitation.id,
        invitationLink,
        referralCode: partner.referralCode,
        expiresAt: expiresAt.toISOString(),
        target: data.email || data.phone,
        type: data.type,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '发送邀请失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sales-partners/[id]/invite
 * 获取该销售合伙人的所有邀请记录
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { partnerId: params.id };
    if (status) where.status = status;
    if (type) where.inviteeType = type;

    const invitations = await prisma.salesPartnerInvitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.salesPartnerInvitation.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        invitations: invitations.map((inv) => ({
          id: inv.id,
          email: inv.inviteeEmail,
          phone: inv.inviteePhone,
          name: inv.inviteeName,
          type: inv.inviteeType,
          status: inv.status,
          expiresAt: inv.expiresAt.toISOString(),
          acceptedAt: inv.acceptedAt?.toISOString(),
          createdAt: inv.createdAt.toISOString(),
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取邀请记录失败' },
      { status: 500 }
    );
  }
}
