import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/service-categories
 * Public endpoint — returns all active service categories for registration form
 */
export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        nameEn: true,
        icon: true,
        color: true,
        slug: true,
        description: true,
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Failed to fetch service categories:', error);
    return NextResponse.json(
      { success: false, error: '获取服务分类失败' },
      { status: 500 }
    );
  }
}
