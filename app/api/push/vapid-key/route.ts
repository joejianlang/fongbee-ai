/**
 * GET /api/push/vapid-key
 *
 * 返回 VAPID 公钥供前端 pushManager.subscribe 使用
 * 公钥无需鉴权，但仍需来自服务端（防止硬编码到客户端）
 */

import { ApiResponse } from '@/lib/types';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse<ApiResponse>> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { success: false, message: 'Web Push 未配置' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { vapidPublicKey: publicKey },
  });
}
