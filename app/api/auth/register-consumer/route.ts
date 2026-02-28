import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyCode } from '@/lib/register-code-store';

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  name: z.string().min(1).max(50),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validated = schema.parse(body);
    const { email, code, name, password, confirmPassword } = validated;

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: '两次密码输入不一致' },
        { status: 400 }
      );
    }

    // Verify the registration code
    const codeValid = verifyCode(email, code);
    if (!codeValid) {
      return NextResponse.json(
        { success: false, error: '验证码无效或已过期，请重新获取' },
        { status: 400 }
      );
    }

    // Check if already registered
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被注册，请直接登录' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Split name
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || undefined;

    // Create CUSTOMER user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'CUSTOMER',
      } as any,
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    // Issue JWT (same pattern as signin API)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        success: true,
        message: '注册成功！',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(' '),
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('register-consumer error:', error);
    return NextResponse.json(
      { success: false, error: '注册失败，请重试' },
      { status: 500 }
    );
  }
}
