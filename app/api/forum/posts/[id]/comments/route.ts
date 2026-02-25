/**
 * GET  /api/forum/posts/:id/comments — 获取评论列表（分页）
 * POST /api/forum/posts/:id/comments — 发布评论（需登录）
 */

import { prisma } from '@/lib/db';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/auth-options';

const listSchema = z.object({
  page:  z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

const createSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<PaginatedResponse<unknown>>>> {
  const sp = req.nextUrl.searchParams;
  const { page, limit } = listSchema.parse({
    page:  sp.get('page'),
    limit: sp.get('limit'),
  });
  const skip = (page - 1) * limit;

  // 确认帖子存在
  const postExists = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!postExists) {
    return NextResponse.json({ success: false, message: '帖子不存在' }, { status: 404 });
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId: params.id, isApproved: true },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where: { postId: params.id, isApproved: true } }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      items: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!post) {
    return NextResponse.json({ success: false, message: '帖子不存在' }, { status: 404 });
  }

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        postId:   params.id,
        authorId: session.user.id,
        content:  parsed.data.content,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    }),
    prisma.post.update({
      where: { id: params.id },
      data:  { commentCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json(
    { success: true, message: '评论发布成功', data: comment },
    { status: 201 }
  );
}
