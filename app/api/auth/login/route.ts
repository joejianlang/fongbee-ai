import { NextRequest, NextResponse } from 'next/server';
import { validatePassword } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, password, role } = body;

    // Validate input
    if (!password) {
      return NextResponse.json(
        { success: false, error: '密码为必填项' },
        { status: 400 }
      );
    }

    // Check credentials based on role
    let identifier: string = '';
    if (role === 'SERVICE_PROVIDER' && phone) {
      identifier = phone;
      // Validate phone number format
      if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
        return NextResponse.json(
          { success: false, error: '无效的手机号格式' },
          { status: 400 }
        );
      }
    } else if (email) {
      identifier = email;
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { success: false, error: '无效的邮箱格式' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: '缺少必要的联系方式' },
        { status: 400 }
      );
    }

    // TODO: Verify credentials against database
    // This is where you would:
    // 1. Query user from database by email/phone
    // 2. Compare password hash
    // 3. Check if account is active
    // 4. Check login attempts and lockout status

    // Mock successful login response
    const user = {
      id: 'user_123',
      email: email || null,
      phone: phone || null,
      role,
      name: '用户名',
      createdAt: new Date(),
    };

    // Check if 2FA is required
    const requiresTwoFA = role === 'ADMIN';

    if (requiresTwoFA) {
      // TODO: Generate and send 2FA code
      return NextResponse.json(
        {
          success: true,
          requiresTwoFA: true,
          sessionId: 'temp_session_id',
          message: '验证码已发送到您的邮箱',
        },
        { status: 200 }
      );
    }

    // Create session/token
    // TODO: Generate JWT token and set secure session cookie

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          name: user.name,
        },
        token: 'jwt_token_here',
        redirectUrl: role === 'SERVICE_PROVIDER'
          ? '/dashboard/service-provider'
          : role === 'SALES_PARTNER'
          ? '/dashboard/sales-partner'
          : '/admin',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请重试' },
      { status: 500 }
    );
  }
}
