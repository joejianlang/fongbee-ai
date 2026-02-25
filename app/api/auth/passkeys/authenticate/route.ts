/**
 * POST /api/auth/passkeys/authenticate
 *
 * 两个操作:
 *
 * 1. action=options — 生成认证选项（返回 challenge）
 *    Request:  { action: "options", email: string }
 *    Response: PublicKeyCredentialRequestOptionsJSON
 *
 * 2. action=verify  — 验证认证响应，建立 session
 *    Request:  { action: "verify", email: string, credential: AuthenticationResponseJSON }
 *    Response: { success: true, userId: string }
 *
 * 注: 最终 session 建立通过 NextAuth 的 credentials provider 实现
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from '@/lib/auth/passkeys';
import { prisma } from '@/lib/db';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, email } = body;

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      passkeys: {
        select: {
          id: true,
          credentialId: true,
          publicKey: true,
          counter: true,
          transports: true,
        },
      },
    },
  });

  if (!user || user.passkeys.length === 0) {
    return NextResponse.json(
      { error: 'No passkeys registered for this account' },
      { status: 404 }
    );
  }

  // ── Step 1: Generate Authentication Options ───────────────────────────────
  if (action === 'options') {
    const options = await generatePasskeyAuthenticationOptions(
      user.id,
      user.passkeys.map((pk) => ({
        credentialId: pk.credentialId,
        transports: pk.transports,
      }))
    );

    return NextResponse.json(options);
  }

  // ── Step 2: Verify Authentication Response ────────────────────────────────
  if (action === 'verify') {
    const credential = body.credential as AuthenticationResponseJSON;
    if (!credential) {
      return NextResponse.json({ error: 'credential required' }, { status: 400 });
    }

    // 找到对应的 Passkey（通过 credentialId）
    const matchedPasskey = user.passkeys.find(
      (pk) => pk.credentialId === credential.id
    );

    if (!matchedPasskey) {
      return NextResponse.json({ error: 'Passkey not found' }, { status: 404 });
    }

    const result = await verifyPasskeyAuthentication(
      user.id,
      credential,
      matchedPasskey
    );

    if (!result.verified) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // 更新 counter（防重放攻击）和 lastUsedAt
    await prisma.passkey.update({
      where: { id: matchedPasskey.id },
      data: {
        counter: result.newCounter ?? matchedPasskey.counter,
        lastUsedAt: new Date(),
      },
    });

    // 返回 userId 供前端调用 NextAuth signIn('credentials', { passkeyVerified: true })
    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
