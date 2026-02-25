import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const paymentPolicySchema = z.object({
  serviceType: z.enum(['standard', 'simple_custom', 'complex_custom']),
  serviceCategoryId: z.string().nullable().optional(),
  autoCaptureHoursBefore: z.coerce.number().int().positive(),
  isAutoCaptureEnabled: z.boolean().default(true),
  cancellationCutoffHours: z.coerce.number().int().positive(),
  forfeitturePercentage: z.coerce.number().int().min(0).max(100),
  depositPercentage: z.coerce.number().int().min(0).max(100).optional(),
  refundDays: z.coerce.number().int().positive().default(7),
});

/**
 * GET /api/admin/payment-policies
 * 获取所有支付政策
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<any[]>>> {
  try {
    // TODO: Check admin role from session

    const policies = await prisma.paymentPolicy.findMany({
      include: {
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: policies,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取支付政策失败',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payment-policies
 * 创建或更新支付政策
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // TODO: Check admin role from session
    const adminId = 'admin-id'; // Get from session

    const body = await req.json();
    const validated = paymentPolicySchema.parse(body);

    // Check if policy already exists
    const existingPolicy = await prisma.paymentPolicy.findUnique({
      where: {
        serviceType_serviceCategoryId: {
          serviceType: validated.serviceType,
          serviceCategoryId: validated.serviceCategoryId || null,
        },
      },
    });

    let policy;

    if (existingPolicy) {
      // Update existing policy
      policy = await prisma.paymentPolicy.update({
        where: { id: existingPolicy.id },
        data: {
          autoCaptureHoursBefore: validated.autoCaptureHoursBefore,
          isAutoCaptureEnabled: validated.isAutoCaptureEnabled,
          cancellationCutoffHours: validated.cancellationCutoffHours,
          forfeitturePercentage: validated.forfeitturePercentage,
          depositPercentage: validated.depositPercentage,
          refundDays: validated.refundDays,
        },
      });

      // Record admin log
      await prisma.adminLog.create({
        data: {
          adminId,
          action: 'UPDATE',
          resourceType: 'payment_policy',
          resourceId: policy.id,
          notes: `Updated payment policy for ${validated.serviceType}`,
        },
      });
    } else {
      // Create new policy
      policy = await prisma.paymentPolicy.create({
        data: {
          serviceType: validated.serviceType,
          serviceCategoryId: validated.serviceCategoryId || null,
          autoCaptureHoursBefore: validated.autoCaptureHoursBefore,
          isAutoCaptureEnabled: validated.isAutoCaptureEnabled,
          cancellationCutoffHours: validated.cancellationCutoffHours,
          forfeitturePercentage: validated.forfeitturePercentage,
          depositPercentage: validated.depositPercentage,
          refundDays: validated.refundDays,
          createdBy: adminId,
        },
      });

      // Record admin log
      await prisma.adminLog.create({
        data: {
          adminId,
          action: 'CREATE',
          resourceType: 'payment_policy',
          resourceId: policy.id,
          notes: `Created payment policy for ${validated.serviceType}`,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: existingPolicy ? '支付政策已更新' : '支付政策已创建',
        data: policy,
      },
      { status: existingPolicy ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: '输入验证失败',
          error: error.errors[0].message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '操作失败',
      },
      { status: 500 }
    );
  }
}
