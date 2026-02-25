/**
 * lib/payment/stripe.ts 单元测试
 *
 * 所有 Stripe SDK 调用均被 mock，测试本地逻辑：
 * - toCents / fromCents 转换
 * - calculatePlatformFee 费率计算
 * - capturePayment 状态分支（已成功/需划扣/错误状态）
 * - verifyAuthorization 授权验证
 * - cancelAuthorization 分支（requires_capture vs succeeded）
 */

// ── Mock Stripe SDK ─────────────────────────────────────────────────────────
const mockCreate = jest.fn();
const mockRetrieve = jest.fn();
const mockCapture = jest.fn();
const mockCancel = jest.fn();
const mockRefundCreate = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockCreate,
      retrieve: mockRetrieve,
      capture: mockCapture,
      cancel: mockCancel,
    },
    refunds: {
      create: mockRefundCreate,
    },
  }));
});

// 在 mock 后再 import
import {
  toCents,
  fromCents,
  calculatePlatformFee,
  createManualCaptureIntent,
  verifyAuthorization,
  capturePayment,
  cancelAuthorization,
  refundPayment,
} from '@/lib/payment/stripe';

// 重置 singleton（每次 import 缓存了 _stripe 实例）
beforeEach(() => {
  jest.resetModules();
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
  process.env.STRIPE_PLATFORM_FEE_RATE = '0.05';
});

// ── 1. 金额转换 ──────────────────────────────────────────────────────────────

describe('toCents / fromCents', () => {
  it('should convert CAD to cents correctly', () => {
    expect(toCents(100)).toBe(10000);
    expect(toCents(1.99)).toBe(199);
    expect(toCents(0.5)).toBe(50);
  });

  it('should handle floating point rounding', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS, toCents should round
    expect(toCents(0.1 + 0.2)).toBe(30);
  });

  it('should convert cents to CAD correctly', () => {
    expect(fromCents(10000)).toBe(100);
    expect(fromCents(199)).toBe(1.99);
    expect(fromCents(50)).toBe(0.5);
  });
});

// ── 2. 平台手续费 ────────────────────────────────────────────────────────────

describe('calculatePlatformFee', () => {
  it('should use STRIPE_PLATFORM_FEE_RATE env variable', () => {
    process.env.STRIPE_PLATFORM_FEE_RATE = '0.05';
    expect(calculatePlatformFee(1000)).toBe(50);
  });

  it('should default to 5% when env not set', () => {
    delete process.env.STRIPE_PLATFORM_FEE_RATE;
    expect(calculatePlatformFee(200)).toBe(10);
  });

  it('should handle custom fee rate', () => {
    process.env.STRIPE_PLATFORM_FEE_RATE = '0.08';
    expect(calculatePlatformFee(500)).toBe(40);
  });

  it('should round to 2 decimal places', () => {
    process.env.STRIPE_PLATFORM_FEE_RATE = '0.05';
    expect(calculatePlatformFee(99.99)).toBe(5); // 99.99 * 0.05 = 4.9995 → 5.00
  });
});

// ── 3. createManualCaptureIntent ─────────────────────────────────────────────

describe('createManualCaptureIntent', () => {
  it('should create PaymentIntent with capture_method=manual', async () => {
    mockCreate.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret_abc',
      status: 'requires_payment_method',
    });

    const result = await createManualCaptureIntent({
      amountCad: 150,
      orderId: 'order_001',
      customerId: 'customer_001',
      serviceProviderId: 'sp_001',
    });

    expect(result.intentId).toBe('pi_test_123');
    expect(result.clientSecret).toBe('pi_test_123_secret_abc');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 15000, // 150 CAD → 15000 cents
        currency: 'cad',
        capture_method: 'manual',
        confirm: false,
        metadata: expect.objectContaining({
          orderId: 'order_001',
          platform: 'youfujia',
        }),
      })
    );
  });

  it('should throw if Stripe returns no client_secret', async () => {
    mockCreate.mockResolvedValue({
      id: 'pi_test_456',
      client_secret: null,
    });

    await expect(
      createManualCaptureIntent({
        amountCad: 100,
        orderId: 'order_002',
        customerId: 'customer_002',
        serviceProviderId: 'sp_002',
      })
    ).rejects.toThrow('Stripe 未返回 client_secret');
  });
});

// ── 4. verifyAuthorization ───────────────────────────────────────────────────

