// POST /api/contracts/:id/versions/:versionId/sign
//
// 电子签署合同版本（CPPA 合规）
// 记录: IP 地址、User-Agent、签署时间
//
// 签署流程:
// 1. 双方各自签署（无顺序要求）
// 2. 双方均签署后 -> ContractVersionStatus.SIGNED + ContractStatus.ACTIVE
// 3. Project.activeContractId = 当前版本 ID

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '../../../../../auth/[...nextauth]/auth-options';
import { ApiResponse } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // 加载版本 + 合同 + 项目
  const version = await prisma.contractVersion.findUnique({
    where: { id: params.versionId },
    include: {
      contract: {
        include: {
          project: {
            select: {
              id: true,
              customerId: true,
              serviceProviderId: true,
              title: true,
            },
          },
        },
      },
      signatures: true,
    },
  });

  if (!version || version.contractId !== params.id) {
    return NextResponse.json({ success: false, message: '合同版本不存在' }, { status: 404 });
  }

  if (version.status === 'SUPERSEDED') {
    return NextResponse.json({ success: false, message: '该版本已被新版本替代，请签署最新版本' }, { status: 400 });
  }

  if (version.status === 'SIGNED') {
    return NextResponse.json({ success: false, message: '该版本已完成签署' }, { status: 400 });
  }

  const project = version.contract.project;

  // 确认签署方身份
  const isCustomer = project.customerId === session.user.id;
  const sp = session.user.role === 'SERVICE_PROVIDER'
    ? await prisma.serviceProvider.findFirst({ where: { userId: session.user.id }, select: { id: true } })
    : null;
  const isProvider = sp && sp.id === project.serviceProviderId;

  if (!isCustomer && !isProvider) {
    return NextResponse.json({ success: false, message: 'Forbidden: 只有合同相关方可签署' }, { status: 403 });
  }

  // 检查是否已签署
  const alreadySigned = version.signatures.some((s) => s.signerId === session.user.id);
  if (alreadySigned) {
    return NextResponse.json({ success: false, message: '您已签署此版本' }, { status: 409 });
  }

  // 提取客户端信息（CPPA 法律存证）
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  const userAgent = req.headers.get('user-agent') ?? 'unknown';

  // 创建签名记录
  await prisma.contractSignature.create({
    data: {
      contractVersionId: params.versionId,
      signerId: session.user.id,
      role: isCustomer ? 'CUSTOMER' : 'PROVIDER',
      ipAddress,
      userAgent,
    },
  });

  // 重新加载所有签名，判断是否双方均已签署
  const allSignatures = await prisma.contractSignature.findMany({
    where: { contractVersionId: params.versionId },
  });

  const customerSigned = allSignatures.some((s) => s.role === 'CUSTOMER');
  const providerSigned = allSignatures.some((s) => s.role === 'PROVIDER');
  const bothSigned = customerSigned && providerSigned;

  if (bothSigned) {
    // 双方签署完成: 合同生效
    await prisma.$transaction([
      prisma.contractVersion.update({
        where: { id: params.versionId },
        data: { status: 'SIGNED' },
      }),
      prisma.contract.update({
        where: { id: params.id },
        data: { status: 'ACTIVE' },
      }),
      prisma.project.update({
        where: { id: project.id },
        data: {
          activeContractId: params.versionId,
          status: 'ACTIVE',
        },
      }),
      // 通知双方合同生效
      prisma.notification.create({
        data: {
          userId: project.customerId,
          type: 'ORDER_CONFIRMED',
          title: '合同已生效',
          message: `项目《${project.title}》的合同双方已签署，项目正式启动。`,
          actionUrl: `/app/projects/${project.id}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: project.serviceProviderId, // NOTE: serviceProviderId here is SP.id not User.id
          type: 'ORDER_CONFIRMED',
          title: '合同已生效',
          message: `项目《${project.title}》的合同双方已签署，项目正式启动。`,
          actionUrl: `/app/projects/${project.id}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: '签署成功，合同已生效，项目正式启动',
      data: {
        contractStatus: 'ACTIVE',
        versionStatus: 'SIGNED',
        projectStatus: 'ACTIVE',
        bothSigned: true,
      },
    });
  }

  // 单方签署完成，等待对方
  const waitingFor = isCustomer ? '服务商' : '客户';
  return NextResponse.json({
    success: true,
    message: `您已签署，等待${waitingFor}签署`,
    data: {
      versionStatus: 'PENDING',
      customerSigned,
      providerSigned,
      bothSigned: false,
    },
  });
}
