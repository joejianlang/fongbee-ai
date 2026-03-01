import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const sendCodeSchema = z.object({
  identifier: z.string().min(1),
  identifierType: z.enum(['email', 'phone']),
  codeType: z.enum(['LOGIN', 'VERIFICATION']),
});

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Validate input
    const validated = sendCodeSchema.parse(body);
    const { identifier, identifierType, codeType } = validated;

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
        role: true,
      },
    });

    // If user not found, still return success (security best practice - don't reveal if user exists)
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: '如果该账户存在，验证码将被发送',
        },
        { status: 200 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in database
    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: code,
        type: codeType === 'LOGIN' ? 'LOGIN_CODE' : 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    // Send verification code via email or SMS
    if (identifierType === 'email' && user.email) {
      await sendEmail({
        to: user.email,
        subject: '优服佳登录验证码',
        htmlContent: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#0d9488;margin-bottom:8px">优服佳</h2>
            <p style="color:#374151;margin-bottom:24px">您正在登录优服佳，请使用以下验证码完成身份验证：</p>
            <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#0d9488;
                        background:#f0fdfa;padding:24px;text-align:center;border-radius:12px;
                        margin:24px 0">${code}</div>
            <p style="color:#6b7280;font-size:13px">验证码 10 分钟内有效，请勿泄露给他人。</p>
            <p style="color:#6b7280;font-size:13px">如果这不是您本人的操作，请忽略此邮件。</p>
          </div>`,
      });
    } else if (identifierType === 'phone' && user.phone) {
      await sendSMS(
        user.phone,
        `您的优服佳登录验证码是：${code}，10分钟内有效，请勿告知他人。`
      );
    }

    console.log(`[DEV] Verification code for ${identifier}: ${code}`);

    return NextResponse.json(
      {
        success: true,
        message:
          identifierType === 'email'
            ? '验证码已发送到您的邮箱'
            : '验证码已发送到您的手机',
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

    console.error('Send code error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '发送验证码失败，请重试',
      },
      { status: 500 }
    );
  }
}
