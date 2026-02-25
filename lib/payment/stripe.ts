/**
 * Stripe 支付工具层
 *
 * 关键设计:
 * - capture_method: "manual" — 先冻结授权，不立即划扣
 * - 48h 前（或按 PaymentPolicy.autoCaptureHoursBefore）由 Cron 调用 capture
 * - PAD（预授权借记）≥ CAD $1,000 时走 Payments Canada 标准
 * - 所有金额单位: Stripe cents (整数), DB: Decimal(10,2) CAD
 */

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY 未设置');
    _stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  }
  return _stripe;
}

/** CAD 金额（元）→ Stripe cents */
export const toCents = (amount: number): number => Math.round(amount * 100);

/** Stripe cents → CAD 金额 */
export const fromCents = (cents: number): number => cents / 100;

// ── 1. 创建 Manual Capture PaymentIntent ────────────────────────────────────

export interface CreatePaymentIntentParams {
  amountCad: number;      // 定金金额（CAD）
  orderId: string;
  customerId: string;
  serviceProviderId: string;
  description?: string;
}

/**
 * 创建 Stripe PaymentIntent（Manual Capture 模式）
 *
 * capture_method=manual: 客户授权后资金冻结，不划扣
 * Cron Job 在 scheduledCaptureAt 时间调用 capture()
 */
export async function createManualCaptureIntent(
  params: CreatePaymentIntentParams
): Promise<{ intentId: string; clientSecret: string }> {
  const stripe = getStripe();

  const intent = await stripe.paymentIntents.create({
    amount: toCents(params.amountCad),
    currency: 'cad',
    capture_method: 'manual',           // ⭐ 关键: 手动划扣
    confirm: false,                     // 由前端 confirmCardPayment 触发
    description: params.description ?? `优服佳订单 ${params.orderId}`,
    metadata: {
      orderId: params.orderId,
      customerId: params.customerId,
      serviceProviderId: params.serviceProviderId,
      platform: 'youfujia',
    },
  });

  if (!intent.client_secret) {
    throw new Error('Stripe 未返回 client_secret');
  }

  return { intentId: intent.id, clientSecret: intent.client_secret };
}

// ── 2. 确认授权（客户前端支付后 → AUTHORIZED） ───────────────────────────────

/**
 * 验证 PaymentIntent 已被授权（requires_capture）
 *
 * 客户前端调用 stripe.confirmCardPayment() 后，服务端验证结果
 */
export async function verifyAuthorization(
  intentId: string
): Promise<{ authorized: boolean; status: string; amountCad: number }> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(intentId);

  return {
    authorized: intent.status === 'requires_capture',
    status: intent.status,
    amountCad: fromCents(intent.amount),
  };
}

// ── 3. 执行划扣（Cron Job 调用 → CAPTURED） ─────────────────────────────────

export interface CaptureResult {
  success: boolean;
  capturedAmountCad: number;
  transactionId: string;
  errorMessage?: string;
}

/**
 * 划扣已授权的 PaymentIntent
 *
 * 只在 intent.status === 'requires_capture' 时操作
 * 授权窗口: Stripe 默认 7 天，超时自动取消
 */
export async function capturePayment(intentId: string): Promise<CaptureResult> {
  const stripe = getStripe();

  // 先查状态，避免重复 capture 导致错误
  const intent = await stripe.paymentIntents.retrieve(intentId);

  if (intent.status === 'succeeded') {
    // 已经被 capture 过（可能是并发 Cron 重试）
    return {
      success: true,
      capturedAmountCad: fromCents(intent.amount_received),
      transactionId: intent.id,
    };
  }

  if (intent.status !== 'requires_capture') {
    return {
      success: false,
      capturedAmountCad: 0,
      transactionId: intent.id,
      errorMessage: `意外状态: ${intent.status}，无法划扣`,
    };
  }

  const captured = await stripe.paymentIntents.capture(intentId);

  return {
    success: captured.status === 'succeeded',
    capturedAmountCad: fromCents(captured.amount_received),
    transactionId: captured.id,
    errorMessage: captured.status !== 'succeeded' ? `划扣后状态: ${captured.status}` : undefined,
  };
}

// ── 4. 取消授权（退款冻结金） ────────────────────────────────────────────────

/**
 * 取消 PaymentIntent（不收取费用，仅解冻）
 */
export async function cancelAuthorization(intentId: string): Promise<void> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(intentId);

  if (intent.status === 'requires_capture') {
    await stripe.paymentIntents.cancel(intentId);
  }
  // 如果已 succeeded，需要通过 refund
  if (intent.status === 'succeeded') {
    await stripe.refunds.create({ payment_intent: intentId });
  }
}

// ── 5. 退款 ──────────────────────────────────────────────────────────────────

/**
 * 退款（全额或部分）
 *
 * @param amountCad 退款金额（CAD），不传则全额退款
 */
export async function refundPayment(
  intentId: string,
  amountCad?: number
): Promise<{ refundId: string; amountCad: number }> {
  const stripe = getStripe();

  const refund = await stripe.refunds.create({
    payment_intent: intentId,
    ...(amountCad ? { amount: toCents(amountCad) } : {}),
    reason: 'requested_by_customer',
  });

  return {
    refundId: refund.id,
    amountCad: fromCents(refund.amount),
  };
}

// ── 6. 平台手续费计算 ────────────────────────────────────────────────────────

/**
 * 计算平台抽成（Stripe Connect application_fee_amount）
 */
export function calculatePlatformFee(amountCad: number): number {
  const feeRate = parseFloat(process.env.STRIPE_PLATFORM_FEE_RATE ?? '0.05');
  return Math.round(amountCad * feeRate * 100) / 100;
}
