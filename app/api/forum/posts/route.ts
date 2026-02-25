import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const getPostsSchema = z.object({
  city: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius: z.coerce.number().default(25),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

const createPostSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  geoTag: z.string(), // "Guelph, ON"
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

/**
 * GET /api/forum/posts
 * 获取论坛帖子（地理过滤）
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<any>>>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const params = getPostsSchema.parse({
      city: searchParams.get('city'),
      latitude: searchParams.get('latitude'),
      longitude: searchParams.get('longitude'),
      radius: searchParams.get('radius'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const skip = (params.page - 1) * params.limit;

    // Build where clause for geo filtering
    const where: any = {
      isApproved: true,
    };

    if (params.city) {
      where.geoTag = {
        contains: params.city,
      };
    }

    // TODO: Implement geospatial query for lat/long within radius

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          comments: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        skip,
        take: params.limit,
        orderBy: { isPinned: 'desc', createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: posts,
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
        error: error instanceof Error ? error.message : '获取帖子列表失败',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forum/posts
 * 发布帖子
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json();
    const validated = createPostSchema.parse(body);

    // TODO: Get user ID from session
    const userId = 'user-id';

    const post = await prisma.post.create({
      data: {
        title: validated.title,
        content: validated.content,
        geoTag: validated.geoTag,
        latitude: validated.latitude,
        longitude: validated.longitude,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, firstName: true, avatar: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: '帖子发布成功',
        data: post,
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
        error: error instanceof Error ? error.message : '发布帖子失败',
      },
      { status: 500 }
    );
  }
}
