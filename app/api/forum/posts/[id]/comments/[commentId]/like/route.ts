/**
 * POST /api/forum/posts/:id/comments/:commentId/like — 切换评论点赞
 *
 * 点赞状态存 Redis（key: like:comment:{commentId}:{userId}，TTL 30天）
 * 计数存 Prisma Comment.likeCount
 */

import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../auth/[...nextauth]/auth-options';
import { getRedisClient } from '@/lib/cache/redis';

const LIKE_TTL = 60 * 60 * 24 * 30; // 30 天

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: params.commentId },
    select: { id: true, postId: true },
  });

  if (!comment || comment.postId !== params.id) {
    return NextResponse.json({ success: false, message: '评论不存在' }, { status: 404 });
  }

  const redis = getRedisClient();
  const likeKey = `like:comment:${params.commentId}:${session.user.id}`;
  const alreadyLiked = await redis.get(likeKey);

  let liked: boolean;
  let updated: { likeCount: number };

  if (alreadyLiked !== null) {
    await redis.del(likeKey);
    updated = await prisma.comment.update({
      where: { id: params.commentId },
      data:  { likeCount: { decrement: 1 } },
      select: { likeCount: true },
    });
    liked = false;
  } else {
    await redis.set(likeKey, '1', { ex: LIKE_TTL });
    updated = await prisma.comment.update({
      where: { id: params.commentId },
      data:  { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
    liked = true;
  }

  return NextResponse.json({
    success: true,
    message: liked ? '点赞成功' : '已取消点赞',
    data: { liked, likeCount: Math.max(0, updated.likeCount) },
  });
}
