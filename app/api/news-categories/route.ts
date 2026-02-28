import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

/* ─── GET /api/news-categories ──────────────────────────────────────────────
   Public (default): active only — id, name, icon, color
   Admin (?all=true): all including inactive + newsCount + description + keywords + filterType
───────────────────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const all = req.nextUrl.searchParams.get('all') === 'true';

    const rows = await prisma.newsCategory.findMany({
      where: all ? undefined : { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id:           true,
        name:         true,
        icon:         true,
        color:        true,
        displayOrder: true,
        isActive:     true,
        description:  true,
        keywords:     true,   // stored as JSON string; clients parse themselves
        filterType:   true,
        createdAt:    true,
        ...(all && { _count: { select: { articles: true } } }),
      },
    });

    const data = all
      ? rows.map((r) => ({
          ...r,
          newsCount: (r as any)._count?.articles ?? 0,
          _count: undefined,
        }))
      : rows;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch news categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news categories' },
      { status: 500 }
    );
  }
}

/* ─── POST /api/news-categories ──────────────────────────────────────────── */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json() as {
      name: string;
      icon?: string;
      color?: string;
      description?: string;
      keywords?: string[];   // array of strings from frontend
      filterType?: string;
      displayOrder?: number;
    };

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    const existing = await prisma.newsCategory.findUnique({ where: { name: body.name.trim() } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: '该分类名称已存在' },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.newsCategory.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });

    const category = await prisma.newsCategory.create({
      data: {
        name:         body.name.trim(),
        icon:         body.icon?.trim()        || null,
        color:        body.color?.trim()       || null,
        description:  body.description?.trim() || null,
        keywords:     body.keywords ? JSON.stringify(body.keywords) : null,
        filterType:   body.filterType ?? 'KEYWORDS',
        displayOrder: body.displayOrder ?? (maxOrder ? maxOrder.displayOrder + 1 : 0),
        isActive:     true,
      },
    });

    return NextResponse.json(
      { success: true, data: { id: category.id } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create news category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create news category' },
      { status: 500 }
    );
  }
}
