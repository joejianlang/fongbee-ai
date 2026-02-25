import { prisma } from '@/lib/db';
import { ApiResponse, FormTemplateDef } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/form-templates/[categoryId]
 * 公开端点：返回指定分类的表单模板（含字段列表）
 * 支持通过 categoryId 或 slug 查询
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
): Promise<NextResponse<ApiResponse<FormTemplateDef>>> {
  try {
    const { categoryId } = await params;

    // 支持 id 或 slug 查询
    const category = await prisma.serviceCategory.findFirst({
      where: {
        OR: [{ id: categoryId }, { slug: categoryId }],
        isActive: true,
      },
      include: {
        formFields: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: '未找到该服务分类' },
        { status: 404 }
      );
    }

    const template: FormTemplateDef = {
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
      categoryIcon: category.icon ?? undefined,
      categoryColor: category.color ?? undefined,
      fields: category.formFields.map((f) => ({
        id: f.id,
        categoryId: f.categoryId,
        fieldType: f.fieldType as FormTemplateDef['fields'][number]['fieldType'],
        fieldKey: f.fieldKey,
        label: f.label,
        placeholder: f.placeholder ?? undefined,
        required: f.required,
        options: f.optionsJson ? JSON.parse(f.optionsJson) : undefined,
        displayOrder: f.displayOrder,
      })),
    };

    return NextResponse.json(
      { success: true, data: template },
      {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取表单模板失败' },
      { status: 500 }
    );
  }
}
