// POST /api/cron/capture-deposits
//
// 48h 自动划扣 Cron Job
//
// 触发方式:
//   Vercel Cron: vercel.json, schedule "every 5 minutes"
//   EasyCron: POST https://youfujia.ca/api/cron/capture-deposits
//   本地测试: curl -X POST -H "x-cron-key: $CRON_API_KEY" http://localhost:3000/api/cron/capture-deposits
//
// 核心设计:
// 1. 乐观锁: status -> CRON_CAPTURING (数据库层防并发)
// 2. Redis 幂等锁: SET NX EX 600 (Upstash Redis 防重复执行)
// 3. Retry 上限: captureAttempts >= 3 -> 跳过，发告警给管理员
// 4. 状态机: AUTHORIZED -> CRON_CAPTURING -> CAPTURED / (失败回滚 -> AUTHORIZED)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { capturePayment } from '@/lib/payment/stripe';
import { acquireCronLock, releaseCronLock } from '@/lib/cache/redis';
import { ApiResponse } from '@/lib/types';

const MAX_RETRY_ATTEMPTS = 3;

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  // ── 0. 认证 ────────────────────────────────────────────────────────────────
  const apiKey = req.headers.get('x-cron-key') ?? req.headers.get('x-api-key');
  if (apiKey !== process.env.CRON_API_KEY) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results = {
    processed: 0,
    captured: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
  };

  // ── 1. 查询到期订单 ─────────────────────────────────────────────────────────
  const ordersToCapture = await prisma.order.findMany({
    where: {
      status: 'AUTHORIZED',
      scheduledCaptureAt: { lte: now },
      stripeIntentId: { not: null },
      captureAttempts: { lt: MAX_RETRY_ATTEMPTS }, // 最多重试 3 次
    },
    include: {
      paymentPolicy: true,
      customer: { select: { id: true, email: true, phone: true } },
    },
    orderBy: { scheduledCaptureAt: 'asc' }, // 优先处理最早到期的
    take: 100, // 单次批量上限
  });

  console.log(`[Cron] Found ${ordersToCapture.length} orders to capture at ${now.toISOString()}`);

  for (const order of ordersToCapture) {
    results.processed++;

    // ── 2. 检查支付政策 ───────────────────────────────────────────────────────
    if (!order.paymentPolicy.isAutoCaptureEnabled) {
      results.skipped++;
      console.log(`[Cron] Skip ${order.orderNumber}: auto-capture disabled`);
      continue;
    }

    // ── 3. Redis 幂等锁（防止多实例并发重复执行同一订单） ──────────────────────
    const lockAcquired = await acquireCronLock(order.id);
    if (!lockAcquired) {
      results.skipped++;
      console.log(`[Cron] Skip ${order.orderNumber}: lock held by another instance`);
      continue;
    }

    try {
      // ── 4. 乐观锁: AUTHORIZED → CRON_CAPTURING（原子操作防并发） ──────────────
      const locked = await prisma.order.updateMany({
        where: {
          id: order.id,
          status: 'AUTHORIZED', // 只有仍是 AUTHORIZED 时才能推进
        },
        data: {
          status: 'CRON_CAPTURING',
          captureAttempts: { increment: 1 },
        },
      });

      if (locked.count === 0) {
        // 已被另一个并发实例处理
        results.skipped++;
        console.log(`[Cron] Skip ${order.orderNumber}: status changed by concurrent process`);
        await releaseCronLock(order.id);
        continue;
      }

      // ── 5. 调用 Stripe Capture ─────────────────────────────────────────────
      const captureResult = await capturePayment(order.stripeIntentId!);

      if (captureResult.success) {
        // ── 6a. 成功: 更新状态 + 记录 Payment + 创建 Escrow ──────────────────
        await prisma.$transaction([
          // 订单状态 → CAPTURED
          prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'CAPTURED',
              actualCapturedAt: now,
              stripeIntentStatus: 'succeeded',
            },
          }),
          // Payment 记录
          prisma.payment.create({
            data: {
              orderId: order.id,
              type: 'CAPTURE',
              amount: captureResult.capturedAmountCad,
              stripeTransactionId: captureResult.transactionId,
              stripeStatus: 'succeeded',
              escrowedAt: now,
            },
          }),
          // Escrow 托管
          prisma.escrow.upsert({
            where: { orderId: order.id },
            update: { amount: captureResult.capturedAmountCad, status: 'HOLDING' },
            create: {
              orderId: order.id,
              amount: captureResult.capturedAmountCad,
              status: 'HOLDING',
            },
          }),
          // 通知客户
          prisma.notification.create({
            data: {
              userId: order.customerId,
              type: 'DEPOSIT_CAPTURED',
              title: '定金已划扣',
              message: `您的订单 ${order.orderNumber} 定金 CAD $${captureResult.capturedAmountCad.toFixed(2)} 已划扣，服务将按计划进行。`,
              relatedOrderId: order.id,
              actionUrl: `/app/orders/${order.id}`,
            },
          }),
        ]);

        results.captured++;
        console.log(`[Cron] ✅ Captured ${order.orderNumber}: CAD $${captureResult.capturedAmountCad}`);

      } else {
        // ── 6b. 失败: 回滚到 AUTHORIZED + 记录错误 ───────────────────────────
        const currentAttempts = order.captureAttempts + 1;
        const newStatus = currentAttempts >= MAX_RETRY_ATTEMPTS ? 'DISPUTED' : 'AUTHORIZED';

        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: newStatus },
          }),
          prisma.payment.create({
            data: {
              orderId: order.id,
              type: 'CAPTURE',
              amount: Number(order.depositAmount),
              errorMessage: captureResult.errorMessage,
              errorCode: 'CAPTURE_FAILED',
              retryCount: currentAttempts,
            },
          }),
          // 超过重试上限时通知管理员
          ...(currentAttempts >= MAX_RETRY_ATTEMPTS
            ? [
                prisma.notification.create({
                  data: {
                    userId: order.customerId,
                    type: 'PAYMENT_FAILED',
                    title: '支付失败',
                    message: `订单 ${order.orderNumber} 自动划扣失败，请联系客服处理。`,
                    relatedOrderId: order.id,
                  },
                }),
              ]
            : []),
        ]);

        results.failed++;
        results.errors.push(`${order.orderNumber}: ${captureResult.errorMessage}`);
        console.error(`[Cron] ❌ Capture failed ${order.orderNumber}: ${captureResult.errorMessage}`);
      }
    } catch (err) {
      // ── 7. 异常: 安全回滚 ──────────────────────────────────────────────────
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Cron] 💥 Exception for ${order.orderNumber}:`, err);

      // 尝试回滚状态（可能 DB 本身出问题，所以加 try/catch）
      try {
        await prisma.order.updateMany({
          where: { id: order.id, status: 'CRON_CAPTURING' },
          data: { status: 'AUTHORIZED' },
        });
      } catch (rollbackErr) {
        console.error(`[Cron] Rollback failed for ${order.id}:`, rollbackErr);
      }

      results.failed++;
      results.errors.push(`${order.orderNumber}: ${errMsg}`);
    } finally {
      await releaseCronLock(order.id);
    }
  }

  console.log(`[Cron] Done: ${JSON.stringify(results)}`);

  return NextResponse.json({
    success: true,
    message: `Capture job completed at ${now.toISOString()}`,
    data: results,
  });
}
