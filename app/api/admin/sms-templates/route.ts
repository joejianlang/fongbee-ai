import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const templateSchema = z.object({
  type: z.enum(['VERIFY_CODE', 'PROVIDER_INVITE', 'NEW_ASSIGNED_ORDER', 'START_REFUSED', 'SERVICE_COMPLETED', 'REWORK_REQUIRED', 'PROVIDER_RESPONSE_ACCEPTED', 'PROVIDER_RESPONSE_DECLINED', 'ORDER_CANCELLED', 'PAYMENT_REMINDER', 'SERVICE_START_REQUEST', 'NEW_MESSAGE_NOTICE', 'DEPOSIT_RECEIVED', 'SERVICE_START_REMINDER', 'REVIEW_REMINDER']),
  name: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  description: z.string().optional(),
  variables: z.string().optional(),
  isActive: z.boolean().default(true),
});

export interface SMSTemplateDetail {
  id: string;
  type: string;
  name: string;
  content: string;
  description?: string;
  variables?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/admin/sms-templates
 * 获取所有短信模板
 */
export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<SMSTemplateDetail[]>>> {
  try {
    const templates = await prisma.sMSTemplate.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: templates.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        content: t.content,
        description: t.description ?? undefined,
        variables: t.variables ?? undefined,
        isActive: t.isActive,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取短信模板失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/sms-templates
 * 更新短信模板
 */
export async function PUT(
  req: NextRequest
): Promise<NextResponse<ApiResponse<SMSTemplateDetail>>> {
  try {
    const body = await req.json();
    const { type, ...data } = templateSchema.parse(body);

    const template = await prisma.sMSTemplate.update({
      where: { type: type as any },
      data: {
        ...data,
        variables: data.variables || null,
      },
    });

    // Admin log
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        resourceType: 'SMSTemplate',
        resourceId: template.id,
        changesJson: JSON.stringify(data),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: template.id,
        type: template.type,
        name: template.name,
        content: template.content,
        description: template.description ?? undefined,
        variables: template.variables ?? undefined,
        isActive: template.isActive,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新短信模板失败' },
      { status: 500 }
    );
  }
}
