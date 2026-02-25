// Cron Job 划扣逻辑单元测试
//
// 测试覆盖:
// 1. 认证检查（x-cron-key header）
// 2. 正常划扣 AUTHORIZED -> CAPTURED
// 3. Redis 锁已被持有时跳过（防多实例并发）
// 4. DB 乐观锁: updateMany 返回 count=0 时跳过
// 5. Stripe 划扣失败时回滚到 AUTHORIZED
// 6. 达到最大重试次数（3次）后转为 DISPUTED
// 7. isAutoCaptureEnabled=false 时跳过
// 8. 批量处理多个订单

// ── jest.mock 必须在顶层，不能引用外部变量（hoisting 规则）──────────────────

jest.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    payment: { create: jest.fn() },
    escrow: { upsert: jest.fn(), update: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn(async (ops: unknown) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      return ops;
    }),
  },
}));

// Mock the stripe utility module directly (不 mock Stripe SDK 本身)
jest.mock('@/lib/payment/stripe', () => ({
  capturePayment: jest.fn(),
  createManualCaptureIntent: jest.fn(),
  verifyAuthorization: jest.fn(),
  cancelAuthorization: jest.fn(),
  refundPayment: jest.fn(),
  calculatePlatformFee: jest.fn(),
  toCents: jest.fn((n: number) => Math.round(n * 100)),
  fromCents: jest.fn((n: number) => n / 100),
  getStripe: jest.fn(),
}));

jest.mock('@/lib/cache/redis', () => ({
  acquireCronLock: jest.fn(),
  releaseCronLock: jest.fn(),
}));

// ── Imports ──────────────────────────────────────────────────────────────────
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { acquireCronLock, releaseCronLock } from '@/lib/cache/redis';
import { capturePayment } from '@/lib/payment/stripe';
import type { CaptureResult } from '@/lib/payment/stripe';

// ── 类型化 mock 引用 ──────────────────────────────────────────────────────────
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockAcquireLock = acquireCronLock as jest.MockedFunction<typeof acquireCronLock>;
const mockReleaseLock = releaseCronLock as jest.MockedFunction<typeof releaseCronLock>;
const mockCapturePayment = capturePayment as jest.MockedFunction<typeof capturePayment>;

// ── Route module ──────────────────────────────────────────────────────────────
let POST: (req: NextRequest) => Promise<Response>;

// ── Helper ───────────────────────────────────────────────────────────────────
function makeCronRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/cron/capture-deposits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function makeAuthorizedOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order_001',
    orderNumber: 'ORD-2024-001',
    status: 'AUTHORIZED',
    depositAmount: 300,
    customerId: 'customer_001',
    stripeIntentId: 'pi_auto_001',
    captureAttempts: 0,
    scheduledCaptureAt: new Date(Date.now() - 60000),
    customer: { id: 'customer_001', email: 'test@example.com', phone: null },
    paymentPolicy: {
      isAutoCaptureEnabled: true,
      autoCaptureHoursBefore: 48,
    },
    ...overrides,
  };
}

function makeSuccessCapture(overrides: Partial<CaptureResult> = {}): CaptureResult {
  return {
    success: true,
    capturedAmountCad: 300,
    transactionId: 'pi_auto_001',
    ...overrides,
  };
}

function makeFailedCapture(errorMessage = 'Card declined'): CaptureResult {
  return {
    success: false,
    capturedAmountCad: 0,
    transactionId: 'pi_auto_001',
    errorMessage,
  };
}

// ── Setup ────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.CRON_API_KEY = 'test_cron_key_123';

  const mod = await import('@/app/api/cron/capture-deposits/route');
  POST = mod.POST;
});

beforeEach(() => {
  jest.clearAllMocks();

  // Re-configure $transaction after clearAllMocks
  (mockPrisma.$transaction as jest.Mock).mockImplementation(
    async (ops: unknown) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      return ops;
    }
  );
});

// ════════════════════════════════════════════════════════════════════════════
// 1. 认证检查
// ════════════════════════════════════════════════════════════════════════════

