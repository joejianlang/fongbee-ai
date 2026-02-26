import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';

// Base schema for both registration types
const baseRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['SERVICE_PROVIDER', 'SALES_PARTNER']),
});

// Extended schema for service provider (includes phone)
const serviceProviderSchema = baseRegisterSchema.extend({
  phone: z.string().min(1),
  role: z.literal('SERVICE_PROVIDER'),
});

// Extended schema for sales partner (includes company name and invitation ID)
const salesPartnerSchema = baseRegisterSchema.extend({
  companyName: z.string().min(1),
  invitationId: z.string().min(1),
  role: z.literal('SALES_PARTNER'),
});

// Union schema that handles both types
const registerSchema = z.union([serviceProviderSchema, salesPartnerSchema]);

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json();

    // Validate input
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: '该邮箱已被注册',
        },
        { status: 400 }
      );
    }

    // For sales partner, verify invitation
    if (validated.role === 'SALES_PARTNER') {
      // TODO: Verify invitation ID from database
      // For now, just check if invitationId is provided
      if (!validated.invitationId) {
        return NextResponse.json(
          {
            success: false,
            message: '无效的邀请链接',
          },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hash(validated.password, 10);

    // Create user with role-specific data
    const createData: any = {
      email: validated.email,
      password: hashedPassword,
      name: validated.name,
      role: validated.role,
    };

    // Add phone for service provider
    if (validated.role === 'SERVICE_PROVIDER') {
      createData.phone = validated.phone;
    }

    // Add company name for sales partner
    if (validated.role === 'SALES_PARTNER') {
      createData.companyName = validated.companyName;
      // TODO: Update invitation status in database
    }

    const user = await prisma.user.create({
      data: createData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Create email verification token
    const verificationToken = await prisma.authToken.create({
      data: {
        userId: user.id,
        token: Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // TODO: Send verification email with token
    // Email should contain:
    // - Verification link
    // - User name and role
    // - Security notice
    // Example:
    // await sendEmail({
    //   to: user.email,
    //   subject: '验证您的邮箱地址',
    //   template: 'email-verification',
    //   data: {
    //     name: user.name,
    //     verificationLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken.token}`,
    //     expiresIn: '24小时'
    //   }
    // });

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
          verificationRequired: false, // For now, skip email verification
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
