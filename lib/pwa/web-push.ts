/**
 * Web Push 服务端工具（web-push 库）
 *
 * 环境变量:
 *   VAPID_PUBLIC_KEY  — 公钥（前端 pushManager.subscribe 使用）
 *   VAPID_PRIVATE_KEY — 私钥（服务端签名）
 *   VAPID_EMAIL       — 联系邮箱（Web Push 协议要求）
 *
 * 生成密钥对:
 *   npx web-push generate-vapid-keys
 */

import webPush, { PushSubscription, SendResult } from 'web-push';

// ── VAPID 初始化（单例）──────────────────────────────────────────────────────

let _initialized = false;

function initVapid(): void {
  if (_initialized) return;

  const publicKey  = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email      = process.env.VAPID_EMAIL ?? 'admin@youfujia.ca';

  if (!publicKey || !privateKey) {
    console.warn('[WebPush] VAPID keys not set — push notifications disabled');
    return;
  }

  webPush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  _initialized = true;
}

// ── Push Payload 类型 ────────────────────────────────────────────────────────

export interface PushPayload {
  title:   string;
  body:    string;
  icon?:   string;  // 默认 /icons/icon-192x192.png
  url?:    string;  // 点击跳转 URL
  tag?:    string;  // 通知分组 tag（相同 tag 会替换旧通知）
}

// ── 发送单条 Push ─────────────────────────────────────────────────────────────

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  initVapid();

  if (!_initialized) {
    return { success: false, error: 'VAPID keys not configured' };
  }

  const data: PushPayload = {
    icon: '/icons/icon-192x192.png',
    url:  '/app',
    ...payload,
  };

  try {
    await webPush.sendNotification(subscription, JSON.stringify(data));
    return { success: true };
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    // 410 Gone — 订阅已失效，需从数据库删除
    if (error.statusCode === 410) {
      return { success: false, error: 'SUBSCRIPTION_EXPIRED' };
    }
    console.error('[WebPush] sendNotification error:', err);
    return { success: false, error: error.message ?? 'Unknown error' };
  }
}

// ── 批量发送（给多个用户订阅） ──────────────────────────────────────────────

export interface BulkPushResult {
  total:    number;
  success:  number;
  expired:  string[]; // 需要删除的 endpoint 列表
  failed:   number;
}

export async function sendBulkPushNotifications(
  subscriptions: Array<{ id: string; subscription: PushSubscription }>,
  payload: PushPayload
): Promise<BulkPushResult> {
  initVapid();

  const result: BulkPushResult = { total: subscriptions.length, success: 0, expired: [], failed: 0 };

  await Promise.allSettled(
    subscriptions.map(async ({ id, subscription }) => {
      const { success, error } = await sendPushNotification(subscription, payload);
      if (success) {
        result.success++;
      } else if (error === 'SUBSCRIPTION_EXPIRED') {
        result.expired.push(id);
        result.failed++;
      } else {
        result.failed++;
      }
    })
  );

  return result;
}

// ── 从 Notification 模型触发 Push ────────────────────────────────────────────

import { prisma } from '@/lib/db';

/**
 * 根据 userId 查询其所有有效的 Web Push 订阅并发送通知
 * 自动清理过期订阅（状态码 410）
 */
export async function notifyUserViaPush(
  userId: string,
  payload: PushPayload
): Promise<void> {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      webPushEndpoint: { not: null },
      pushNotifications: true,
    },
  });

  if (subscriptions.length === 0) return;

  const pushSubs = subscriptions.map((s) => ({
    id: s.id,
    subscription: {
      endpoint: s.webPushEndpoint!,
      keys: {
        p256dh: s.webPushP256dh!,
        auth:   s.webPushAuth!,
      },
    } as PushSubscription,
  }));

  const { expired } = await sendBulkPushNotifications(pushSubs, payload);

  // 清理过期订阅
  if (expired.length > 0) {
    await prisma.subscription.deleteMany({ where: { id: { in: expired } } });
    console.log(`[WebPush] Cleaned ${expired.length} expired subscriptions for user ${userId}`);
  }
}
