import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const templateSchema = z.object({
  type: z.enum(['VERIFY_CODE', 'PROVIDER_HIRED', 'SALES_INVITATION', 'PROVIDER_INVITATION', 'USER_INVITATION', 'ORDER_CONFIRMATION', 'SERVICE_REMINDER']),
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  description: z.string().optional(),
  variables: z.string().optional(),
  isActive: z.boolean().default(true),
});

export interface EmailTemplateDetail {
  id: string;
  type: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  description?: string;
  variables?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/admin/email-templates
 * 获取所有邮件模板
 */
export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<EmailTemplateDetail[]>>> {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: templates.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        subject: t.subject,
        htmlContent: t.htmlContent,
        textContent: t.textContent ?? undefined,
        description: t.description ?? undefined,
        variables: t.variables ?? undefined,
        isActive: t.isActive,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取邮件模板失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/email-templates
 * 更新邮件模板
 */
export async function PUT(
  req: NextRequest
): Promise<NextResponse<ApiResponse<EmailTemplateDetail>>> {
  try {
    const body = await req.json();
    const { type, ...data } = templateSchema.parse(body);

    const template = await prisma.emailTemplate.update({
      where: { type: type as any },
      data: {
        ...data,
        variables: data.variables || null,
        textContent: data.textContent || null,
      },
    });

    // Admin log
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        resourceType: 'EmailTemplate',
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
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent ?? undefined,
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
      { success: false, error: error instanceof Error ? error.message : '更新邮件模板失败' },
      { status: 500 }
    );
  }
}
