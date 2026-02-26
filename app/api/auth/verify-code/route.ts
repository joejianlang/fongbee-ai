import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const verifyCodeSchema = z.object({
  identifier: z.string().min(1, { message: '邮箱或手机号不能为空' }),
  identifierType: z.enum(['email', 'phone']),
  code: z.string().regex(/^\d{6}$/, { message: '验证码必须是6位数字' }),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Validate input
    const validated = verifyCodeSchema.parse(body);
    const { identifier, identifierType, code } = validated;

    // Find user
    const user = await prisma.user.findFirst({
      where:
        identifierType === 'email'
          ? { email: identifier }
          : { phone: identifier },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: '用户不存在',
        },
        { status: 401 }
      );
    }

    // Find and verify the code
    const authToken = await prisma.authToken.findFirst({
      where: {
        userId: user.id,
        token: code,
        type: 'LOGIN_CODE',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          error: '验证码无效或已过期',
        },
        { status: 401 }
      );
    }

    // Delete used code
    await prisma.authToken.delete({
      where: { id: authToken.id },
    });

    // Check if admin (requires 2FA)
    if (user.role === 'ADMIN') {
      // Generate temporary session ID for 2FA
      const sessionId =
        'session_' + Math.random().toString(36).substr(2, 20).toUpperCase();

      // Store temporary session
      await prisma.authToken.create({
        data: {
          userId: user.id,
          token: sessionId,
          type: '2FA_SESSION',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        },
      });

      // TODO: Send 2FA code to email
      const twoFACode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      await prisma.authToken.create({
        data: {
          userId: user.id,
          token: twoFACode,
          type: '2FA_CODE',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      console.log(`[DEV] 2FA code for admin ${user.email}: ${twoFACode}`);

      return NextResponse.json(
        {
          success: true,
          requiresTwoFA: true,
          sessionId,
          message: '验证码已发送到您的邮箱',
        },
        { status: 200 }
      );
    }

    // Generate JWT token for non-admin users
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Determine redirect URL based on role
    let redirectUrl = '/dashboard';
    if (user.role === 'SERVICE_PROVIDER') {
      redirectUrl = '/dashboard/service-provider';
    } else if (user.role === 'SALES_PARTNER') {
      redirectUrl = '/dashboard/sales-partner';
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
        token,
        redirectUrl,
      },
      { status: 200 }
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

    console.error('Verify code error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '验证失败，请重试',
      },
      { status: 500 }
    );
  }
}
