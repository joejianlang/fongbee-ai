// GET /api/contracts/:id/diff?from=v1&to=v2
//
// 返回两个合同版本之间的 Diff
// 支持: 相邻版本 diff (返回预存的 diffFromPrev)
//       任意版本 diff (实时计算)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { diffLines } from 'diff';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { ApiResponse } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromVersion = parseInt(searchParams.get('from') ?? '0');
  const toVersion = parseInt(searchParams.get('to') ?? '0');

  if (!fromVersion || !toVersion || fromVersion >= toVersion) {
    return NextResponse.json({
      success: false,
      message: 'from 和 to 版本号必须是正整数，且 from < to',
    }, { status: 400 });
  }

  // 验证权限
  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { project: { select: { customerId: true, serviceProviderId: true } } },
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

  // 加载版本内容
  const [fromV, toV] = await Promise.all([
    prisma.contractVersion.findUnique({
      where: { contractId_version: { contractId: params.id, version: fromVersion } },
      select: { content: true, version: true, status: true, createdAt: true },
    }),
    prisma.contractVersion.findUnique({
      where: { contractId_version: { contractId: params.id, version: toVersion } },
      select: { content: true, version: true, status: true, createdAt: true, diffFromPrev: true },
    }),
  ]);

  if (!fromV) {
    return NextResponse.json({ success: false, message: `版本 ${fromVersion} 不存在` }, { status: 404 });
  }
  if (!toV) {
    return NextResponse.json({ success: false, message: `版本 ${toVersion} 不存在` }, { status: 404 });
  }

  // 如果是相邻版本且有预存 diff，直接返回
  if (toVersion === fromVersion + 1 && toV.diffFromPrev) {
    return NextResponse.json({
      success: true,
      data: {
        from: { version: fromVersion, createdAt: fromV.createdAt },
        to: { version: toVersion, createdAt: toV.createdAt },
        diff: JSON.parse(toV.diffFromPrev),
        isPrecomputed: true,
      },
    });
  }

  // 实时计算任意两版本的 diff
  const changes = diffLines(fromV.content, toV.content);
  let lineNum = 1;

  const diff = changes.map((change) => {
    const lines = (change.value ?? '').split('\n').filter((_, i, arr) =>
      i < arr.length - 1 || arr[i] !== ''
    );
    const count = lines.length || 1;

    const chunk = {
      type: change.added ? 'added' : change.removed ? 'removed' : 'unchanged',
      lineStart: lineNum,
      lineEnd: lineNum + count - 1,
      text: change.value,
    };

    if (!change.removed) lineNum += count;
    return chunk;
  });

  return NextResponse.json({
    success: true,
    data: {
      from: { version: fromVersion, createdAt: fromV.createdAt },
      to: { version: toVersion, createdAt: toV.createdAt },
      diff,
      isPrecomputed: false,
      summary: {
        added: diff.filter((d) => d.type === 'added').length,
        removed: diff.filter((d) => d.type === 'removed').length,
        unchanged: diff.filter((d) => d.type === 'unchanged').length,
      },
    },
  });
}
