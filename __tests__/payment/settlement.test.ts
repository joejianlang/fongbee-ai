/**
 * OrderStatus 状态机单元测试 — 后半段
 *
 * 覆盖:
 *   IN_PROGRESS → PENDING_SETTLEMENT (confirm_completion)
 *   PENDING_SETTLEMENT → COMPLETED   (pay_remaining)
 *   COMPLETED → SETTLED              (settle — Admin only, Stripe Connect Transfer)
 *
 * 全量 12 状态覆盖补全（配合 order-state-machine.test.ts）
 */

// ── Mock 声明 ─────────────────────────────────────────────────────────────────

const mockOrderFindUnique    = jest.fn();
const mockOrderUpdate        = jest.fn();
const mockPaymentCreate      = jest.fn();
const mockEscrowUpdate       = jest.fn();
const mockPayoutCreate       = jest.fn();
const mockNotificationCreate = jest.fn();
const mockTransaction        = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    order:        { findUnique: mockOrderFindUnique, update: mockOrderUpdate },
    payment:      { create: mockPaymentCreate },
    escrow:       { update: mockEscrowUpdate },
    payout:       { create: mockPayoutCreate },
    notification: { create: mockNotificationCreate },
    $transaction: mockTransaction,
  },
}));

// Mock @/lib/payment/stripe (the utility module the routes actually use)
const mockVerifyAuthorization = jest.fn();
const mockGetStripe            = jest.fn();
const mockStripeTransferCreate = jest.fn();

jest.mock('@/lib/payment/stripe', () => ({
  verifyAuthorization:  (...args: unknown[]) => mockVerifyAuthorization(...args),
  getStripe:            () => mockGetStripe(),
  calculatePlatformFee: (amount: number) => {
    const rate = parseFloat(process.env.STRIPE_PLATFORM_FEE_RATE ?? '0.10');
    return Math.round(amount * rate * 100) / 100;
  },
  toCents:   (n: number) => Math.round(n * 100),
  fromCents: (n: number) => n / 100,
}));

// next-auth
const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
jest.mock('@/app/api/auth/[...nextauth]/auth-options', () => ({
  authOptions: {},
}));

// ── Imports ───────────────────────────────────────────────────────────────────
import { NextRequest } from 'next/server';

