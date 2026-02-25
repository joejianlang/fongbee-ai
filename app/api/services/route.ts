import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const getServicesSchema = z.object({
  categoryId: z.string().optional(),
  providerId: z.string().optional(),
  searchText: z.string().optional(),
  city: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius: z.coerce.number().default(25),
  minRating: z.coerce.number().default(0),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

/**
 * GET /api/services
 * 获取服务列表（支持过滤、搜索、地理位置）
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<any>>>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const params = getServicesSchema.parse({
      categoryId: searchParams.get('categoryId'),
      providerId: searchParams.get('providerId'),
      searchText: searchParams.get('searchText'),
      city: searchParams.get('city'),
      latitude: searchParams.get('latitude'),
      longitude: searchParams.get('longitude'),
      radius: searchParams.get('radius'),
      minRating: searchParams.get('minRating'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const skip = (params.page - 1) * params.limit;

    // Build where clause
    const where: any = {
      isAvailable: true,
    };

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.providerId) {
      where.serviceProviderId = params.providerId;
    }

    if (params.searchText) {
      where.OR = [
        { title: { contains: params.searchText, mode: 'insensitive' } },
        { description: { contains: params.searchText, mode: 'insensitive' } },
      ];
    }

    if (params.city) {
      where.serviceArea = { contains: params.city };
    }

    // TODO: Implement geospatial query for latitude/longitude within radius

    // Fetch services
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: true,
          serviceProvider: {
            select: {
              id: true,
              businessName: true,
              user: {
                select: { avatar: true },
              },
              isVerified: true,
              averageRating: true,
            },
          },
          priceOptions: true,
        },
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: services,
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取服务列表失败',
      },
      { status: 500 }
    );
  }
}

const createServiceSchema = z.object({
  categoryId: z.string(),
  title: z.string(),
  description: z.string(),
  basePrice: z.coerce.number().positive(),
  priceUnit: z.enum(['hour', 'day', 'project', 'item']),
  images: z.array(z.string()).optional(),
  minBookingHours: z.coerce.number().default(1),
  maxBookingHours: z.coerce.number().default(8),
});

/**
 * POST /api/services
 * 创建服务（需要认证的服务商）
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // TODO: Check authentication and service provider role

    const body = await req.json();
    const validated = createServiceSchema.parse(body);

    // TODO: Get service provider ID from session
    const serviceProviderId = 'provider-id';

    const service = await prisma.service.create({
      data: {
        categoryId: validated.categoryId,
        serviceProviderId,
        title: validated.title,
        description: validated.description,
        basePrice: validated.basePrice.toString(),
        priceUnit: validated.priceUnit,
        // images field removed from schema v2 (use Supabase Storage)
        minBookingHours: validated.minBookingHours,
        maxBookingHours: validated.maxBookingHours,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: '服务创建成功',
        data: service,
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
        error: error instanceof Error ? error.message : '创建服务失败',
      },
      { status: 500 }
    );
  }
}
