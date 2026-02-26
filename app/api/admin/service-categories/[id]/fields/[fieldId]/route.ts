import { prisma } from '@/lib/db';
import { ApiResponse, FormFieldDef } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z.object({
  required: z.boolean().optional(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  displayOrder: z.number().optional(),
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
 * PATCH /api/admin/service-categories/[id]/fields/[fieldId]
 * 更新表单字段
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
): Promise<NextResponse<ApiResponse<FormFieldDef>>> {
  try {
    const { id: categoryId, fieldId } = await params;
    const body = await req.json();
    const updates = updateSchema.parse(body);

    const field = await prisma.formField.update({
      where: { id: fieldId },
      data: updates,
    });

    await prisma.adminLog.create({
      data: {
        adminId: 'system',
        action: 'UPDATE',
        resourceType: 'FormField',
        resourceId: fieldId,
        changesJson: JSON.stringify(updates),
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
 * DELETE /api/admin/service-categories/[id]/fields/[fieldId]
 * 删除表单字段
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id: categoryId, fieldId } = await params;

    await prisma.formField.delete({
      where: { id: fieldId },
    });

    await prisma.adminLog.create({
      data: {
        adminId: 'system',
        action: 'DELETE',
        resourceType: 'FormField',
        resourceId: fieldId,
        changesJson: JSON.stringify({}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除字段失败' },
      { status: 500 }
    );
  }
}
