/**
 * POST /api/push/subscribe   — 注册/更新 Web Push 订阅
 * DELETE /api/push/subscribe — 取消订阅
 *
 * 前端流程:
 * 1. navigator.serviceWorker.register('/sw.js')
 * 2. reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })
 * 3. POST /api/push/subscribe with { subscription: PushSubscription }
 */

import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth:   z.string(),
    }),
  }),
  deviceId: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { subscription, deviceId } = parsed.data;

  // Upsert — 同一 endpoint 只保留一条记录
  const record = await prisma.subscription.upsert({
    where:  { webPushEndpoint: subscription.endpoint },
    update: {
      userId:           session.user.id,
      webPushP256dh:    subscription.keys.p256dh,
      webPushAuth:      subscription.keys.auth,
      pushNotifications: true,
      deviceId:         deviceId ?? undefined,
      updatedAt:        new Date(),
    },
    create: {
      userId:            session.user.id,
      webPushEndpoint:   subscription.endpoint,
      webPushP256dh:     subscription.keys.p256dh,
      webPushAuth:       subscription.keys.auth,
      pushNotifications: true,
      deviceId:          deviceId ?? undefined,
    },
  });

  return NextResponse.json(
    { success: true, message: 'Push 订阅已保存', data: { subscriptionId: record.id } },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const endpoint: string | undefined = body?.endpoint;

  if (!endpoint) {
    // 删除该用户的所有订阅
    await prisma.subscription.deleteMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ success: true, message: '所有 Push 订阅已取消' });
  }

  // 删除指定 endpoint
  const deleted = await prisma.subscription.deleteMany({
    where: { userId: session.user.id, webPushEndpoint: endpoint },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ success: false, message: '订阅不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Push 订阅已取消' });
}
