import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/sales-partners/invitations/[invitationId]/validate
 * 验证邀请链接是否有效
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { invitationId: string } }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const invitation = await prisma.salesPartnerInvitation.findUnique({
      where: { id: params.invitationId },
      include: {
        partner: {
          select: {
            id: true,
            companyName: true,
            tier: true,
            referralCode: true,
          },
        },
      },
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

    return NextResponse.json({
      success: true,
      data: {
        invitationId: invitation.id,
        inviteeEmail: invitation.inviteeEmail,
        inviteeName: invitation.inviteeName,
        inviteeType: invitation.inviteeType,
        expiresAt: invitation.expiresAt.toISOString(),
        partner: {
          id: invitation.partner.id,
          companyName: invitation.partner.companyName,
          tier: invitation.partner.tier,
          referralCode: invitation.partner.referralCode,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '验证失败' },
      { status: 500 }
    );
  }
}
