// POST /api/contracts/:id/versions — 提交新合同版本（含 Myers Diff）
// GET  /api/contracts/:id/versions — 查看版本历史

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { createTwoFilesPatch, diffLines } from 'diff';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { ApiResponse } from '@/lib/types';

// diff 结果序列化格式（存入 ContractVersion.diffFromPrev）
interface DiffChunk {
  type: 'added' | 'removed' | 'unchanged';
  lineStart: number;
  lineEnd: number;
  text: string;
}

function computeDiff(prev: string, next: string): DiffChunk[] {
  const changes = diffLines(prev, next);
  const result: DiffChunk[] = [];
  let lineNum = 1;

  for (const change of changes) {
    const lines = (change.value ?? '').split('\n').filter((_, i, arr) =>
      i < arr.length - 1 || arr[i] !== ''
    );
    const count = lines.length || 1;

    if (change.added) {
      result.push({
        type: 'added',
        lineStart: lineNum,
        lineEnd: lineNum + count - 1,
        text: change.value,
      });
      lineNum += count;
    } else if (change.removed) {
      result.push({
        type: 'removed',
        lineStart: lineNum,
        lineEnd: lineNum + count - 1,
        text: change.value,
      });
      // removed lines 不增加新文档的行号
    } else {
      result.push({
        type: 'unchanged',
        lineStart: lineNum,
        lineEnd: lineNum + count - 1,
        text: change.value,
      });
      lineNum += count;
    }
  }

  return result;
}

const createVersionSchema = z.object({
  content: z.string().min(50, '合同内容不得少于 50 字'),
  title: z.string().min(2).max(200).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  let validated: z.infer<typeof createVersionSchema>;
  try {
    validated = createVersionSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: '输入验证失败', error: error.errors[0].message },
        { status: 400 }
      );
    }
    throw error;
  }

  // 加载合同 + 项目 + 最新版本
  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      project: {
        select: {
          id: true,
          customerId: true,
          serviceProviderId: true,
          title: true,
        },
      },
      versions: {
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
  });

  if (!contract) {
    return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });
  }

  // 权限: 项目相关方（客户 or 服务商）
  const sp = session.user.role === 'SERVICE_PROVIDER'
    ? await prisma.serviceProvider.findFirst({ where: { userId: session.user.id }, select: { id: true } })
    : null;

  const isParty =
    contract.project.customerId === session.user.id ||
    (sp && sp.id === contract.project.serviceProviderId) ||
    session.user.role === 'ADMIN';

  if (!isParty) {
    return NextResponse.json({ success: false, message: 'Forbidden: 只有合同相关方可编辑' }, { status: 403 });
  }

  if (contract.status === 'ACTIVE') {
    return NextResponse.json({ success: false, message: '合同已生效，不可修改' }, { status: 400 });
  }

  const latestVersion = contract.versions[0];
  const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

  // 计算 Myers Diff
  const diffChunks: DiffChunk[] = latestVersion
    ? computeDiff(latestVersion.content, validated.content)
    : [];

  // 如果有旧版本且内容完全相同，拒绝提交
  if (latestVersion && diffChunks.every((c) => c.type === 'unchanged')) {
    return NextResponse.json({ success: false, message: '内容与当前版本完全相同，无需提交' }, { status: 400 });
  }

  // 将旧版本标为 SUPERSEDED
  await prisma.$transaction([
    // 新版本
    prisma.contractVersion.create({
      data: {
        contractId: params.id,
        version: newVersionNumber,
        content: validated.content,
        diffFromPrev: diffChunks.length > 0 ? JSON.stringify(diffChunks) : null,
        editorId: session.user.id,
        status: 'DRAFT',
      },
    }),
    // 旧版本 -> SUPERSEDED
    ...(latestVersion
      ? [
          prisma.contractVersion.update({
            where: { id: latestVersion.id },
            data: { status: 'SUPERSEDED' },
          }),
        ]
      : []),
    // 通知对方（如果是客户提交，通知服务商；反之亦然）
    prisma.notification.create({
      data: {
        userId:
          contract.project.customerId === session.user.id
            ? contract.project.serviceProviderId // 通知服务商（这里是 SP.id，不是 User.id — 需确认）
            : contract.project.customerId,
        type: 'CONTRACT_UPDATED',
        title: '合同已更新',
        message: `项目《${contract.project.title}》的合同已提交新版本 v${newVersionNumber}，请查看并签署。`,
        actionUrl: `/app/projects/${contract.project.id}/contracts/${params.id}`,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: `合同 v${newVersionNumber} 提交成功`,
    data: {
      contractId: params.id,
      version: newVersionNumber,
      changesCount: diffChunks.filter((c) => c.type !== 'unchanged').length,
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { customerId: true, serviceProviderId: true } },
      versions: {
        include: {
          editor: { select: { id: true, firstName: true, role: true } },
          signatures: {
            include: { signer: { select: { id: true, firstName: true, role: true } } },
          },
        },
        orderBy: { version: 'desc' },
      },
    },
  });

  if (!contract) {
    return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });
  }

  const sp = session.user.role === 'SERVICE_PROVIDER'
    ? await prisma.serviceProvider.findFirst({ where: { userId: session.user.id }, select: { id: true } })
    : null;

  const hasAccess =
    contract.project.customerId === session.user.id ||
    (sp && sp.id === contract.project.serviceProviderId) ||
    session.user.role === 'ADMIN';

  if (!hasAccess) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    data: {
      contractId: contract.id,
      status: contract.status,
      versions: contract.versions.map((v) => ({
        id: v.id,
        version: v.version,
        status: v.status,
        editor: v.editor,
        signatures: v.signatures.map((s) => ({
          signerId: s.signerId,
          role: s.role,
          signedAt: s.signedAt,
        })),
        createdAt: v.createdAt,
        // 不返回 content（太大），按需单独查询
        diffSummary: v.diffFromPrev
          ? (() => {
              const chunks: DiffChunk[] = JSON.parse(v.diffFromPrev);
              return {
                added: chunks.filter((c) => c.type === 'added').length,
                removed: chunks.filter((c) => c.type === 'removed').length,
              };
            })()
          : null,
      })),
    },
  });
}
