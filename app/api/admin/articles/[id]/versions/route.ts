import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/articles/[id]/versions
 * 获取文章所有版本
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const versions = await prisma.contentArticleVersion.findMany({
      where: { articleId: params.id },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: versions.map((v) => ({
        version: v.version,
        title: v.title,
        subtitle: v.subtitle,
        description: v.description,
        content: v.content,
        plainText: v.plainText,
        changesSummary: v.changesSummary,
        previousVersion: v.previousVersion,
        editorId: v.editorId,
        createdAt: v.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取版本失败' },
      { status: 500 }
    );
  }
}
