import { prisma } from '@/lib/db';
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

    // TODO: Send verification code via email or SMS
    // For email: use SendGrid or similar service
    // For SMS: use Twilio or similar service
    // Email template should include:
    // - 6-digit code
    // - Expiration time (10 minutes)
    // - Security notice
    // Example:
    // if (identifierType === 'email') {
    //   await sendEmail({
    //     to: user.email,
    //     subject: '您的验证码',
    //     template: 'verification-code',
    //     data: { code, expiresAt }
    //   });
    // } else {
    //   await sendSMS({
    //     to: user.phone,
    //     message: `您的验证码是: ${code}. 10分钟内有效。`
    //   });
    // }

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
