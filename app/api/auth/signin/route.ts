import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from '@/lib/email';

const signInSchema = z.object({
  identifier: z.string().min(1),
  identifierType: z.enum(['email', 'phone']),
  password: z.string().min(1),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Validate input
    const validated = signInSchema.parse(body);
    const { identifier, identifierType, password } = validated;

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where:
        identifierType === 'email'
          ? { email: identifier }
          : { phone: identifier },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: '用户名或密码错误',
        },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          error: '用户名或密码错误',
        },
        { status: 401 }
      );
    }

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
          type: 'TWO_FA_SESSION',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        },
      });

      // Generate and store 2FA code
      const twoFACode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      await prisma.authToken.create({
        data: {
          userId: user.id,
          token: twoFACode,
          type: 'TWO_FA_CODE',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      // Send 2FA code via email (dev: also log to console)
      if (process.env.NODE_ENV === 'production') {
        await sendEmail({
          to: user.email,
          subject: '优服佳管理后台 - 登录验证码',
          htmlContent: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#0d9488">优服佳管理后台</h2>
              <p>您正在登录管理后台，请使用以下验证码完成身份验证：</p>
              <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0d9488;
                          background:#f0fdfa;padding:20px;text-align:center;border-radius:8px;
                          margin:24px 0">${twoFACode}</div>
              <p style="color:#6b7280;font-size:14px">验证码 10 分钟内有效，请勿泄露给他人。</p>
              <p style="color:#6b7280;font-size:14px">如非本人操作，请忽略此邮件。</p>
            </div>
          `,
        });
      } else {
        // Dev: print to terminal for easy access
        console.log(`[DEV] 2FA code for admin ${user.email}: ${twoFACode}`);
      }

      return NextResponse.json(
        {
          success: true,
          requiresTwoFA: true,
          sessionId,
          role: user.role,
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
    } else if (user.role === 'ADMIN') {
      redirectUrl = '/admin';
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
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

    console.error('Sign in error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '登录失败，请重试',
      },
      { status: 500 }
    );
  }
}
