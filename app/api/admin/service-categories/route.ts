import { prisma } from '@/lib/db';
import { ApiResponse, ServiceCategoryDef } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1).max(30),
  nameEn: z.string().optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'slug 只允许小写字母、数字和连字符'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/admin/service-categories
 * 获取所有服务分类（含表单字段数量）
 */
export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<ServiceCategoryDef[]>>> {
  try {
    const categories = await prisma.serviceCategory.findMany({
      include: {
        _count: { select: { formFields: true } },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: categories as unknown as ServiceCategoryDef[] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取分类失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/service-categories
 * 新增服务分类
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<ServiceCategoryDef>>> {
  try {
    const body = await req.json();
    const data = categorySchema.parse(body);

    const category = await prisma.serviceCategory.create({ data });

    // Admin log
    await prisma.adminLog.create({
      data: {
        action: 'CREATE',
        resourceType: 'ServiceCategory',
        resourceId: category.id,
        changesJson: JSON.stringify(data),
      },
    });

    return NextResponse.json({ success: true, data: category as unknown as ServiceCategoryDef }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建分类失败' },
      { status: 500 }
    );
  }
}
