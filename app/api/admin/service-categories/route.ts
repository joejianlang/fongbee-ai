import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse, ServiceCategoryDef } from '@/lib/types';
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

const getQuerySchema = z.object({
  page:  z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

/**
 * GET /api/admin/service-categories
 * 获取服务分类列表（含表单字段数量，分页）
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<ServiceCategoryDef>>>> {
  try {
    const sp = req.nextUrl.searchParams;
    const parsed = getQuerySchema.safeParse({
      page:  sp.get('page')  || undefined,
      limit: sp.get('limit') || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      prisma.serviceCategory.findMany({
        include: { _count: { select: { formFields: true } } },
        orderBy: { displayOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.serviceCategory.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: categories as unknown as ServiceCategoryDef[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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
