/**
 * POST /api/push/send
 *
 * 管理员向指定用户（或所有用户）发送 Push 通知
 * 仅限 ADMIN 角色
 *
 * Body:
 *   targetUserId? — 指定用户 ID（不填则广播给所有已订阅用户，最多 500 条/次）
 *   title         — 通知标题
 *   body          — 通知正文
 *   url?          — 点击跳转 URL（默认 /app）
 *   tag?          — 通知分组 tag
 */

import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { sendBulkPushNotifications } from '@/lib/pwa/web-push';
import type { PushSubscription } from 'web-push';

const sendSchema = z.object({
  targetUserId: z.string().optional(),
  title:        z.string().min(1).max(100),
  body:         z.string().min(1).max(500),
  url:          z.string().optional(),
  tag:          z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { targetUserId, title, body: msgBody, url, tag } = parsed.data;

  // 查询目标订阅
  const subscriptions = await prisma.subscription.findMany({
    where: {
      ...(targetUserId ? { userId: targetUserId } : {}),
      webPushEndpoint:   { not: null },
      webPushP256dh:     { not: null },
      webPushAuth:       { not: null },
      pushNotifications: true,
    },
    take: 500,
  });

  if (subscriptions.length === 0) {
    return NextResponse.json(
      { success: false, message: '没有找到有效的 Push 订阅' },
      { status: 404 }
    );
  }

  const pushSubs = subscriptions.map((s) => ({
    id: s.id,
    subscription: {
      endpoint: s.webPushEndpoint!,
      keys: { p256dh: s.webPushP256dh!, auth: s.webPushAuth! },
    } as PushSubscription,
  }));

  const result = await sendBulkPushNotifications(pushSubs, {
    title,
    body: msgBody,
    url:  url ?? '/app',
    tag:  tag ?? 'youfujia-admin',
  });

  // 清理过期订阅
  if (result.expired.length > 0) {
    await prisma.subscription.deleteMany({ where: { id: { in: result.expired } } });
  }

  return NextResponse.json({
    success: true,
    message: `Push 发送完成`,
    data: {
      total:   result.total,
      success: result.success,
      failed:  result.failed,
      expired: result.expired.length,
    },
  });
}
