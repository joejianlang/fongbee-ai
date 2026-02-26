import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/sales-partners/[id]/stats
 * 获取销售合伙人的详细统计信息
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const partner = await prisma.salesPartner.findUnique({
      where: { id: params.id },
      include: { stats: true },
    });

    if (!partner) {
      return NextResponse.json({ success: false, error: '销售合伙人不存在' }, { status: 404 });
    }

    const stats = partner.stats;

    // 获取邀请统计
    const acceptedInvitations = await prisma.salesPartnerInvitation.findMany({
      where: {
        partnerId: params.id,
        status: 'ACCEPTED',
      },
    });

    const userInvitations = acceptedInvitations.filter((inv) => inv.inviteeType === 'USER').length;
    const providerInvitations = acceptedInvitations.filter(
      (inv) => inv.inviteeType === 'SERVICE_PROVIDER'
    ).length;

    // 获取周期统计
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 周一
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekAcceptedCount = await prisma.salesPartnerInvitation.count({
      where: {
        partnerId: params.id,
        status: 'ACCEPTED',
        acceptedAt: {
          gte: weekStart,
          lte: now,
        },
      },
    });

    const monthAcceptedCount = await prisma.salesPartnerInvitation.count({
      where: {
        partnerId: params.id,
        status: 'ACCEPTED',
        acceptedAt: {
          gte: monthStart,
          lte: now,
        },
      },
    });

    // 获取总邀请数
    const totalInvitations = await prisma.salesPartnerInvitation.count({
      where: { partnerId: params.id },
    });

    const pendingInvitations = await prisma.salesPartnerInvitation.count({
      where: {
        partnerId: params.id,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        partnerId: params.id,
        tier: partner.tier,
        // 总体统计
        total: {
          usersInvited: stats?.totalUsersInvited || 0,
          providersInvited: stats?.totalProvidersInvited || 0,
          totalInvitations: stats?.totalInvitations || 0,
        },
        // 当周统计
        week: {
          usersInvited: stats?.weekUsersInvited || 0,
          providersInvited: stats?.weekProvidersInvited || 0,
          weekStart: weekStart.toISOString(),
        },
        // 当月统计
        month: {
          usersInvited: stats?.monthUsersInvited || 0,
          providersInvited: stats?.monthProvidersInvited || 0,
          monthStart: monthStart.toISOString(),
        },
        // 邀请状态
        invitations: {
          total: totalInvitations,
          pending: pendingInvitations,
          accepted: acceptedInvitations.length,
        },
        // 邀请详情
        acceptedByType: {
          users: userInvitations,
          providers: providerInvitations,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取统计信息失败' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/sales-partners/[id]/stats
 * 手动刷新统计数据（当有邀请被接受时调用）
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const partner = await prisma.salesPartner.findUnique({
      where: { id: params.id },
      include: { stats: true },
    });

    if (!partner || !partner.stats) {
      return NextResponse.json({ success: false, error: '销售合伙人不存在' }, { status: 404 });
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 计算总数
    const totalAccepted = await prisma.salesPartnerInvitation.findMany({
      where: {
        partnerId: params.id,
        status: 'ACCEPTED',
      },
    });

    const totalUsersInvited = totalAccepted.filter((inv) => inv.inviteeType === 'USER').length;
    const totalProvidersInvited = totalAccepted.filter(
      (inv) => inv.inviteeType === 'SERVICE_PROVIDER'
    ).length;

    // 计算周数据
    const weekAccepted = await prisma.salesPartnerInvitation.findMany({
      where: {
        partnerId: params.id,
        status: 'ACCEPTED',
        acceptedAt: {
          gte: weekStart,
          lte: now,
        },
      },
    });

    const weekUsersInvited = weekAccepted.filter((inv) => inv.inviteeType === 'USER').length;
    const weekProvidersInvited = weekAccepted.filter(
      (inv) => inv.inviteeType === 'SERVICE_PROVIDER'
    ).length;

    // 计算月数据
    const monthAccepted = await prisma.salesPartnerInvitation.findMany({
      where: {
        partnerId: params.id,
        status: 'ACCEPTED',
        acceptedAt: {
          gte: monthStart,
          lte: now,
        },
      },
    });

    const monthUsersInvited = monthAccepted.filter((inv) => inv.inviteeType === 'USER').length;
    const monthProvidersInvited = monthAccepted.filter(
      (inv) => inv.inviteeType === 'SERVICE_PROVIDER'
    ).length;

    // 更新统计数据
    const updatedStats = await prisma.salesPartnerStats.update({
      where: { partnerId: params.id },
      data: {
        totalUsersInvited,
        totalProvidersInvited,
        totalInvitations: totalAccepted.length,
        weekUsersInvited,
        weekProvidersInvited,
        weekStartDate: weekStart,
        monthUsersInvited,
        monthProvidersInvited,
        monthStartDate: monthStart,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: '统计数据已更新',
        stats: updatedStats,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新统计失败' },
      { status: 500 }
    );
  }
}
