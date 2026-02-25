/**
 * GET    /api/feed/sources/[id] — Admin: get single feed source
 * PUT    /api/feed/sources/[id] — Admin: update feed source
 * DELETE /api/feed/sources/[id] — Admin: delete feed source
 *
 * Requires ADMIN role.
 */

import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { z } from 'zod';

const updateSourceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(['RSS', 'YOUTUBE']).optional(),
  url: z.string().url().optional(),
  crawlCron: z.string().optional(),
  isActive: z.boolean().optional(),
  language: z.string().optional(),
  category: z.string().optional(),
});

interface RouteParams {
  params: { id: string };
}

async function requireAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!(session?.user && (session.user as { role?: string }).role === 'ADMIN');
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const source = await prisma.feedSource.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { articles: true, crawlLogs: true } },
        crawlLogs: {
          orderBy: { crawledAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!source) {
      return NextResponse.json(
        { success: false, message: 'Feed source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: source });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body: unknown = await req.json();
    const data = updateSourceSchema.parse(body);

    const source = await prisma.feedSource.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, data: source, message: 'Feed source updated' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', data: err.errors },
        { status: 400 }
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.feedSource.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: 'Feed source deleted' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