describe('verifyAuthorization', () => {
  it('should return authorized=true when status=requires_capture', async () => {
    mockRetrieve.mockResolvedValue({
      id: 'pi_test_789',
      status: 'requires_capture',
      amount: 20000,
      amount_received: 0,
    });

    const result = await verifyAuthorization('pi_test_789');

    expect(result.authorized).toBe(true);
    expect(result.status).toBe('requires_capture');
    expect(result.amountCad).toBe(200); // 20000 cents → 200 CAD
  });

  it('should return authorized=false for other statuses', async () => {
    mockRetrieve.mockResolvedValue({
      id: 'pi_test_000',
      status: 'requires_payment_method',
      amount: 10000,
      amount_received: 0,
    });

    const result = await verifyAuthorization('pi_test_000');
    expect(result.authorized).toBe(false);
  });
});

// ── 5. capturePayment ────────────────────────────────────────────────────────

describe('capturePayment', () => {
  it('should capture when status=requires_capture', async () => {
    // retrieve 返回 requires_capture
    mockRetrieve.mockResolvedValue({
      id: 'pi_capture_001',
      status: 'requires_capture',
      amount: 30000,
      amount_received: 0,
    });
    // capture 成功
    mockCapture.mockResolvedValue({
      id: 'pi_capture_001',
      status: 'succeeded',
      amount: 30000,
      amount_received: 30000,
    });

    const result = await capturePayment('pi_capture_001');

    expect(result.success).toBe(true);
    expect(result.capturedAmountCad).toBe(300); // 30000 cents → 300 CAD
    expect(result.transactionId).toBe('pi_capture_001');
    expect(result.errorMessage).toBeUndefined();
  });

  it('should be idempotent when already succeeded', async () => {
    // 已经被划扣（并发保护）
    mockRetrieve.mockResolvedValue({
      id: 'pi_already_done',
      status: 'succeeded',
      amount: 25000,
      amount_received: 25000,
    });

    const result = await capturePayment('pi_already_done');

    expect(result.success).toBe(true);
    expect(result.capturedAmountCad).toBe(250);
    // 不应该调用 capture（已成功，直接返回）
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it('should fail gracefully for unexpected status (e.g., canceled)', async () => {
    mockRetrieve.mockResolvedValue({
      id: 'pi_canceled',
      status: 'canceled',
      amount: 15000,
      amount_received: 0,
    });

    const result = await capturePayment('pi_canceled');

    expect(result.success).toBe(false);
    expect(result.capturedAmountCad).toBe(0);
    expect(result.errorMessage).toContain('意外状态');
    expect(result.errorMessage).toContain('canceled');
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it('should fail gracefully for requires_payment_method status', async () => {
    mockRetrieve.mockResolvedValue({
      id: 'pi_not_confirmed',
      status: 'requires_payment_method',
      amount: 10000,
      amount_received: 0,
    });

    const result = await capturePayment('pi_not_confirmed');

    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('requires_payment_method');
  });
});

// ── 6. cancelAuthorization ───────────────────────────────────────────────────

describe('cancelAuthorization', () => {
  it('should cancel when status=requires_capture', async () => {
    mockRetrieve.mockResolvedValue({
      id: 'pi_to_cancel',
      status: 'requires_capture',
    });
    mockCancel.mockResolvedValue({ id: 'pi_to_cancel', status: 'canceled' });

    await cancelAuthorization('pi_to_cancel');

    expect(mockCancel).toHaveBeenCalledWith('pi_to_cancel');
    expect(mockRefundCreate).not.toHaveBeenCalled();
  });

  it('should refund when status=succeeded (already captured)', async () => {
    mockRetrieve.mockResolvedValue({
      id: 'pi_already_captured',
      status: 'succeeded',
    });
    mockRefundCreate.mockResolvedValue({
      id: 're_001',
      amount: 20000,
    });

    await cancelAuthorization('pi_already_captured');

    expect(mockRefundCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: 'pi_already_captured' })
    );
    expect(mockCancel).not.toHaveBeenCalled();
  });
});

// ── 7. refundPayment ─────────────────────────────────────────────────────────

describe('refundPayment', () => {
  it('should create full refund when no amount specified', async () => {
    mockRefundCreate.mockResolvedValue({ id: 're_full', amount: 50000 });

    const result = await refundPayment('pi_full_refund');

    expect(result.refundId).toBe('re_full');
    expect(result.amountCad).toBe(500);
    expect(mockRefundCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: 'pi_full_refund',
        reason: 'requested_by_customer',
      })
    );
    // 不应传 amount 参数
    const callArgs = mockRefundCreate.mock.calls[0][0];
    expect(callArgs.amount).toBeUndefined();
  });

  it('should create partial refund with specified amount', async () => {
    mockRefundCreate.mockResolvedValue({ id: 're_partial', amount: 10000 });

    const result = await refundPayment('pi_partial', 100);

    expect(result.amountCad).toBe(100);
    expect(mockRefundCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: 'pi_partial',
        amount: 10000, // 100 CAD → 10000 cents
      })
    );
  });
});