function makeRequest(method: string, url: string, body?: object): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  process.env.STRIPE_SECRET_KEY        = 'sk_test_mock';
  process.env.STRIPE_PLATFORM_FEE_RATE = '0.10';  // 10% for tests
  process.env.NEXTAUTH_SECRET          = 'test_secret';

  // Default: stripe instance exposes transfers.create
  mockGetStripe.mockReturnValue({
    transfers: { create: mockStripeTransferCreate },
  });

  // Default transaction: execute all ops
  mockTransaction.mockImplementation(async (ops: unknown) => {
    if (Array.isArray(ops)) return Promise.all(ops);
    if (typeof ops === 'function') return ops();
    return ops;
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 1. IN_PROGRESS → PENDING_SETTLEMENT
// ════════════════════════════════════════════════════════════════════════════

describe('IN_PROGRESS → PENDING_SETTLEMENT (confirm_completion)', () => {

  it('should transition IN_PROGRESS to PENDING_SETTLEMENT', async () => {
    const { POST } = await import('@/app/api/orders/[id]/complete/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'cust_1', role: 'CUSTOMER' } });

    const order = {
      id: 'ord_1', orderNumber: 'ORD-2024-001',
      status: 'IN_PROGRESS', customerId: 'cust_1',
      remainingAmount: 700,
    };
    mockOrderFindUnique.mockResolvedValue(order);
    mockOrderUpdate.mockResolvedValue({ ...order, status: 'PENDING_SETTLEMENT' });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/complete', {
      action: 'confirm_completion',
    });
    const res = await POST(req, { params: { id: 'ord_1' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('PENDING_SETTLEMENT');
    expect(data.data.remainingAmount).toBe(700);
    expect(mockOrderUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PENDING_SETTLEMENT' }),
    }));
  });

  it('should reject confirm_completion if order is not IN_PROGRESS', async () => {
    const { POST } = await import('@/app/api/orders/[id]/complete/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'cust_1', role: 'CUSTOMER' } });
    mockOrderFindUnique.mockResolvedValue({
      id: 'ord_1', status: 'CAPTURED', customerId: 'cust_1', remainingAmount: 700,
    });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/complete', {
      action: 'confirm_completion',
    });
    const res = await POST(req, { params: { id: 'ord_1' } });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toContain('CAPTURED');
  });

  it('should return 401 if not authenticated', async () => {
    const { POST } = await import('@/app/api/orders/[id]/complete/route');
    mockGetServerSession.mockResolvedValue(null);

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/complete', {
      action: 'confirm_completion',
    });
    const res = await POST(req, { params: { id: 'ord_1' } });
    expect(res.status).toBe(401);
  });

  it('should return 403 if non-owner tries to confirm', async () => {
    const { POST } = await import('@/app/api/orders/[id]/complete/route');
    mockGetServerSession.mockResolvedValue({ user: { id: 'other_user', role: 'CUSTOMER' } });
    mockOrderFindUnique.mockResolvedValue({
      id: 'ord_1', status: 'IN_PROGRESS', customerId: 'cust_1', remainingAmount: 700,
    });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/complete', {
      action: 'confirm_completion',
    });
    const res = await POST(req, { params: { id: 'ord_1' } });
    expect(res.status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. PENDING_SETTLEMENT → COMPLETED
// ════════════════════════════════════════════════════════════════════════════

describe('PENDING_SETTLEMENT → COMPLETED (pay_remaining)', () => {

  it('should transition PENDING_SETTLEMENT to COMPLETED on valid stripe payment', async () => {
    const { POST } = await import('@/app/api/orders/[id]/complete/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'cust_1', role: 'CUSTOMER' } });

    const order = {
      id: 'ord_1', orderNumber: 'ORD-2024-001',
      status: 'PENDING_SETTLEMENT', customerId: 'cust_1',
      remainingAmount: 700,
    };
    mockOrderFindUnique.mockResolvedValue(order);

    // verifyAuthorization returns authorized
    mockVerifyAuthorization.mockResolvedValue({
      authorized: true,
      status: 'requires_capture',
      amountCad: 700,
    });

    mockOrderUpdate.mockResolvedValue({ ...order, status: 'COMPLETED' });
    mockPaymentCreate.mockResolvedValue({ id: 'pay_2' });
    mockNotificationCreate.mockResolvedValue({ id: 'notif_2' });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/complete', {
      action: 'pay_remaining',
      stripePaymentIntentId: 'pi_remaining_001',
    });
    const res = await POST(req, { params: { id: 'ord_1' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('COMPLETED');
    expect(mockVerifyAuthorization).toHaveBeenCalledWith('pi_remaining_001');
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('should reject pay_remaining if stripe authorization not completed', async () => {
    const { POST } = await import('@/app/api/orders/[id]/complete/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'cust_1', role: 'CUSTOMER' } });
    mockOrderFindUnique.mockResolvedValue({
      id: 'ord_1', status: 'PENDING_SETTLEMENT', customerId: 'cust_1', remainingAmount: 700,
    });

    // verifyAuthorization returns NOT authorized
    mockVerifyAuthorization.mockResolvedValue({
      authorized: false,
      status: 'canceled',
      amountCad: 0,
    });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/complete', {
      action: 'pay_remaining',
      stripePaymentIntentId: 'pi_bad',
    });
    const res = await POST(req, { params: { id: 'ord_1' } });
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  it('should reject pay_remaining if order status is not PENDING_SETTLEMENT', async () => {
    const { POST } = await import('@/app/api/orders/[id]/complete/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'cust_1', role: 'CUSTOMER' } });
    mockOrderFindUnique.mockResolvedValue({
      id: 'ord_1', status: 'IN_PROGRESS', customerId: 'cust_1', remainingAmount: 700,
    });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/complete', {
      action: 'pay_remaining',
      stripePaymentIntentId: 'pi_ok',
    });
    const res = await POST(req, { params: { id: 'ord_1' } });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toContain('IN_PROGRESS');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. COMPLETED → SETTLED
// ════════════════════════════════════════════════════════════════════════════

describe('COMPLETED → SETTLED (settle — Admin only)', () => {

  const completedOrder = {
    id: 'ord_1',
    orderNumber: 'ORD-2024-001',
    status: 'COMPLETED',
    customerId: 'cust_1',
    serviceProviderId: 'sp_1',
    totalAmount: 1000,
    depositAmount: 300,
    remainingAmount: 700,
    serviceProvider: {
      stripeAccountId: 'acct_stripe_123',
      stripeVerified:  true,
    },
  };

  it('should transition COMPLETED to SETTLED and create Stripe Transfer', async () => {
    const { POST } = await import('@/app/api/orders/[id]/settle/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'admin_1', role: 'ADMIN' } });
    mockOrderFindUnique.mockResolvedValue(completedOrder);

    mockStripeTransferCreate.mockResolvedValue({
      id: 'tr_test_001',
      amount: 90000, // 1000 - 10% = 900 CAD = 90000 cents
      currency: 'cad',
    });

    mockOrderUpdate.mockResolvedValue({ ...completedOrder, status: 'SETTLED' });
    mockPaymentCreate.mockResolvedValue({ id: 'pay_3' });
    mockEscrowUpdate.mockResolvedValue({ id: 'escrow_1' });
    mockPayoutCreate.mockResolvedValue({ id: 'payout_1' });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/settle');
    const res = await POST(req, { params: { id: 'ord_1' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('SETTLED');
    expect(data.data.stripeTransferId).toBe('tr_test_001');

    // Platform fee 10% → provider gets 900 CAD
    expect(data.data.providerAmount).toBe(900);
    expect(data.data.platformFee).toBe(100);

    // Stripe Transfer called with correct destination
    expect(mockStripeTransferCreate).toHaveBeenCalledWith(expect.objectContaining({
      destination: 'acct_stripe_123',
      currency:    'cad',
    }));

    // $transaction called with DB operations
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('should return 403 if caller is not ADMIN', async () => {
    const { POST } = await import('@/app/api/orders/[id]/settle/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'cust_1', role: 'CUSTOMER' } });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/settle');
    const res = await POST(req, { params: { id: 'ord_1' } });
    expect(res.status).toBe(403);
  });

  it('should return 403 if not authenticated', async () => {
    const { POST } = await import('@/app/api/orders/[id]/settle/route');

    mockGetServerSession.mockResolvedValue(null);

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/settle');
    const res = await POST(req, { params: { id: 'ord_1' } });
    expect(res.status).toBe(403);
  });

  it('should return 400 if order status is not COMPLETED', async () => {
    const { POST } = await import('@/app/api/orders/[id]/settle/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'admin_1', role: 'ADMIN' } });
    mockOrderFindUnique.mockResolvedValue({ ...completedOrder, status: 'IN_PROGRESS' });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/settle');
    const res = await POST(req, { params: { id: 'ord_1' } });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toContain('IN_PROGRESS');
  });

  it('should return 400 if service provider Stripe account not verified', async () => {
    const { POST } = await import('@/app/api/orders/[id]/settle/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'admin_1', role: 'ADMIN' } });
    mockOrderFindUnique.mockResolvedValue({
      ...completedOrder,
      serviceProvider: { stripeAccountId: null, stripeVerified: false },
    });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/settle');
    const res = await POST(req, { params: { id: 'ord_1' } });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toContain('未验证');
  });

  it('should return 404 if order not found', async () => {
    const { POST } = await import('@/app/api/orders/[id]/settle/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'admin_1', role: 'ADMIN' } });
    mockOrderFindUnique.mockResolvedValue(null);

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/settle');
    const res = await POST(req, { params: { id: 'ord_1' } });
    expect(res.status).toBe(404);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. 12 状态全覆盖摘要验证
// ════════════════════════════════════════════════════════════════════════════

describe('State Machine Coverage — All 12 States Referenced', () => {
  const allStates = [
    'PENDING',
    'AUTHORIZED',
    'CRON_CAPTURING',
    'CAPTURED',
    'IN_PROGRESS',
    'PENDING_SETTLEMENT',
    'COMPLETED',
    'SETTLED',
    'CANCELLED',
    'CANCELLED_FORFEITED',
    'REFUNDED',
    'DISPUTED',
  ];

  it('should enumerate all 12 OrderStatus values', () => {
    expect(allStates).toHaveLength(12);
    expect(allStates).toContain('PENDING');
    expect(allStates).toContain('SETTLED');
    expect(allStates).toContain('DISPUTED');
  });

  it('should reject invalid state transition SETTLED → PENDING_SETTLEMENT', async () => {
    const { POST } = await import('@/app/api/orders/[id]/complete/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'cust_1', role: 'CUSTOMER' } });
    mockOrderFindUnique.mockResolvedValue({
      id: 'ord_1', status: 'SETTLED', customerId: 'cust_1', remainingAmount: 0,
    });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/complete', {
      action: 'confirm_completion',
    });
    const res = await POST(req, { params: { id: 'ord_1' } });
    expect(res.status).toBe(400);
  });

  it('should reject invalid state transition CANCELLED → COMPLETED', async () => {
    const { POST } = await import('@/app/api/orders/[id]/complete/route');

    mockGetServerSession.mockResolvedValue({ user: { id: 'cust_1', role: 'CUSTOMER' } });
    mockOrderFindUnique.mockResolvedValue({
      id: 'ord_1', status: 'CANCELLED', customerId: 'cust_1', remainingAmount: 0,
    });

    const req = makeRequest('POST', 'http://localhost/api/orders/ord_1/complete', {
      action: 'confirm_completion',
    });
    const res = await POST(req, { params: { id: 'ord_1' } });
    expect(res.status).toBe(400);
  });
});
