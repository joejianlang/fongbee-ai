import { prisma } from '@/lib/db';
import { ApiResponse, FormFieldDef, PaginatedResponse } from '@/lib/types';
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

const getQuerySchema = z.object({
  templateType: z.string().default('STANDARD_SERVICE'),
  page:         z.coerce.number().min(1).default(1),
  limit:        z.coerce.number().min(1).max(100).default(20),
});

/**
 * GET /api/admin/service-categories/[id]/fields?templateType=STANDARD_SERVICE&page=1&limit=20
 * 获取该分类指定表单模板类型的表单字段（分页）
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<PaginatedResponse<FormFieldDef>>>> {
  try {
    const { id } = await params;
    const sp = req.nextUrl.searchParams;
    const parsed = getQuerySchema.safeParse({
      templateType: sp.get('templateType') || undefined,
      page:         sp.get('page')         || undefined,
      limit:        sp.get('limit')        || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { templateType, page, limit } = parsed.data;
    const skip = (page - 1) * limit;
    const where = { categoryId: id, templateType: templateType as any };

    const [fields, total] = await Promise.all([
      prisma.formField.findMany({ where, orderBy: { displayOrder: 'asc' }, skip, take: limit }),
      prisma.formField.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: fields.map(serializeField),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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
