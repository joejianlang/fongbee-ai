/**
 * POST /api/auth/passkeys/register
 *
 * 两个操作由 action 参数区分:
 *
 * 1. action=options — 生成注册选项（返回 challenge）
 *    Request:  { action: "options" }
 *    Response: PublicKeyCredentialCreationOptionsJSON
 *
 * 2. action=verify  — 验证注册响应并保存 Passkey
 *    Request:  { action: "verify", credential: RegistrationResponseJSON }
 *    Response: { success: true, passkeyId: string }
 *
 * 需要认证: 是（通过 NextAuth session）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../[...nextauth]/auth-options';
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from '@/lib/auth/passkeys';
import { prisma } from '@/lib/db';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  // ── Step 1: Generate Registration Options ─────────────────────────────────
  if (action === 'options') {
    // 获取用户现有的 Passkeys（排除重复注册）
    const existingPasskeys = await prisma.passkey.findMany({
      where: { userId: session.user.id },
      select: { credentialId: true, transports: true },
    });

    const options = await generatePasskeyRegistrationOptions(
      session.user.id,
      session.user.email ?? '',
      existingPasskeys
    );

    return NextResponse.json(options);
  }

  // ── Step 2: Verify Registration Response ──────────────────────────────────
  if (action === 'verify') {
    const credential = body.credential as RegistrationResponseJSON;
    if (!credential) {
      return NextResponse.json({ error: 'credential required' }, { status: 400 });
    }

    const result = await verifyPasskeyRegistration(session.user.id, credential);
    if (!result.verified || !result.passkeyData) {
      return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 });
    }

    // 保存 Passkey 到数据库
    const passkey = await prisma.passkey.create({
      data: {
        userId: session.user.id,
        credentialId: result.passkeyData.credentialId,
        publicKey: result.passkeyData.publicKey,
        counter: result.passkeyData.counter,
        deviceType: result.passkeyData.deviceType,
        transports: result.passkeyData.transports,
        aaguid: result.passkeyData.aaguid,
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, passkeyId: passkey.id });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
