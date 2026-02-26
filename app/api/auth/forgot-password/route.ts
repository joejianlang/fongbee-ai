import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone } = body;

    // Validate input - at least one identifier required
    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: '请提供邮箱或手机号' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: '无效的邮箱格式' },
        { status: 400 }
      );
    }

    // Validate phone format if provided
    if (phone && !/^[\d\s\-\+\(\)]{10,}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: '无效的手机号格式' },
        { status: 400 }
      );
    }

    // TODO: Check if user exists
    // Query database by email or phone

    // TODO: Generate reset token
    // Create a secure token with expiration (e.g., 1 hour)

    // TODO: Send reset email or SMS
    // Send password reset link to user

    // Always return success message for security reasons
    // Don't reveal whether email/phone exists in the system
    return NextResponse.json(
      {
        success: true,
        message: '密码重置链接已发送，请检查您的邮箱或短信',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, error: '处理失败，请重试' },
      { status: 500 }
    );
  }
}
