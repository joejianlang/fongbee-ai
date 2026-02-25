/**
 * GET  /api/forum/posts/:id — 获取帖子详情（含评论分页）
 * DELETE /api/forum/posts/:id — 删除帖子（作者或管理员）
 */

import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { getRedisClient } from '@/lib/cache/redis';

const getQuerySchema = z.object({
  commentPage:  z.coerce.number().default(1),
  commentLimit: z.coerce.number().default(10),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      geoTag:  true,
    },
  });

  if (!post || !post.isApproved) {
    return NextResponse.json({ success: false, message: '帖子不存在' }, { status: 404 });
  }

  // 评论分页
  const sp = req.nextUrl.searchParams;
  const { commentPage, commentLimit } = getQuerySchema.parse({
    commentPage:  sp.get('commentPage'),
    commentLimit: sp.get('commentLimit'),
  });
  const commentSkip = (commentPage - 1) * commentLimit;

  const [comments, commentTotal] = await Promise.all([
    prisma.comment.findMany({
      where: { postId: params.id, isApproved: true },
      include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
      skip: commentSkip,
      take: commentLimit,
    }),
    prisma.comment.count({ where: { postId: params.id, isApproved: true } }),
  ]);

  // 当前用户是否已点赞
  let isLiked = false;
  if (userId) {
    try {
      const redis = getRedisClient();
      const likeKey = `like:post:${params.id}:${userId}`;
      isLiked = (await redis.get(likeKey)) !== null;
    } catch { /* Redis 不可用时降级 */ }
  }

  return NextResponse.json({
    success: true,
    data: {
      ...post,
      isLiked,
      comments: {
        items: comments,
        total: commentTotal,
        page: commentPage,
        limit: commentLimit,
        totalPages: Math.ceil(commentTotal / commentLimit),
      },
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) {
    return NextResponse.json({ success: false, message: '帖子不存在' }, { status: 404 });
  }

  const isOwner = post.authorId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true, message: '帖子已删除' });
}
