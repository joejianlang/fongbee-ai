import { prisma } from '@/lib/db';
import { ApiResponse, ServiceCategoryDef } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * DELETE /api/admin/service-categories/[id]
 * 删除服务分类
 */
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = params;

    // Check if category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: { _count: { select: { formFields: true } } },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: '分类不存在' },
        { status: 404 }
      );
    }

    // Delete category (this will cascade delete related formFields if configured in schema)
    await prisma.serviceCategory.delete({
      where: { id },
    });

    // Admin log
    await prisma.adminLog.create({
      data: {
        adminId: 'system',
        action: 'DELETE',
        resourceType: 'ServiceCategory',
        resourceId: id,
        changesJson: JSON.stringify({ deletedCategory: category }),
      },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除分类失败' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/service-categories/[id]
 * 更新服务分类（例如启用/禁用）
 */
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ServiceCategoryDef>>> {
  try {
    const { id } = params;
    const body = await req.json();

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: body,
      include: { _count: { select: { formFields: true } } },
    });

    // Admin log
    await prisma.adminLog.create({
      data: {
        adminId: 'system',
        action: 'UPDATE',
        resourceType: 'ServiceCategory',
        resourceId: id,
        changesJson: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true, data: category as unknown as ServiceCategoryDef });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新分类失败' },
      { status: 500 }
    );
  }
}
