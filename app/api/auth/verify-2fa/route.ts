import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, code } = body;

    // Validate input
    if (!sessionId || !code) {
      return NextResponse.json(
        { success: false, error: '缺少必要的验证信息' },
        { status: 400 }
      );
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: '验证码格式错误' },
        { status: 400 }
      );
    }

    // TODO: Verify 2FA code
    // 1. Query temporary session by sessionId
    // 2. Check if code is valid and not expired
    // 3. Mark session as verified
    // 4. Generate JWT token

    // Mock successful 2FA verification
    const user = {
      id: 'admin_123',
      email: 'admin@youfujia.ca',
      role: 'ADMIN',
      name: '管理员',
    };

    return NextResponse.json(
      {
        success: true,
        message: '验证成功',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        token: 'jwt_token_here',
        redirectUrl: '/admin',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { success: false, error: '验证失败，请重试' },
      { status: 500 }
    );
  }
}
