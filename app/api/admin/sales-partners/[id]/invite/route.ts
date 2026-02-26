import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendTemplatedEmail } from '@/lib/email';
import { sendTemplatedSMS } from '@/lib/sms';

const inviteSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string().max(100).optional(),
  type: z.enum(['USER', 'SERVICE_PROVIDER', 'SALES_PARTNER']),
});

/**
 * POST /api/admin/sales-partners/[id]/invite
 * 销售合伙人发送邀请（生成邀请链接和邀请码）
 * 根据邀请类型和联系方式选择对应的模板
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

    const contact = data.email || data.phone;
    if (!contact) {
      return NextResponse.json({ success: false, error: '邮箱和手机号至少填一个' }, { status: 400 });
    }

    // 检查用户是否已存在
    let existingUser = null;
    if (data.email) {
      existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        include: { serviceProvider: true, salesPartner: true },
      });
    } else if (data.phone) {
      existingUser = await prisma.user.findUnique({
        where: { phone: data.phone },
        include: { serviceProvider: true, salesPartner: true },
      });
    }

    // 如果用户已存在，检查是否已有该角色
    if (existingUser) {
      if (data.type === 'USER') {
        return NextResponse.json(
          { success: false, error: `用户已存在，无法重复注册用户角色。该用户邮箱: ${existingUser.email || existingUser.phone}` },
          { status: 400 }
        );
      } else if (data.type === 'SERVICE_PROVIDER') {
        if (existingUser.serviceProvider) {
          return NextResponse.json(
            { success: false, error: `该用户已是服务商，无法重复注册服务商角色。该用户邮箱: ${existingUser.email || existingUser.phone}` },
            { status: 400 }
          );
        }
      } else if (data.type === 'SALES_PARTNER') {
        if (existingUser.salesPartner) {
          return NextResponse.json(
            { success: false, error: `该用户已是销售合伙人，无法重复注册销售合伙人角色。该用户邮箱: ${existingUser.email || existingUser.phone}` },
            { status: 400 }
          );
        }
      }
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

    // 生成邀请链接
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register/sales-partner?referral=${partner.referralCode}&invitation=${invitation.id}`;

    // 根据邀请类型和联系方式选择对应的模板并发送
    if (data.email) {
      // 根据邀请类型选择邮件模板
      let emailTemplateType;
      switch (data.type) {
        case 'USER':
          emailTemplateType = 'USER_INVITATION';
          break;
        case 'SERVICE_PROVIDER':
          emailTemplateType = 'PROVIDER_INVITATION';
          break;
        case 'SALES_PARTNER':
          emailTemplateType = 'SALES_INVITATION';
          break;
      }

      const emailTemplate = await prisma.emailTemplate.findUnique({
        where: { type: emailTemplateType as any },
      });

      if (emailTemplate && emailTemplate.isActive) {
        try {
          // Prepare template variables
          const templateVariables: Record<string, string | number> = {
            name: data.name || data.email,
            invitationLink,
          };

          // Add type-specific variables
          if (data.type === 'USER') {
            templateVariables.inviterName = partner.companyName || '优服佳';
            templateVariables.invitationCode = partner.referralCode;
            templateVariables.signupLink = invitationLink;
          } else {
            templateVariables.registerLink = invitationLink;
          }

          await sendTemplatedEmail(
            data.email,
            emailTemplate.subject,
            emailTemplate.htmlContent,
            templateVariables
          );
          console.log(`📧 邮件邀请已发送到: ${data.email}`);
        } catch (emailError) {
          console.error(`⚠️  邮件发送失败:`, emailError);
          // Don't throw - continue even if email fails
        }
      }
    } else if (data.phone) {
      // 短信只有服务商邀请模板，其他类型用通用提示
      const smsTemplate = await prisma.sMSTemplate.findUnique({
        where: { type: 'PROVIDER_INVITE' },
      });

      if (smsTemplate && smsTemplate.isActive) {
        try {
          // Prepare SMS template variables
          const smsVariables: Record<string, string | number> = {
            invitationLink,
            invitationCode: partner.referralCode,
            type: data.type,
          };

          await sendTemplatedSMS(
            data.phone,
            smsTemplate.content || `邀请链接: ${invitationLink}`,
            smsVariables
          );
          console.log(`📱 短信邀请已发送到: ${data.phone}`);
        } catch (smsError) {
          console.error(`⚠️  短信发送失败:`, smsError);
          // Don't throw - continue even if SMS fails
        }
      }
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
          inviteeType: data.type,
          contact: data.email || data.phone,
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
        templateType: data.email
          ? data.type === 'USER'
            ? 'USER_INVITATION'
            : data.type === 'SERVICE_PROVIDER'
              ? 'PROVIDER_INVITATION'
              : 'SALES_INVITATION'
          : 'PROVIDER_INVITE',
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
