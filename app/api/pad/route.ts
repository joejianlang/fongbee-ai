/**
 * /api/pad — PAD 预授权借记 API
 *
 * 加拿大 Payments Canada 标准（PAD Rule H1）
 * 触发条件: 订单总金额 ≥ CAD $1,000
 *
 * POST /api/pad — 创建/更新 PAD 授权
 * GET  /api/pad — 获取当前用户的 PAD 授权
 *
 * PAD 流程:
 * 1. 用户填写银行账户信息（机构号 + 分支号 + 账户末4位 + 账户类型）
 * 2. 用户勾选同意条款 → 系统生成 PDF 协议
 * 3. PDF 上传到 Supabase Storage（Canada Region）
 * 4. 保存 PADAuthorization 记录
 * 5. 创建订单时自动关联
 *
 * 注意: 真实银行账号不存储，只存末4位（符合 PCI-DSS）
 *       银行账号验证通过 Stripe ACH 或人工审核
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/auth-options';
import { ApiResponse } from '@/lib/types';

const createPadSchema = z.object({
  // 加拿大银行标识（3位机构号 + 5位分支号）
  institutionNo: z.string().regex(/^\d{3}$/, '机构号必须是3位数字'),
  transitNo: z.string().regex(/^\d{5}$/, '分支号必须是5位数字'),
  accountLast4: z.string().regex(/^\d{4}$/, '账号末4位必须是4位数字'),
  accountType: z.enum(['CHEQUING', 'SAVINGS']),
  maxAmountCad: z.number().positive().max(100000), // 最大授权金额（CAD）
  // 用户明确同意 PAD 条款
  agreementAccepted: z.literal(true, {
    errorMap: () => ({ message: '必须同意 PAD 预授权条款' }),
  }),
});

// ── POST /api/pad — 创建 PAD 授权 ─────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = createPadSchema.parse(body);

    // 撤销旧授权
    await prisma.pADAuthorization.updateMany({
      where: { userId: session.user.id, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date(), revokedReason: '用户创建新 PAD 授权' },
    });

    // 创建新授权
    const padAuth = await prisma.pADAuthorization.create({
      data: {
        userId: session.user.id,
        institutionNo: validated.institutionNo,
        transitNo: validated.transitNo,
        accountLast4: validated.accountLast4,
        accountType: validated.accountType,
        maxAmountCad: validated.maxAmountCad,
        status: 'ACTIVE',
        // TODO: 生成 PDF 协议并上传 Supabase Storage
        // agreementPdfUrl: await generateAndUploadPadPdf(...)
      },
    });

    // 记录管理日志（CPPA 合规审计）
    await prisma.adminLog.create({
      data: {
        action: 'PAD_AUTHORIZATION_CREATED',
        resourceType: 'pad_authorization',
        resourceId: padAuth.id,
        notes: `用户 ${session.user.email} 创建 PAD 授权，上限 CAD $${validated.maxAmountCad}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'PAD 预授权设置成功',
      data: {
        padAuthId: padAuth.id,
        institutionNo: padAuth.institutionNo,
        accountLast4: padAuth.accountLast4,
        accountType: padAuth.accountType,
        maxAmountCad: Number(padAuth.maxAmountCad),
        authorizedAt: padAuth.authorizedAt,
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('[PAD POST]', error);
    return NextResponse.json({ success: false, error: '创建 PAD 授权失败' }, { status: 500 });
  }
}

// ── GET /api/pad — 获取当前 PAD 授权 ──────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const activePad = await prisma.pADAuthorization.findFirst({
    where: { userId: session.user.id, status: 'ACTIVE' },
    select: {
      id: true,
      institutionNo: true,
      accountLast4: true,
      accountType: true,
      maxAmountCad: true,
      authorizedAt: true,
      status: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: activePad
      ? {
          ...activePad,
          maxAmountCad: Number(activePad.maxAmountCad),
        }
      : null,
  });
}

// ── DELETE /api/pad — 撤销 PAD 授权 ───────────────────────────────────────────

export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = (body as Record<string, unknown>).reason as string | undefined;

  await prisma.pADAuthorization.updateMany({
    where: { userId: session.user.id, status: 'ACTIVE' },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedReason: reason ?? '用户主动撤销',
    },
  });

  return NextResponse.json({ success: true, message: 'PAD 授权已撤销' });
}
