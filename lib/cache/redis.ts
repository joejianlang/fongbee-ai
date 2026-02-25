/**
 * Redis Client — Upstash Canada Region
 *
 * 用途:
 * 1. 语义缓存 (Semantic Cache)  — TTL = 1h，缓存 AI 摘要/翻译结果
 * 2. Cron 幂等锁 (Idempotency)  — TTL = 10min，防止 48h capture Cron 并发重复执行
 * 3. 速率限制 (Rate Limit)      — 滑动窗口，保护 AI endpoint
 *
 * 加拿大数据主权: UPSTASH_REDIS_REST_URL 必须指向 ca-central-1 节点
 */

import { Redis } from '@upstash/redis';

// ── 单例 Redis 客户端 ─────────────────────────────────────────────────────────

let _redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL 和 UPSTASH_REDIS_REST_TOKEN 环境变量未设置。' +
          '\n请在 Upstash Canada Region (ca-central-1) 创建 Redis 数据库。'
      );
    }

    _redis = new Redis({ url, token });
  }
  return _redis;
}

// ── 1. 语义缓存 ───────────────────────────────────────────────────────────────

const SEMANTIC_CACHE_TTL = parseInt(
  process.env.AI_SEMANTIC_CACHE_TTL_SECONDS ?? '3600',
  10
);

/**
 * 生成语义缓存 key
 * @param namespace 命名空间: "summary" | "translate" | "tags" | "sentiment"
 * @param input     输入文本（会被截断，不超过 200 字符作为 key）
 */
export function semanticCacheKey(namespace: string, input: string): string {
  // 规范化: 小写 + 去多余空白 + 截断到 200 字符
  const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
  // 简单哈希（生产环境可换 SHA-256）
  const hash = Buffer.from(normalized).toString('base64url').slice(0, 32);
  return `semantic:${namespace}:${hash}`;
}

/**
 * 从语义缓存读取
 * @returns 缓存命中返回结果字符串，未命中返回 null
 */
export async function getSemanticCache(
  namespace: string,
  input: string
): Promise<string | null> {
  try {
    const redis = getRedisClient();
    const key = semanticCacheKey(namespace, input);
    const cached = await redis.get<string>(key);
    return cached ?? null;
  } catch (err) {
    // 缓存层故障不应中断业务
    console.warn('[Redis] getSemanticCache error (degraded gracefully):', err);
    return null;
  }
}

/**
 * 写入语义缓存
 * @param ttl 过期时间（秒），默认 1 小时
 */
export async function setSemanticCache(
  namespace: string,
  input: string,
  result: string,
  ttl = SEMANTIC_CACHE_TTL
): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = semanticCacheKey(namespace, input);
    await redis.set(key, result, { ex: ttl });
  } catch (err) {
    console.warn('[Redis] setSemanticCache error (degraded gracefully):', err);
  }
}

// ── 2. Cron 幂等锁 ────────────────────────────────────────────────────────────

const CRON_LOCK_TTL = 600; // 10 分钟，足够 Cron Job 完成

/**
 * 为 Cron Job 获取分布式锁（防止并发重复执行）
 *
 * 使用 SET NX EX 原子操作，保证只有一个实例能获取锁
 *
 * @param orderId  订单 ID
 * @returns true = 成功获取锁（可以执行），false = 已被其他实例锁定
 *
 * @example
 * const acquired = await acquireCronLock(order.id);
 * if (!acquired) return; // 已有其他 Cron 实例在处理此订单
 * try {
 *   await captureStripePayment(order.stripeIntentId);
 * } finally {
 *   await releaseCronLock(order.id);
 * }
 */
export async function acquireCronLock(orderId: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const key = `cron:capture:lock:${orderId}`;
    // SET key value NX EX ttl — 仅当 key 不存在时设置
    const result = await redis.set(key, '1', { nx: true, ex: CRON_LOCK_TTL });
    return result === 'OK';
  } catch (err) {
    console.error('[Redis] acquireCronLock error:', err);
    // 锁服务故障时保守策略：拒绝执行（避免重复划扣）
    return false;
  }
}

/**
 * 释放 Cron 幂等锁（Job 完成后调用）
 */
export async function releaseCronLock(orderId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(`cron:capture:lock:${orderId}`);
  } catch (err) {
    console.warn('[Redis] releaseCronLock error (will expire naturally):', err);
  }
}

// ── 3. 速率限制 (滑动窗口) ────────────────────────────────────────────────────

/**
 * AI endpoint 滑动窗口速率限制
 *
 * @param userId    用户 ID
 * @param endpoint  端点标识: "summary" | "translate" | "contract-analysis"
 * @param limit     窗口内最大请求次数
 * @param windowSec 窗口大小（秒），默认 60 秒
 * @returns { allowed: boolean; remaining: number; resetAt: number }
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number,
  windowSec = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const redis = getRedisClient();
    const now = Date.now();
    const key = `ratelimit:${endpoint}:${userId}`;

    // MULTI-EXEC 模拟滑动窗口（用 ZRANGEBYSCORE + ZADD + EXPIRE）
    const windowStart = now - windowSec * 1000;

    // 移除窗口外的旧记录
    await redis.zremrangebyscore(key, 0, windowStart);

    // 计算当前窗口内的请求数
    const count = await redis.zcard(key);

    if (count >= limit) {
      const oldestScore = await redis.zrange(key, 0, 0, { withScores: true });
      const resetAt =
        oldestScore.length >= 2 ? Number(oldestScore[1]) + windowSec * 1000 : now + windowSec * 1000;
      return { allowed: false, remaining: 0, resetAt };
    }

    // 添加当前请求
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await redis.expire(key, windowSec);

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt: now + windowSec * 1000,
    };
  } catch (err) {
    console.error('[Redis] checkRateLimit error:', err);
    // 速率限制服务故障时：放行（降级策略）
    return { allowed: true, remaining: 0, resetAt: Date.now() + 60000 };
  }
}

// ── 4. 通用工具 ───────────────────────────────────────────────────────────────

/**
 * 带缓存的 AI 调用包装器
 *
 * @example
 * const summary = await withSemanticCache(
 *   'summary',
 *   articleContent,
 *   () => callOpenAI(articleContent),
 *   3600
 * );
 */
export async function withSemanticCache<T>(
  namespace: string,
  input: string,
  fetchFn: () => Promise<T>,
  ttl = SEMANTIC_CACHE_TTL
): Promise<{ result: T; fromCache: boolean }> {
  // 1. 尝试从缓存读取
  const cached = await getSemanticCache(namespace, input);
  if (cached !== null) {
    try {
      return { result: JSON.parse(cached) as T, fromCache: true };
    } catch {
      // JSON 解析失败，忽略缓存
    }
  }

  // 2. 调用真实 AI 服务
  const result = await fetchFn();

  // 3. 写入缓存（异步，不阻塞响应）
  setSemanticCache(namespace, input, JSON.stringify(result), ttl).catch(() => {});

  return { result, fromCache: false };
}
