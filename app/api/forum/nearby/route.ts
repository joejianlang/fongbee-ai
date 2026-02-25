/**
 * GET /api/forum/nearby
 *
 * 获取附近帖子（Geohash + Haversine 精确过滤）
 *
 * Query params:
 *   latitude  — 纬度（必填）
 *   longitude — 经度（必填）
 *   radius    — 搜索半径（km，默认 5）
 *   limit     — 返回上限（默认 20）
 *
 * 返回字段额外包含: distanceMeters, distanceKm（按距离升序排列）
 */

import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildGeohashQuery, haversineDistance } from '@/lib/geo/geohash';

const nearbySchema = z.object({
  latitude:  z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius:    z.coerce.number().min(0.1).max(50).default(5),   // km
  limit:     z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const sp = req.nextUrl.searchParams;
  const parsed = nearbySchema.safeParse({
    latitude:  sp.get('latitude'),
    longitude: sp.get('longitude'),
    radius:    sp.get('radius'),
    limit:     sp.get('limit'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { latitude, longitude, radius, limit } = parsed.data;
  const radiusMeters = radius * 1000;

  // 1. Geohash 矩形查询（9 个格子），通过 Post 关联过滤 isApproved
  const geohashes = buildGeohashQuery(latitude, longitude, radiusMeters);

  const posts = await prisma.post.findMany({
    where: {
      isApproved: true,
      geoTag: { geohash: { in: geohashes } },
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      geoTag: true,
      _count:  { select: { comments: true } },
    },
  });

  // 2. Haversine 精确过滤 + 计算距离
  const nearby = posts
    .filter((p) => p.geoTag !== null)
    .map((p) => {
      const distanceMeters = haversineDistance(
        latitude, longitude,
        p.geoTag!.latitude, p.geoTag!.longitude
      );
      return { ...p, distanceMeters: Math.round(distanceMeters), distanceKm: Math.round(distanceMeters / 10) / 100 };
    })
    .filter((p) => p.distanceMeters <= radiusMeters)
    // 3. 按距离升序排列
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    // 4. 截取 limit
    .slice(0, limit);

  return NextResponse.json({
    success: true,
    data: {
      items:    nearby,
      total:    nearby.length,
      center:   { latitude, longitude },
      radiusKm: radius,
    },
  });
}
