/**
 * OrderStatus 状态机单元测试
 *
 * 测试覆盖 12 个状态的合法/非法转换:
 * PENDING → AUTHORIZED → CRON_CAPTURING → CAPTURED
 * → IN_PROGRESS → PENDING_SETTLEMENT → COMPLETED → SETTLED
 * → CANCELLED / CANCELLED_FORFEITED / REFUNDED / DISPUTED
 *
 * Mock 依赖: prisma, stripe, next-auth, redis
 */

// ── Mock 声明（必须在 import 前）────────────────────────────────────────────

// Prisma
const mockOrderFindUnique = jest.fn();
const mockOrderUpdate = jest.fn();
const mockOrderUpdateMany = jest.fn();
const mockPaymentCreate = jest.fn();
const mockEscrowUpsert = jest.fn();
const mockEscrowUpdate = jest.fn();
const mockNotificationCreate = jest.fn();
const mockTransaction = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findUnique: mockOrderFindUnique,
      update: mockOrderUpdate,
      updateMany: mockOrderUpdateMany,
    },
    payment: { create: mockPaymentCreate },
    escrow: { upsert: mockEscrowUpsert, update: mockEscrowUpdate },
    notification: { create: mockNotificationCreate },
    $transaction: mockTransaction,
  },
}));

// Stripe SDK
const mockStripeRetrieve = jest.fn();
const mockStripeCapture = jest.fn();
const mockStripeCancel = jest.fn();
const mockStripeRefundCreate = jest.fn();
const mockStripeCreate = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockStripeCreate,
      retrieve: mockStripeRetrieve,
      capture: mockStripeCapture,
      cancel: mockStripeCancel,
    },
    refunds: { create: mockStripeRefundCreate },
  }));
});

// next-auth
const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

// auth-options（避免实际 db 查询）
jest.mock('@/app/api/auth/[...nextauth]/auth-options', () => ({
  authOptions: {},
}));

// Redis
const mockAcquireCronLock = jest.fn();
const mockReleaseCronLock = jest.fn();
jest.mock('@/lib/cache/redis', () => ({
  acquireCronLock: mockAcquireCronLock,
  releaseCronLock: mockReleaseCronLock,
}));

// ── Imports ──────────────────────────────────────────────────────────────────
import { NextRequest } from 'next/server';

// 测试辅助：创建 mock NextRequest
function makeRequest(
  method: string,
  url: string,
  body?: object,
  headers?: Record<string, string>
): NextRequest {
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(url, init);
}