describe('Cron Authentication', () => {
  it('should return 401 without x-cron-key header', async () => {
    const req = makeCronRequest({});
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(mockPrisma.order.findMany).not.toHaveBeenCalled();
  });

  it('should return 401 with wrong cron key', async () => {
    const req = makeCronRequest({ 'x-cron-key': 'wrong_key' });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('should accept valid x-cron-key header', async () => {
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([]);
    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    const res = await POST(req);

    expect(res.status).toBe(200);
  });

  it('should accept valid x-api-key as alternative', async () => {
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([]);
    const req = makeCronRequest({ 'x-api-key': 'test_cron_key_123' });
    const res = await POST(req);

    expect(res.status).toBe(200);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. isAutoCaptureEnabled=false 时跳过
// ════════════════════════════════════════════════════════════════════════════

describe('Auto-capture Disabled', () => {
  it('should skip orders when isAutoCaptureEnabled=false', async () => {
    const order = makeAuthorizedOrder({
      paymentPolicy: {
        isAutoCaptureEnabled: false,
        autoCaptureHoursBefore: 48,
      },
    });
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([order]);

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    const res = await POST(req);
    const data = await res.json();

    expect(data.data.skipped).toBe(1);
    expect(data.data.captured).toBe(0);
    expect(mockAcquireLock).not.toHaveBeenCalled();
    expect(mockCapturePayment).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Redis 锁已持有时跳过
// ════════════════════════════════════════════════════════════════════════════

describe('Redis Idempotency Lock', () => {
  it('should skip order when Redis lock is already held by another instance', async () => {
    const order = makeAuthorizedOrder();
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([order]);
    mockAcquireLock.mockResolvedValue(false); // 锁被另一实例持有

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    const res = await POST(req);
    const data = await res.json();

    expect(data.data.skipped).toBe(1);
    expect(data.data.captured).toBe(0);
    expect(mockPrisma.order.updateMany).not.toHaveBeenCalled();
    expect(mockCapturePayment).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. DB 乐观锁 — updateMany 返回 count=0
// ════════════════════════════════════════════════════════════════════════════

describe('DB Optimistic Lock (CRON_CAPTURING)', () => {
  it('should skip when updateMany returns count=0 (concurrent process won the race)', async () => {
    const order = makeAuthorizedOrder();
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([order]);
    mockAcquireLock.mockResolvedValue(true);
    (mockPrisma.order.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    const res = await POST(req);
    const data = await res.json();

    expect(data.data.skipped).toBe(1);
    expect(mockCapturePayment).not.toHaveBeenCalled();
    // Redis lock should be released even when skipping
    expect(mockReleaseLock).toHaveBeenCalledWith('order_001');
  });

  it('should use updateMany with WHERE status=AUTHORIZED (optimistic lock condition)', async () => {
    const order = makeAuthorizedOrder();
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([order]);
    mockAcquireLock.mockResolvedValue(true);
    (mockPrisma.order.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    // Stripe succeeds
    mockCapturePayment.mockResolvedValue(makeSuccessCapture());
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.payment.create as jest.Mock).mockResolvedValue({});
    (mockPrisma.escrow.upsert as jest.Mock).mockResolvedValue({});
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    await POST(req);

    // Key assertion: only transition AUTHORIZED -> CRON_CAPTURING
    expect(mockPrisma.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'order_001',
        status: 'AUTHORIZED',
      },
      data: expect.objectContaining({
        status: 'CRON_CAPTURING',
        captureAttempts: { increment: 1 },
      }),
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. 正常划扣 AUTHORIZED -> CAPTURED
// ════════════════════════════════════════════════════════════════════════════

describe('Normal Capture Flow: AUTHORIZED -> CAPTURED', () => {
  it('should capture order successfully and update to CAPTURED', async () => {
    const order = makeAuthorizedOrder();
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([order]);
    mockAcquireLock.mockResolvedValue(true);
    (mockPrisma.order.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    mockCapturePayment.mockResolvedValue(makeSuccessCapture({
      capturedAmountCad: 300,
      transactionId: 'pi_auto_001',
    }));

    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.payment.create as jest.Mock).mockResolvedValue({});
    (mockPrisma.escrow.upsert as jest.Mock).mockResolvedValue({});
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.captured).toBe(1);
    expect(data.data.failed).toBe(0);

    // capturePayment called with stripe intent ID
    expect(mockCapturePayment).toHaveBeenCalledWith('pi_auto_001');

    // Order updated to CAPTURED
    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CAPTURED' }),
      })
    );

    // Redis lock released
    expect(mockReleaseLock).toHaveBeenCalledWith('order_001');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Stripe 划扣失败 -> 回滚到 AUTHORIZED
// ════════════════════════════════════════════════════════════════════════════

describe('Capture Failure — Rollback to AUTHORIZED', () => {
  it('should rollback to AUTHORIZED on capture failure (1st of 3 attempts)', async () => {
    const order = makeAuthorizedOrder({ captureAttempts: 0 });
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([order]);
    mockAcquireLock.mockResolvedValue(true);
    (mockPrisma.order.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    mockCapturePayment.mockResolvedValue(makeFailedCapture('Card expired'));

    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.payment.create as jest.Mock).mockResolvedValue({});
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    const res = await POST(req);
    const data = await res.json();

    expect(data.data.failed).toBe(1);
    expect(data.data.captured).toBe(0);
    expect(data.data.errors).toHaveLength(1);

    // 1st failure (attempt 0+1=1 < MAX 3) -> rollback to AUTHORIZED
    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order_001' },
        data: expect.objectContaining({ status: 'AUTHORIZED' }),
      })
    );

    // Redis lock always released
    expect(mockReleaseLock).toHaveBeenCalledWith('order_001');
  });

  it('should transition to DISPUTED after 3rd failed attempt (captureAttempts was 2)', async () => {
    // captureAttempts=2 means this is the 3rd attempt (updateMany increments -> 3)
    const order = makeAuthorizedOrder({ captureAttempts: 2 });
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([order]);
    mockAcquireLock.mockResolvedValue(true);
    (mockPrisma.order.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    mockCapturePayment.mockResolvedValue(makeFailedCapture('Authorization expired'));

    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.payment.create as jest.Mock).mockResolvedValue({});
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    await POST(req);

    // 3rd attempt -> DISPUTED
    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DISPUTED' }),
      })
    );
  });

  it('should always release Redis lock even when an exception is thrown', async () => {
    const order = makeAuthorizedOrder();
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([order]);
    mockAcquireLock.mockResolvedValue(true);
    // First call: optimistic lock succeeds; second call: rollback
    (mockPrisma.order.updateMany as jest.Mock)
      .mockResolvedValueOnce({ count: 1 })  // AUTHORIZED -> CRON_CAPTURING
      .mockResolvedValueOnce({ count: 1 }); // rollback CRON_CAPTURING -> AUTHORIZED

    // capturePayment throws (network error etc)
    mockCapturePayment.mockRejectedValue(new Error('Network timeout'));
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    await POST(req);

    // The finally block MUST release the lock
    expect(mockReleaseLock).toHaveBeenCalledWith('order_001');
    expect(mockReleaseLock).toHaveBeenCalledTimes(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. 批量处理 + 空队列
// ════════════════════════════════════════════════════════════════════════════

describe('Batch Processing', () => {
  it('should return empty results when no orders to capture', async () => {
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([]);

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.processed).toBe(0);
    expect(data.data.captured).toBe(0);
    expect(data.data.failed).toBe(0);
    expect(data.data.skipped).toBe(0);
  });

  it('should process multiple orders with mixed results (captured + skipped)', async () => {
    const orders = [
      // A: success
      makeAuthorizedOrder({ id: 'order_A', orderNumber: 'ORD-A', stripeIntentId: 'pi_A' }),
      // B: Redis lock held -> skip
      makeAuthorizedOrder({ id: 'order_B', orderNumber: 'ORD-B', stripeIntentId: 'pi_B' }),
      // C: auto-capture disabled -> skip
      makeAuthorizedOrder({
        id: 'order_C', orderNumber: 'ORD-C', stripeIntentId: 'pi_C',
        paymentPolicy: { isAutoCaptureEnabled: false, autoCaptureHoursBefore: 48 },
      }),
    ];
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue(orders);

    // A: lock acquired; B: lock not acquired (held by other); C: skipped before lock
    mockAcquireLock
      .mockResolvedValueOnce(true)   // A
      .mockResolvedValueOnce(false); // B

    (mockPrisma.order.updateMany as jest.Mock).mockResolvedValueOnce({ count: 1 }); // A

    // A: capture succeeds
    mockCapturePayment.mockResolvedValueOnce(makeSuccessCapture({
      capturedAmountCad: 300,
      transactionId: 'pi_A',
    }));
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.payment.create as jest.Mock).mockResolvedValue({});
    (mockPrisma.escrow.upsert as jest.Mock).mockResolvedValue({});
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    const res = await POST(req);
    const data = await res.json();

    expect(data.data.processed).toBe(3);  // all 3 processed
    expect(data.data.captured).toBe(1);   // A succeeded
    expect(data.data.skipped).toBe(2);    // B (Redis) + C (policy)
    expect(data.data.failed).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. 查询条件验证
// ════════════════════════════════════════════════════════════════════════════

describe('Query Conditions', () => {
  it('should query only AUTHORIZED orders with captureAttempts < 3', async () => {
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([]);

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    await POST(req);

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'AUTHORIZED',
          captureAttempts: { lt: 3 },
          stripeIntentId: { not: null },
        }),
      })
    );
  });

  it('should order results by scheduledCaptureAt asc (process oldest first)', async () => {
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([]);

    const req = makeCronRequest({ 'x-cron-key': 'test_cron_key_123' });
    await POST(req);

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { scheduledCaptureAt: 'asc' },
      })
    );
  });
});
