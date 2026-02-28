/**
 * GET /api/dashboard/sales-partner/me
 * Returns the current user's sales partner profile & stats.
 * Requires an active session.
 */

import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Session user ID missing' }, { status: 401 });
  }

  try {
    const partner = await prisma.salesPartner.findUnique({
      where: { userId },
      include: {
        stats: true,
        user: {
          select: { firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ success: false, message: 'Not a sales partner' }, { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://youfujia.com';
    const ref     = partner.referralCode;

    return NextResponse.json({
      success: true,
      data: {
        id:           partner.id,
        referralCode: ref,
        tier:         partner.tier,
        status:       partner.status,
        companyName:  partner.companyName,
        providerLink: `${baseUrl}/register/service-provider?ref=${ref}`,
        userLink:     `${baseUrl}/?ref=${ref}`,
        stats: {
          totalProviders:      partner.stats?.totalProvidersInvited  ?? 0,
          totalUsers:          partner.stats?.totalUsersInvited      ?? 0,
          monthProviders:      partner.stats?.monthProvidersInvited  ?? 0,
          monthUsers:          partner.stats?.monthUsersInvited      ?? 0,
          // Earnings not yet in schema — placeholder
          monthlyEarnings:     0,
          pendingPayout:       0,
        },
        user: {
          name:   [partner.user.firstName, partner.user.lastName].filter(Boolean).join(' ') || partner.user.email,
          email:  partner.user.email,
          avatar: partner.user.avatar,
        },
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
