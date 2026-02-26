import { prisma } from '@/lib/db';
import { ApiResponse, FormFieldDef } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const fieldSchema = z.object({
  templateType: z.enum(['USER_REGISTRATION', 'STANDARD_SERVICE', 'SIMPLE_CUSTOM', 'COMPLEX_CUSTOM', 'CONTRACT']).default('STANDARD_SERVICE'),
  fieldType: z.enum(['text', 'textarea', 'number', 'select', 'multiselect', 'chips', 'multichips', 'date']),
  fieldKey: z.string().min(1).max(60).regex(/^[a-z_]+$/, 'fieldKey 只允许小写字母和下划线'),
  label: z.string().min(1).max(80),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

function serializeField(f: any): FormFieldDef {
  return {
    id: f.id,
    categoryId: f.categoryId,
    templateType: f.templateType,
    fieldType: f.fieldType,
    fieldKey: f.fieldKey,
    label: f.label,
    placeholder: f.placeholder ?? undefined,
    required: f.required,
    options: f.optionsJson ? JSON.parse(f.optionsJson) : undefined,
    displayOrder: f.displayOrder,
  };
}

/**
 * GET /api/admin/service-categories/[id]/fields?templateType=STANDARD_SERVICE
 * 获取该分类指定表单模板类型的所有表单字段
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<FormFieldDef[]>>> {
  try {
    const { id } = await params;
    const templateType = req.nextUrl.searchParams.get('templateType') || 'STANDARD_SERVICE';

    const fields = await prisma.formField.findMany({
      where: {
        categoryId: id,
        templateType: templateType as any,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: fields.map(serializeField) });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取字段失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/service-categories/[id]/fields
 * 为该分类新增一个表单字段
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<FormFieldDef>>> {
  try {
    const { id: categoryId } = await params;
    const body = await req.json();
    const { options, ...rest } = fieldSchema.parse(body);

    const field = await prisma.formField.create({
      data: {
        ...rest,
        categoryId,
        optionsJson: options ? JSON.stringify(options) : null,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId: 'system',
        action: 'CREATE',
        resourceType: 'FormField',
        resourceId: field.id,
        changesJson: JSON.stringify({ categoryId, ...rest, options }),
      },
    });

    return NextResponse.json({ success: true, data: serializeField(field) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建字段失败' },
      { status: 500 }
    );
  }
}
