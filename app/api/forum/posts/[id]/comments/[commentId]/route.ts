/**
 * DELETE /api/forum/posts/:id/comments/:commentId
 *
 * 删除评论（作者或管理员）
 * 删除后递减 Post.commentCount
 */

import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../auth/[...nextauth]/auth-options';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: params.commentId },
    select: { id: true, postId: true, authorId: true },
  });

  if (!comment || comment.postId !== params.id) {
    return NextResponse.json({ success: false, message: '评论不存在' }, { status: 404 });
  }

  const isOwner = comment.authorId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.comment.delete({ where: { id: params.commentId } }),
    prisma.post.update({
      where: { id: params.id },
      data:  { commentCount: { decrement: 1 } },
    }),
  ]);

  return NextResponse.json({ success: true, message: '评论已删除' });
}
