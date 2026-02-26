import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const acceptInvitationSchema = z.object({
  userId: z.string().min(1, '用户ID必填'),
});

/**
 * POST /api/sales-partners/invitations/[invitationId]/accept
 * 用户或服务商接受销售合伙人的邀请
 * 这会将用户/服务商绑定到销售合伙人
 * 约束: 一个用户/服务商只能绑定一个销售合伙人
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { invitationId: string } }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await req.json();
    const { userId } = acceptInvitationSchema.parse(body);

    // 获取邀请记录
    const invitation = await prisma.salesPartnerInvitation.findUnique({
      where: { id: params.invitationId },
      include: { partner: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: '邀请不存在' },
        { status: 404 }
      );
    }

    // 检查邀请是否过期
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { success: false, error: '邀请已过期' },
        { status: 400 }
      );
    }

    // 检查邀请状态
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: `邀请状态已是 ${invitation.status}` },
        { status: 400 }
      );
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 检查用户是否已绑定到其他销售合伙人
    if (user.invitedBySalesPartnerId && user.invitedBySalesPartnerId !== invitation.partnerId) {
      return NextResponse.json(
        { success: false, error: '您已绑定到其他销售合伙人，无法再绑定新的销售合伙人' },
        { status: 400 }
      );
    }

    // 更新邀请状态
    const updatedInvitation = await prisma.salesPartnerInvitation.update({
      where: { id: params.invitationId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedUserId: userId,
      },
    });

    // 绑定用户到销售合伙人
    if (invitation.inviteeType === 'USER') {
      await prisma.user.update({
        where: { id: userId },
        data: { invitedBySalesPartnerId: invitation.partnerId },
      });
    } else if (invitation.inviteeType === 'SERVICE_PROVIDER') {
      // 确保用户有对应的服务商资料
      const serviceProvider = await prisma.serviceProvider.findUnique({
        where: { userId },
      });

      if (!serviceProvider) {
        return NextResponse.json(
          { success: false, error: '服务商资料不存在' },
          { status: 404 }
        );
      }

      // 检查服务商是否已绑定到其他销售合伙人
      if (serviceProvider.invitedBySalesPartnerId && serviceProvider.invitedBySalesPartnerId !== invitation.partnerId) {
        return NextResponse.json(
          { success: false, error: '您的服务商账户已绑定到其他销售合伙人，无法再绑定新的销售合伙人' },
          { status: 400 }
        );
      }

      await prisma.serviceProvider.update({
        where: { id: serviceProvider.id },
        data: { invitedBySalesPartnerId: invitation.partnerId },
      });
    }

    // 更新销售合伙人统计
    await prisma.salesPartnerStats.upsert({
      where: { partnerId: invitation.partnerId },
      create: {
        partnerId: invitation.partnerId,
        totalUsersInvited: invitation.inviteeType === 'USER' ? 1 : 0,
        totalProvidersInvited: invitation.inviteeType === 'SERVICE_PROVIDER' ? 1 : 0,
        weekUsersInvited: invitation.inviteeType === 'USER' ? 1 : 0,
        monthUsersInvited: invitation.inviteeType === 'USER' ? 1 : 0,
      },
      update: {
        totalUsersInvited: {
          increment: invitation.inviteeType === 'USER' ? 1 : 0,
        },
        totalProvidersInvited: {
          increment: invitation.inviteeType === 'SERVICE_PROVIDER' ? 1 : 0,
        },
        weekUsersInvited: {
          increment: invitation.inviteeType === 'USER' ? 1 : 0,
        },
        monthUsersInvited: {
          increment: invitation.inviteeType === 'USER' ? 1 : 0,
        },
      },
    });

    // Admin log
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        resourceType: 'SalesPartnerInvitation',
        resourceId: updatedInvitation.id,
        changesJson: JSON.stringify({
          status: 'ACCEPTED',
          userId,
          type: invitation.inviteeType,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        invitationId: updatedInvitation.id,
        partnerId: invitation.partnerId,
        userId,
        type: invitation.inviteeType,
        message: `成功绑定到销售合伙人`,
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
      { success: false, error: error instanceof Error ? error.message : '接受邀请失败' },
      { status: 500 }
    );
  }
}
