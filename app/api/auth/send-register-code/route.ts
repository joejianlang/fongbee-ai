import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Upsert into pending_codes table (replaces any previous code for this email)
    await prisma.pendingCode.upsert({
      where: { email },
      update: { code, expiresAt },
      create: { email, code, expiresAt },
    });

    // Send email via SendGrid
    try {
      await sendEmail({
        to: email,
        subject: '数位 Buffet 注册验证码',
        htmlContent: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#0d9488;font-size:24px;margin-bottom:8px">数位 Buffet</h2>
            <p style="color:#374151;font-size:15px;margin-bottom:24px">
              您正在注册数位 Buffet 账号，请使用以下验证码完成注册：
            </p>
            <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#0d9488;
                        background:#f0fdfa;padding:24px;text-align:center;border-radius:12px;
                        margin:24px 0">
              ${code}
            </div>
            <p style="color:#6b7280;font-size:13px">验证码 10 分钟内有效，请勿泄露给他人。</p>
            <p style="color:#6b7280;font-size:13px">如非本人操作，请忽略此邮件。</p>
          </div>
        `,
      });
    } catch (emailErr) {
      // Email failed — still return success but log the code for dev debugging
      console.warn('[register-code] Email send failed:', emailErr);
      console.log(`[DEV] Register code for ${email}: ${code}`);
    }

    // Always log in dev for easy testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Register code for ${email}: ${code}`);
    }

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
