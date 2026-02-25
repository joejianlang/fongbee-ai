// POST /api/projects/:id/contracts — 为项目创建合同
// GET  /api/projects/:id/contracts — 查看项目所有合同

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../auth/[...nextauth]/auth-options';
import { ApiResponse } from '@/lib/types';

const createContractSchema = z.object({
  title: z.string().min(5).max(200),
  initialContent: z.string().min(50, '合同初稿不得少于 50 字'),
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
  let validated: z.infer<typeof createContractSchema>;
  try {
    validated = createContractSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: '输入验证失败', error: error.errors[0].message },
        { status: 400 }
      );
    }
    throw error;
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      customerId: true,
      serviceProviderId: true,
      title: true,
      status: true,
    },
  });

  if (!project) {
    return NextResponse.json({ success: false, message: '项目不存在' }, { status: 404 });
  }

  // 权限: 双方均可发起合同草稿
  const sp = session.user.role === 'SERVICE_PROVIDER'
    ? await prisma.serviceProvider.findFirst({ where: { userId: session.user.id }, select: { id: true } })
    : null;

  const isParty =
    project.customerId === session.user.id ||
    (sp && sp.id === project.serviceProviderId) ||
    session.user.role === 'ADMIN';

  if (!isParty) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  // 创建合同 + v1 版本
  const contract = await prisma.$transaction(async (tx) => {
    const c = await tx.contract.create({
      data: {
        projectId: params.id,
        title: validated.title,
        status: 'DRAFT',
      },
    });

    await tx.contractVersion.create({
      data: {
        contractId: c.id,
        version: 1,
        content: validated.initialContent,
        diffFromPrev: null, // 第一版无 diff
        editorId: session.user.id,
        status: 'DRAFT',
      },
    });

    return c;
  });

  // 通知对方查看合同
  const notifyUserId = project.customerId === session.user.id
    ? project.serviceProviderId // SP.id — 注意这不是 User.id，需要查找
    : project.customerId;

  // 若通知服务商，需要 userId
  if (project.customerId !== session.user.id) {
    // 通知客户
    await prisma.notification.create({
      data: {
        userId: project.customerId,
        type: 'CONTRACT_UPDATED',
        title: '合同草稿已创建',
        message: `服务商为项目《${project.title}》创建了合同草稿，请查看并审阅。`,
        actionUrl: `/app/projects/${params.id}/contracts/${contract.id}`,
      },
    });
  }

  return NextResponse.json({
    success: true,
    message: '合同草稿创建成功',
    data: {
      id: contract.id,
      title: contract.title,
      status: contract.status,
      projectId: params.id,
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

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { customerId: true, serviceProviderId: true },
  });
  if (!project) {
    return NextResponse.json({ success: false, message: '项目不存在' }, { status: 404 });
  }

  const sp = session.user.role === 'SERVICE_PROVIDER'
    ? await prisma.serviceProvider.findFirst({ where: { userId: session.user.id }, select: { id: true } })
    : null;

  const hasAccess =
    project.customerId === session.user.id ||
    (sp && sp.id === project.serviceProviderId) ||
    session.user.role === 'ADMIN';

  if (!hasAccess) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const contracts = await prisma.contract.findMany({
    where: { projectId: params.id },
    include: {
      versions: {
        select: {
          id: true, version: true, status: true, createdAt: true,
          _count: { select: { signatures: true } },
        },
        orderBy: { version: 'desc' },
        take: 1, // 只返回最新版本摘要
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: contracts.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      latestVersion: c.versions[0] ?? null,
      createdAt: c.createdAt,
    })),
  });
}
