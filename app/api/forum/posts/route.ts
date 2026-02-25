import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { encodeGeohash, buildGeohashQuery, haversineDistance } from '@/lib/geo/geohash';

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

    // Geohash LBS 查询
    if (params.latitude && params.longitude) {
      const geohashes = buildGeohashQuery(params.latitude, params.longitude, params.radius * 1000);
      // 通过 PostGeoTag 关联过滤
      where.geoTag = {
        geohash: { in: geohashes },
      };
    } else if (params.city) {
      where.geoTag = {
        city: { contains: params.city, mode: 'insensitive' },
      };
    }

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
          geoTag: true,
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

    // Haversine 精确过滤（去除 Geohash 矩形边角的误差）
    const filteredPosts = (params.latitude && params.longitude)
      ? posts.filter((p) => {
          if (!p.geoTag) return false;
          const dist = haversineDistance(
            params.latitude!,
            params.longitude!,
            p.geoTag.latitude,
            p.geoTag.longitude
          );
          return dist <= params.radius * 1000;
        })
      : posts;

    return NextResponse.json({
      success: true,
      data: {
        items: filteredPosts,
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = createPostSchema.parse(body);

    const userId = session.user.id;

    const post = await prisma.post.create({
      data: {
        title: validated.title,
        content: validated.content,
        authorId: userId,
        // PostGeoTag 关联（嵌套创建）
        ...(validated.latitude && validated.longitude
          ? {
              geoTag: {
                create: {
                  latitude: validated.latitude,
                  longitude: validated.longitude,
                  geohash: encodeGeohash(validated.latitude, validated.longitude),
                  city: validated.geoTag, // "Guelph, ON" → city 字段
                },
              },
            }
          : {}),
      },
      include: {
        author: {
          select: { id: true, firstName: true, avatar: true },
        },
        geoTag: true,
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
