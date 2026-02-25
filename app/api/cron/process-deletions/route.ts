/**
 * POST /api/cron/process-deletions
 *
 * CPPA 被遗忘权 — 批量处理待删除请求
 *
 * 触发方式:
 *   Vercel Cron: schedule "0 2 * * *" (每天凌晨 2:00 UTC)
 *   本地测试: curl -X POST -H "x-cron-key: $CRON_API_KEY" http://localhost:3000/api/cron/process-deletions
 *
 * 匿名化策略（不物理删除，保留 7 年财务记录）:
 *   User.email      → "deleted_{id}@anonymized.invalid"
 *   User.phone      → null
 *   User.firstName  → "已删除"
 *   User.lastName   → "用户"
 *   User.avatar     → null
 *   User.bio        → null
 *   User.postalCode → null
 *   User.latitude   → null
 *   User.longitude  → null
 *   User.status     → DELETED
 *   User.isAnonymized → true
 *   User.deletionCompletedAt → now
 *
 * 保留记录（法律要求）:
 *   - Order, Payment（CRA 7 年财务要求）
 *   - ContractSignature（法律效力）
 *   - PADAuthorization（Payments Canada 要求）
 *   - Passkeys、AuthTokens → 物理删除（onDelete: Cascade 自动处理）
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

const BATCH_SIZE = 10;

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  // ── 0. 认证 ───────────────────────────────────────────────────────────────
  const apiKey = req.headers.get('x-cron-key') ?? req.headers.get('x-api-key');
  if (apiKey !== process.env.CRON_API_KEY) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results = { processed: 0, completed: 0, failed: 0, errors: [] as string[] };

  // ── 1. 查询待处理的删除请求 ──────────────────────────────────────────────
  const requests = await prisma.dataDeletionRequest.findMany({
    where:   { status: 'PENDING' },
    include: { user: { select: { id: true, email: true, status: true } } },
    orderBy: { requestedAt: 'asc' },
    take:    BATCH_SIZE,
  });

  console.log(`[DeletionCron] Found ${requests.length} pending deletion requests`);

  for (const req of requests) {
    results.processed++;
    const userId = req.userId;

    try {
      // ── 2. 标记为 PROCESSING ──────────────────────────────────────────────
      await prisma.dataDeletionRequest.update({
        where: { id: req.id },
        data:  { status: 'PROCESSING' },
      });

      // ── 3. 匿名化用户 PII 字段 ─────────────────────────────────────────────
      const anonymizedEmail = `deleted_${userId}@anonymized.invalid`;

      await prisma.user.update({
        where: { id: userId },
        data:  {
          email:              anonymizedEmail,
          phone:              null,
          firstName:          '已删除',
          lastName:           '用户',
          avatar:             null,
          bio:                null,
          postalCode:         null,
          latitude:           null,
          longitude:          null,
          city:               null,
          province:           null,
          mfaSecret:          null,
          status:             'DELETED',
          isAnonymized:       true,
          deletionCompletedAt: now,
          deletionRequestedAt: req.requestedAt,
        },
      });

      // ── 4. 审计日志 —— 记录哪些字段被匿名化 ──────────────────────────────
      const auditLog = JSON.stringify({
        anonymizedAt: now.toISOString(),
        fieldsAnonymized: ['email', 'phone', 'firstName', 'lastName', 'avatar', 'bio', 'postalCode', 'latitude', 'longitude', 'city', 'province', 'mfaSecret'],
        retained: ['Order', 'Payment', 'ContractSignature', 'PADAuthorization'],
        retentionReason: '加拿大税法要求财务记录保留 7 年（PIPEDA/CRA）',
      });

      // ── 5. 标记为 COMPLETED + 写审计日志 ─────────────────────────────────
      await prisma.dataDeletionRequest.update({
        where: { id: req.id },
        data:  {
          status:      'PARTIALLY_RETAINED',
          completedAt: now,
          auditLog,
        },
      });

      // ── 6. 发送完成通知 ────────────────────────────────────────────────────
      await prisma.notification.create({
        data: {
          userId,
          type:    'DELETION_COMPLETED',
          title:   '数据删除已完成',
          message: '您的个人信息（姓名、电话、地址等）已完成匿名化处理。财务记录依加拿大税法要求保留 7 年。',
          actionUrl: '/app/settings/data-deletion',
        },
      });

      results.completed++;
      console.log(`[DeletionCron] ✅ Anonymized user ${userId}`);

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[DeletionCron] ❌ Failed for user ${userId}:`, err);

      // 回滚状态为 PENDING（下次 Cron 重试）
      try {
        await prisma.dataDeletionRequest.update({
          where: { id: req.id },
          data:  { status: 'PENDING' },
        });
      } catch { /* ignore rollback error */ }

      results.failed++;
      results.errors.push(`user:${userId}: ${errMsg}`);
    }
  }

  console.log(`[DeletionCron] Done: ${JSON.stringify(results)}`);

  return NextResponse.json({
    success: true,
    message: `Deletion job completed at ${now.toISOString()}`,
    data:    results,
  });
}
