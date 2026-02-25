import { prisma } from '@/lib/db';
import { ApiResponse, FormFieldDef } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z.object({
  fieldType: z.enum(['text', 'textarea', 'number', 'select', 'multiselect', 'chips', 'multichips', 'date']).optional(),
  label: z.string().min(1).max(80).optional(),
  placeholder: z.string().optional().nullable(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

function serializeField(f: any): FormFieldDef {
  return {
    id: f.id,
    categoryId: f.categoryId,
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
 * PATCH /api/admin/fields/[fieldId]
 * 更新单个表单字段
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> }
): Promise<NextResponse<ApiResponse<FormFieldDef>>> {
  try {
    const { fieldId } = await params;
    const body = await req.json();
    const { options, ...rest } = updateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...rest };
    if (options !== undefined) {
      updateData.optionsJson = options ? JSON.stringify(options) : null;
    }

    const field = await prisma.formField.update({
      where: { id: fieldId },
      data: updateData,
    });

    await prisma.adminLog.create({
      data: {
        adminId: 'system',
        action: 'UPDATE',
        resourceType: 'FormField',
        resourceId: fieldId,
        changesJson: JSON.stringify({ ...rest, options }),
      },
    });

    return NextResponse.json({ success: true, data: serializeField(field) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新字段失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/fields/[fieldId]
 * 删除单个表单字段
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { fieldId } = await params;

    await prisma.formField.delete({ where: { id: fieldId } });

    await prisma.adminLog.create({
      data: {
        adminId: 'system',
        action: 'DELETE',
        resourceType: 'FormField',
        resourceId: fieldId,
      },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除字段失败' },
      { status: 500 }
    );
  }
}
