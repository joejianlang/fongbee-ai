import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Base schema
const baseRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['SERVICE_PROVIDER', 'SALES_PARTNER']),
});

// Service provider: phone + optional category + dynamic fields
const serviceProviderSchema = baseRegisterSchema.extend({
  phone: z.string().min(1),
  role: z.literal('SERVICE_PROVIDER'),
  categoryId: z.string().min(1).optional(),
  registrationData: z.record(z.any()).optional(),
});

// Sales partner: company name + invitation
const salesPartnerSchema = baseRegisterSchema.extend({
  companyName: z.string().min(1),
  invitationId: z.string().min(1),
  role: z.literal('SALES_PARTNER'),
});

const registerSchema = z.union([serviceProviderSchema, salesPartnerSchema]);

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // For sales partner, verify invitation
    if (validated.role === 'SALES_PARTNER') {
      if (!validated.invitationId) {
        return NextResponse.json(
          { success: false, message: '无效的邀请链接' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hash(validated.password, 10);

    // Split name into firstName / lastName
    const nameParts = validated.name.trim().split(/\s+/);
    const firstName = nameParts[0] ?? validated.name;
    const lastName = nameParts.slice(1).join(' ') || undefined;

    // Build user create data
    const userCreateData: Record<string, unknown> = {
      email: validated.email,
      password: hashedPassword,
      firstName,
      lastName,
      role: validated.role,
    };

    if (validated.role === 'SERVICE_PROVIDER') {
      userCreateData.phone = validated.phone;
    }

    const user = await prisma.user.create({
      data: userCreateData as any,
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    // ── Service Provider: create ServiceProvider + link category ──────────
    if (validated.role === 'SERVICE_PROVIDER') {
      const providerData: Record<string, unknown> = {
        userId: user.id,
        businessName: validated.name,
        registrationData: (validated as any).registrationData ?? {},
      };

      const provider = await prisma.serviceProvider.create({
        data: providerData as any,
        select: { id: true },
      });

      // Link to selected category if provided
      const categoryId = (validated as any).categoryId;
      if (categoryId) {
        await prisma.serviceProviderCategory.create({
          data: {
            serviceProviderId: provider.id,
            categoryId,
          },
        });
      }
    }

    // Create email verification token (currently skipped)
    const verificationToken = await prisma.authToken.create({
      data: {
        userId: user.id,
        token: Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    console.log(
      `[DEV] Verification token for ${user.email}: ${verificationToken.token}`
    );

    return NextResponse.json(
      {
        success: true,
        message:
          validated.role === 'SERVICE_PROVIDER'
            ? '注册成功！'
            : '注册成功！首次注册赠送 ￥100 代金券！',
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          verificationRequired: false,
        },
      },
      { status: 201 }
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

    // Unique constraint violation — return friendly Chinese message
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.[0] ?? '';
      const fieldLabel: Record<string, string> = {
        email: '邮箱',
        phone: '手机号',
      };
      return NextResponse.json(
        { success: false, message: `该${fieldLabel[field] ?? field}已被注册` },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '注册失败',
      },
      { status: 500 }
    );
  }
}
