import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

interface Params { id: string }

/* ─── PUT /api/news-categories/[id] ──────────────────────────────────────── */
export async function PUT(
  req: NextRequest,
  context: { params: Params }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = context.params;
    const body = await req.json() as {
      name?: string;
      icon?: string;
      color?: string;
      description?: string;
      keywords?: string[];   // array from frontend
      filterType?: string;
      displayOrder?: number;
      isActive?: boolean;
    };

    if (body.name) {
      const collision = await prisma.newsCategory.findFirst({
        where: { name: body.name.trim(), id: { not: id } },
      });
      if (collision) {
        return NextResponse.json(
          { success: false, error: '该分类名称已存在' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.newsCategory.update({
      where: { id },
      data: {
        ...(body.name        !== undefined && { name:         body.name.trim() }),
        ...(body.icon        !== undefined && { icon:         body.icon.trim()        || null }),
        ...(body.color       !== undefined && { color:        body.color.trim()       || null }),
        ...(body.description !== undefined && { description:  body.description.trim() || null }),
        ...(body.keywords    !== undefined && { keywords:     JSON.stringify(body.keywords) }),
        ...(body.filterType  !== undefined && { filterType:   body.filterType }),
        ...(body.displayOrder !== undefined && { displayOrder: body.displayOrder }),
        ...(body.isActive    !== undefined && { isActive:     body.isActive }),
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Failed to update news category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update news category' },
      { status: 500 }
    );
  }
}

/* ─── DELETE /api/news-categories/[id] ───────────────────────────────────── */
export async function DELETE(
  _req: NextRequest,
  context: { params: Params }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = context.params;
    await prisma.newsCategory.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, message: '分类已删除' });
  } catch (error) {
    console.error('Failed to delete news category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete news category' },
      { status: 500 }
    );
  }
}