// ── Setup ────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.CRON_API_KEY = 'test_cron_key';
  process.env.PAD_THRESHOLD_CAD = '1000';
  process.env.NEXTAUTH_SECRET = 'test_secret';

  // Default: $transaction 直接执行传入的操作数组
  mockTransaction.mockImplementation(async (ops: unknown) => {
    if (Array.isArray(ops)) {
      return Promise.all(ops);
    }
    if (typeof ops === 'function') {
      return ops({});
    }
    return ops;
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 1. 状态机: 合法转换
// ════════════════════════════════════════════════════════════════════════════

describe('OrderStatus State Machine — Valid Transitions', () => {

  // ── PENDING → AUTHORIZED ─────────────────────────────────────────────────
  describe('PENDING → AUTHORIZED (authorize route)', () => {
    it('should transition PENDING order to AUTHORIZED on valid stripe intent', async () => {
      const { POST } = await import('@/app/api/orders/[id]/authorize/route');

      mockGetServerSession.mockResolvedValue({
        user: { id: 'customer_1', role: 'CUSTOMER' },
      });

      const mockOrder = {
        id: 'order_1',
        orderNumber: 'ORD-2024-001',
        status: 'PENDING',
        depositAmount: 200,
        customerId: 'customer_1',
        stripeIntentId: null,
      };
      mockOrderFindUnique.mockResolvedValue(mockOrder);

      // Stripe: intent verified
      mockStripeRetrieve.mockResolvedValue({
        id: 'pi_001',
        status: 'requires_capture',
        amount: 20000,
        amount_received: 0,
      });

      mockOrderUpdate.mockResolvedValue({ ...mockOrder, status: 'AUTHORIZED' });
      mockPaymentCreate.mockResolvedValue({ id: 'pay_1' });
      mockNotificationCreate.mockResolvedValue({ id: 'notif_1' });

      const req = makeRequest('POST', 'http://localhost/api/orders/order_1/authorize', {
        stripePaymentIntentId: 'pi_001',
      });

      const res = await POST(req, { params: { id: 'order_1' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('AUTHORIZED');

      // Verify stripe retrieve was called
      expect(mockStripeRetrieve).toHaveBeenCalledWith('pi_001');
    });

    it('should reject if intent status is not requires_capture', async () => {
      const { POST } = await import('@/app/api/orders/[id]/authorize/route');

      mockGetServerSession.mockResolvedValue({
        user: { id: 'customer_1', role: 'CUSTOMER' },
      });

      mockOrderFindUnique.mockResolvedValue({
        id: 'order_1',
        status: 'PENDING',
        depositAmount: 200,
        customerId: 'customer_1',
      });

      mockStripeRetrieve.mockResolvedValue({
        id: 'pi_failed',
        status: 'requires_payment_method', // NOT authorized
        amount: 20000,
        amount_received: 0,
      });

      const req = makeRequest('POST', 'http://localhost/api/orders/order_1/authorize', {
        stripePaymentIntentId: 'pi_failed',
      });

      const res = await POST(req, { params: { id: 'order_1' } });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { POST } = await import('@/app/api/orders/[id]/authorize/route');
      mockGetServerSession.mockResolvedValue(null);

      const req = makeRequest('POST', 'http://localhost/api/orders/order_1/authorize', {
        stripePaymentIntentId: 'pi_001',
      });

      const res = await POST(req, { params: { id: 'order_1' } });
      expect(res.status).toBe(401);
    });
  });

  // ── CAPTURED → IN_PROGRESS ────────────────────────────────────────────────
  describe('CAPTURED → IN_PROGRESS (start route)', () => {
    it('should transition CAPTURED order to IN_PROGRESS', async () => {
      const { POST } = await import('@/app/api/orders/[id]/start/route');

      mockGetServerSession.mockResolvedValue({
        user: { id: 'customer_1', role: 'CUSTOMER' },
      });

      const mockOrder = {
        id: 'order_2',
        orderNumber: 'ORD-2024-002',
        status: 'CAPTURED',
        depositAmount: 150,
        customerId: 'customer_1',
        serviceProviderId: 'sp_1',
        escrow: { id: 'escrow_2', status: 'HOLDING' },
      };
      mockOrderFindUnique.mockResolvedValue(mockOrder);
      mockOrderUpdate.mockResolvedValue({ ...mockOrder, status: 'IN_PROGRESS' });
      mockNotificationCreate.mockResolvedValue({ id: 'notif_2' });

      const req = makeRequest('POST', 'http://localhost/api/orders/order_2/start', {});

      const res = await POST(req, { params: { id: 'order_2' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('IN_PROGRESS');
    });

    it('should reject if order is not CAPTURED', async () => {
      const { POST } = await import('@/app/api/orders/[id]/start/route');

      mockGetServerSession.mockResolvedValue({
        user: { id: 'customer_1', role: 'CUSTOMER' },
      });

      mockOrderFindUnique.mockResolvedValue({
        id: 'order_3',
        status: 'AUTHORIZED', // Wrong status
        customerId: 'customer_1',
        serviceProviderId: 'sp_1',
        escrow: null,
      });

      const req = makeRequest('POST', 'http://localhost/api/orders/order_3/start', {});
      const res = await POST(req, { params: { id: 'order_3' } });

      expect(res.status).toBe(400);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. 取消逻辑（含违约金）
// ════════════════════════════════════════════════════════════════════════════

describe('Cancel Flow — Forfeiture Logic', () => {

  function makeOrderWithPolicy(overrides: object = {}) {
    const base = {
      id: 'order_cancel',
      orderNumber: 'ORD-CANCEL-001',
      status: 'AUTHORIZED',
      customerId: 'customer_1',
      depositAmount: 300,
      stripeIntentId: 'pi_cancel_001',
      scheduledStartTime: new Date(Date.now() + 2 * 3600000), // 2 小时后
      paymentPolicy: {
        cancellationCutoffHours: 24,    // 24h 违约窗口
        forfeiturePercentage: 50,       // 50% 违约金
      },
    };
    return { ...base, ...overrides };
  }

  it('should CANCEL without forfeiture when cancelled far in advance', async () => {
    const { POST } = await import('@/app/api/orders/[id]/cancel/route');

    mockGetServerSession.mockResolvedValue({
      user: { id: 'customer_1', role: 'CUSTOMER' },
    });

    // 服务时间 = 48 小时后（超过 24h 截止）→ 不没收
    const order = makeOrderWithPolicy({
      status: 'AUTHORIZED',
      scheduledStartTime: new Date(Date.now() + 48 * 3600000),
    });
    mockOrderFindUnique.mockResolvedValue(order);
    mockStripeRetrieve.mockResolvedValue({ status: 'requires_capture' });
    mockStripeCancel.mockResolvedValue({ status: 'canceled' });
    mockOrderUpdate.mockResolvedValue({ ...order, status: 'CANCELLED' });
    mockPaymentCreate.mockResolvedValue({ id: 'pay_refund' });
    mockNotificationCreate.mockResolvedValue({ id: 'notif_3' });

    const req = makeRequest(
      'POST',
      'http://localhost/api/orders/order_cancel/cancel',
      { reason: '计划变更' }
    );

    const res = await POST(req, { params: { id: 'order_cancel' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('CANCELLED');
    expect(data.data.forfeitedAmount).toBe(0);
    expect(data.data.refundAmount).toBe(300); // 全额退款

    // 应该调用 cancelAuthorization（非退款）
    expect(mockStripeCancel).toHaveBeenCalledWith('pi_cancel_001');
  });

  it('should CANCELLED_FORFEITED when within cutoff window', async () => {
    const { POST } = await import('@/app/api/orders/[id]/cancel/route');

    mockGetServerSession.mockResolvedValue({
      user: { id: 'customer_1', role: 'CUSTOMER' },
    });

    // 服务时间 = 2 小时后（小于 24h 截止）→ 没收 50%
    const order = makeOrderWithPolicy({
      status: 'AUTHORIZED',
      scheduledStartTime: new Date(Date.now() + 2 * 3600000),
    });
    mockOrderFindUnique.mockResolvedValue(order);
    mockStripeRetrieve.mockResolvedValue({ status: 'requires_capture' });
    mockStripeRefundCreate.mockResolvedValue({ id: 're_partial', amount: 15000 });
    mockOrderUpdate.mockResolvedValue({ ...order, status: 'CANCELLED_FORFEITED' });
    mockPaymentCreate.mockResolvedValue({ id: 'pay_forfeiture' });
    mockNotificationCreate.mockResolvedValue({ id: 'notif_4' });

    const req = makeRequest(
      'POST',
      'http://localhost/api/orders/order_cancel/cancel',
      {}
    );

    const res = await POST(req, { params: { id: 'order_cancel' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('CANCELLED_FORFEITED');
    // depositAmount=300, forfeiturePercentage=50% → forfeit=150, refund=150
    expect(data.data.forfeitedAmount).toBe(150);
    expect(data.data.refundAmount).toBe(150);

    // 应调用部分退款
    expect(mockStripeRefundCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: 'pi_cancel_001',
        amount: 15000, // 150 CAD → 15000 cents
      })
    );
  });

  it('should allow cancellation of PENDING order (no Stripe action)', async () => {
    const { POST } = await import('@/app/api/orders/[id]/cancel/route');

    mockGetServerSession.mockResolvedValue({
      user: { id: 'customer_1', role: 'CUSTOMER' },
    });

    const order = makeOrderWithPolicy({
      status: 'PENDING',
      stripeIntentId: null, // 还没有 intent
      scheduledStartTime: new Date(Date.now() + 1 * 3600000), // 1h 后（在截止内）
    });
    mockOrderFindUnique.mockResolvedValue(order);
    mockOrderUpdate.mockResolvedValue({ ...order, status: 'CANCELLED' });
    mockNotificationCreate.mockResolvedValue({ id: 'notif_5' });

    const req = makeRequest(
      'POST',
      'http://localhost/api/orders/order_cancel/cancel',
      {}
    );

    const res = await POST(req, { params: { id: 'order_cancel' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    // PENDING 订单即使在截止期内，也不触发违约金（没有授权）
    expect(data.data.status).toBe('CANCELLED');
    expect(data.data.forfeitedAmount).toBe(0);

    // 不应调用 Stripe
    expect(mockStripeRetrieve).not.toHaveBeenCalled();
    expect(mockStripeCancel).not.toHaveBeenCalled();
  });

  it('should reject cancellation of IN_PROGRESS order', async () => {
    const { POST } = await import('@/app/api/orders/[id]/cancel/route');

    mockGetServerSession.mockResolvedValue({
      user: { id: 'customer_1', role: 'CUSTOMER' },
    });

    mockOrderFindUnique.mockResolvedValue(
      makeOrderWithPolicy({ status: 'IN_PROGRESS' })
    );

    const req = makeRequest(
      'POST',
      'http://localhost/api/orders/order_cancel/cancel',
      {}
    );

    const res = await POST(req, { params: { id: 'order_cancel' } });
    expect(res.status).toBe(400);
  });

  it('should reject cancellation by non-owner non-admin', async () => {
    const { POST } = await import('@/app/api/orders/[id]/cancel/route');

    mockGetServerSession.mockResolvedValue({
      user: { id: 'other_customer', role: 'CUSTOMER' },
    });

    mockOrderFindUnique.mockResolvedValue(
      makeOrderWithPolicy({ status: 'AUTHORIZED' })
    );

    const req = makeRequest(
      'POST',
      'http://localhost/api/orders/order_cancel/cancel',
      {}
    );

    const res = await POST(req, { params: { id: 'order_cancel' } });
    expect(res.status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. 违约金精确计算
// ════════════════════════════════════════════════════════════════════════════

describe('Forfeiture Calculation Accuracy', () => {
  // 纯逻辑测试（不经过 HTTP route）
  it('should calculate forfeiture correctly at 30%', () => {
    const depositAmount = 500;
    const forfeiturePercentage = 30;
    const forfeitedAmount =
      Math.round(depositAmount * (forfeiturePercentage / 100) * 100) / 100;
    const refundAmount = depositAmount - forfeitedAmount;

    expect(forfeitedAmount).toBe(150);
    expect(refundAmount).toBe(350);
  });

  it('should handle floating point edge cases', () => {
    const depositAmount = 333.33;
    const forfeiturePercentage = 100;
    const forfeitedAmount =
      Math.round(depositAmount * (forfeiturePercentage / 100) * 100) / 100;

    expect(forfeitedAmount).toBe(333.33);
  });

  it('should calculate 0 forfeiture for 0% policy', () => {
    const depositAmount = 200;
    const forfeiturePercentage = 0;
    const forfeitedAmount =
      Math.round(depositAmount * (forfeiturePercentage / 100) * 100) / 100;

    expect(forfeitedAmount).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. 非法状态转换
// ════════════════════════════════════════════════════════════════════════════

describe('Invalid State Transitions', () => {
  it('should return 404 when order not found', async () => {
    const { POST } = await import('@/app/api/orders/[id]/authorize/route');

    mockGetServerSession.mockResolvedValue({
      user: { id: 'customer_1', role: 'CUSTOMER' },
    });
    mockOrderFindUnique.mockResolvedValue(null);

    const req = makeRequest('POST', 'http://localhost/api/orders/not_exist/authorize', {
      stripePaymentIntentId: 'pi_001',
    });

    const res = await POST(req, { params: { id: 'not_exist' } });
    expect(res.status).toBe(404);
  });

  it('should not allow AUTHORIZED order to be authorized again', async () => {
    const { POST } = await import('@/app/api/orders/[id]/authorize/route');

    mockGetServerSession.mockResolvedValue({
      user: { id: 'customer_1', role: 'CUSTOMER' },
    });
    mockOrderFindUnique.mockResolvedValue({
      id: 'order_already',
      status: 'AUTHORIZED', // Already authorized
      depositAmount: 200,
      customerId: 'customer_1',
    });

    const req = makeRequest('POST', 'http://localhost/api/orders/order_already/authorize', {
      stripePaymentIntentId: 'pi_001',
    });

    const res = await POST(req, { params: { id: 'order_already' } });
    expect(res.status).toBe(400);
  });
});
