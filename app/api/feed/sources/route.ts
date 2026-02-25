/**
 * GET /api/feed/sources  — Admin: list all feed sources
 * POST /api/feed/sources — Admin: create a new feed source
 *
 * Requires ADMIN role.
 */

import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { z } from 'zod';

const createSourceSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['RSS', 'YOUTUBE']),
  url: z.string().url(),
  crawlCron: z.string().default('0 */6 * * *'),
  isActive: z.boolean().default(true),
  language: z.string().default('en'),
  category: z.string().optional(),
});

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, message: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const sources = await prisma.feedSource.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { articles: true, crawlLogs: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: sources });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, message: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const body: unknown = await req.json();
    const data = createSourceSchema.parse(body);

    const source = await prisma.feedSource.create({ data });

    return NextResponse.json(
      { success: true, data: source, message: 'Feed source created' },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', data: err.errors },
        { status: 400 }
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
