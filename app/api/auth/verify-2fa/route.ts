import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const verify2FASchema = z.object({
  sessionId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Validate input
    const validated = verify2FASchema.parse(body);
    const { sessionId, code } = validated;

    // Find the temporary 2FA session
    const session = await prisma.authToken.findFirst({
      where: {
        token: sessionId,
        type: 'TWO_FA_SESSION',
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        userId: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: '会话已过期，请重新登录',
        },
        { status: 401 }
      );
    }

    // Find and verify the 2FA code
    const twoFAToken = await prisma.authToken.findFirst({
      where: {
        userId: session.userId,
        token: code,
        type: 'TWO_FA_CODE',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!twoFAToken) {
      return NextResponse.json(
        {
          success: false,
          error: '验证码无效或已过期',
        },
        { status: 401 }
      );
    }

    // Delete used tokens
    await prisma.authToken.deleteMany({
      where: {
        userId: session.userId,
        type: {
          in: ['TWO_FA_SESSION', 'TWO_FA_CODE'],
        },
      },
    });

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
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

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Determine redirect URL (admin always goes to /admin)
    const redirectUrl = '/admin';

    return NextResponse.json(
      {
        success: true,
        message: '验证成功',
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

    console.error('2FA verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '验证失败，请重试',
      },
      { status: 500 }
    );
  }
}
