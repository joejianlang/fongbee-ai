import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { setCode } from '@/lib/register-code-store';

const schema = z.object({
  email: z.string().email(),
});

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    // Check if email is already registered
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被注册，请直接登录' },
        { status: 400 }
      );
    }

    const code = generateCode();
    setCode(email, code);

    // TODO: send real email; for now log to console
    console.log(`[DEV] Register code for ${email}: ${code}`);

    return NextResponse.json({ success: true, message: '验证码已发送到您的邮箱' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }
    console.error('send-register-code error:', error);
    return NextResponse.json({ success: false, error: '发送失败，请重试' }, { status: 500 });
  }
}
