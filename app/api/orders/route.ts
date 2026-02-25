import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const createOrderSchema = z.object({
  serviceId: z.string(),
  priceOptionId: z.string().optional(),
  scheduledStartTime: z.string().datetime(),
  scheduledEndTime: z.string().datetime(),
  customerNotes: z.string().optional(),
  serviceAddress: z.string().optional(),
});

/**
 * POST /api/orders
 * 创建订单（预授权阶段）
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json();
    const validated = createOrderSchema.parse(body);

    // TODO: Get customer ID from session
    const customerId = 'customer-id';

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: validated.serviceId },
      include: {
        category: true,
        serviceProvider: true,
        priceOptions: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: '服务不存在' },
        { status: 404 }
      );
    }

    // Get payment policy for standard service
    const paymentPolicy = await prisma.paymentPolicy.findFirst({
      where: {
        serviceType: 'standard',
        serviceCategoryId: null,
      },
    });

    if (!paymentPolicy) {
      return NextResponse.json(
        { success: false, message: '支付政策未配置' },
        { status: 500 }
      );
    }

    // Calculate amounts
    const totalAmount = Number(service.basePrice);
    const depositAmount =
      (totalAmount * (paymentPolicy.depositPercentage || 0)) / 100;
    const remainingAmount = totalAmount - depositAmount;

    // Calculate scheduled capture time
    const scheduledStartTime = new Date(validated.scheduledStartTime);
    const scheduledCaptureAt = new Date(
      scheduledStartTime.getTime() - paymentPolicy.autoCaptureHoursBefore * 60 * 60 * 1000
    );

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100), // Stripe uses cents
      currency: 'cad',
      confirm: false, // Manual confirmation
      metadata: {
        orderId: 'temp', // Will be updated after order creation
        customerId,
      },
    });

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        serviceType: 'standard',
        serviceId: validated.serviceId,
        customerId,
        serviceProviderId: service.serviceProviderId,
        paymentPolicyId: paymentPolicy.id,
        totalAmount: totalAmount.toString(),
        depositAmount: depositAmount.toString(),
        remainingAmount: remainingAmount.toString(),
        stripeIntentId: paymentIntent.id,
        stripeIntentStatus: paymentIntent.status,
        scheduledStartTime,
        scheduledEndTime: new Date(validated.scheduledEndTime),
        scheduledCaptureAt,
        serviceAddress: validated.serviceAddress,
        serviceNotes: validated.customerNotes,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: '订单创建成功',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          stripeIntentId: paymentIntent.id,
          stripeClientSecret: paymentIntent.client_secret,
          totalAmount,
          depositAmount,
          remainingAmount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: '输入验证失败',
          error: error.errors[0].message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建订单失败',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders
 * 获取订单列表（当前用户）
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<any>>>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // TODO: Get user ID from session
    const userId = 'user-id';

    const skip = (page - 1) * limit;

    const where: any = {
      customerId: userId,
    };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          service: {
            select: { title: true, basePrice: true },
          },
          serviceProvider: {
            select: { user: { select: { firstName: true, lastName: true } } },
          },
          payments: true,
          review: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取订单列表失败',
      },
      { status: 500 }
    );
  }
}
