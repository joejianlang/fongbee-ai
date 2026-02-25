/**
 * SimpleWebAuthn Passkeys — 服务端实现
 *
 * 依赖: @simplewebauthn/server (^9.x)
 * 数据存储: Prisma Passkey model (data stays in Canada — Supabase ca-central-1)
 *
 * 流程:
 * Registration:
 *   1. generateRegistrationOptions() → 返回 challenge 给前端
 *   2. 前端调用 startRegistration(options) → 返回 credential
 *   3. verifyRegistrationResponse(credential) → 验证并保存 Passkey 到 DB
 *
 * Authentication:
 *   1. generateAuthenticationOptions() → 返回 challenge 给前端
 *   2. 前端调用 startAuthentication(options) → 返回 assertion
 *   3. verifyAuthenticationResponse(assertion) → 验证，更新 counter，返回 userId
 *
 * Challenge 存储: Upstash Redis (TTL=5min)，避免数据库写入压力
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { getRedisClient } from '../cache/redis';

// ── 环境配置 ──────────────────────────────────────────────────────────────────

function getRpConfig() {
  const rpName = process.env.WEBAUTHN_RP_NAME ?? '优服佳';
  const rpID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
  const origin = process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:3000';
  return { rpName, rpID, origin };
}

const CHALLENGE_TTL = 300; // 5 分钟（秒）

// ── Challenge 管理 (Redis) ─────────────────────────────────────────────────────

async function storeChallenge(userId: string, challenge: string): Promise<void> {
  const redis = getRedisClient();
  await redis.set(`passkey:challenge:${userId}`, challenge, { ex: CHALLENGE_TTL });
}

async function consumeChallenge(userId: string): Promise<string | null> {
  const redis = getRedisClient();
  const key = `passkey:challenge:${userId}`;
  const challenge = await redis.get<string>(key);
  if (challenge) {
    await redis.del(key); // 一次性使用
  }
  return challenge;
}

// ── Registration ──────────────────────────────────────────────────────────────

interface ExistingPasskey {
  credentialId: string;
  transports: string | null;
}

/**
 * 生成注册选项（第 1 步）
 *
 * @param userId    用户 ID
 * @param userEmail 用户邮箱（显示名称）
 * @param existingPasskeys 已有的 Passkey（避免重复注册同一设备）
 */
export async function generatePasskeyRegistrationOptions(
  userId: string,
  userEmail: string,
  existingPasskeys: ExistingPasskey[] = []
) {
  const { rpName, rpID } = getRpConfig();

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(userId),
    userName: userEmail,
    attestationType: 'none', // 不需要设备证书，简化流程
    excludeCredentials: existingPasskeys.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports
        ? (JSON.parse(pk.transports) as AuthenticatorTransportFuture[])
        : undefined,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // 存储 challenge（Redis，TTL=5min）
  await storeChallenge(userId, options.challenge);

  return options;
}

/**
 * 验证注册响应并保存 Passkey（第 3 步）
 *
 * @returns 验证成功后要存入 DB 的 Passkey 数据
 */
export async function verifyPasskeyRegistration(
  userId: string,
  response: RegistrationResponseJSON
): Promise<{
  verified: boolean;
  passkeyData?: {
    credentialId: string;
    publicKey: string;
    counter: bigint;
    deviceType: string;
    transports: string;
    aaguid: string;
  };
}> {
  const { rpID, origin } = getRpConfig();

  const expectedChallenge = await consumeChallenge(userId);
  if (!expectedChallenge) {
    return { verified: false };
  }

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (err) {
    console.error('[Passkeys] Registration verification failed:', err);
    return { verified: false };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { verified: false };
  }

  const { registrationInfo } = verification;
  const { credential, credentialDeviceType, aaguid } = registrationInfo;

  return {
    verified: true,
    passkeyData: {
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: BigInt(credential.counter),
      deviceType: credentialDeviceType,
      transports: JSON.stringify(response.response.transports ?? []),
      aaguid: aaguid ?? '',
    },
  };
}

// ── Authentication ─────────────────────────────────────────────────────────────

/**
 * 生成认证选项（第 1 步）
 *
 * @param existingPasskeys 用户已有的 Passkey 列表
 */
export async function generatePasskeyAuthenticationOptions(
  userId: string,
  existingPasskeys: ExistingPasskey[]
) {
  const { rpID } = getRpConfig();

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: existingPasskeys.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports
        ? (JSON.parse(pk.transports) as AuthenticatorTransportFuture[])
        : undefined,
    })),
    userVerification: 'preferred',
  });

  await storeChallenge(userId, options.challenge);

  return options;
}

/**
 * 验证认证响应（第 3 步）
 *
 * @param storedPasskey  从数据库取出的 Passkey 记录
 * @returns { verified: boolean; newCounter?: bigint }
 */
export async function verifyPasskeyAuthentication(
  userId: string,
  response: AuthenticationResponseJSON,
  storedPasskey: {
    credentialId: string;
    publicKey: string;
    counter: bigint;
    transports: string | null;
  }
): Promise<{
  verified: boolean;
  newCounter?: bigint;
}> {
  const { rpID, origin } = getRpConfig();

  const expectedChallenge = await consumeChallenge(userId);
  if (!expectedChallenge) {
    return { verified: false };
  }

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: storedPasskey.credentialId,
        publicKey: Buffer.from(storedPasskey.publicKey, 'base64url'),
        counter: Number(storedPasskey.counter),
        transports: storedPasskey.transports
          ? (JSON.parse(storedPasskey.transports) as AuthenticatorTransportFuture[])
          : undefined,
      },
    });
  } catch (err) {
    console.error('[Passkeys] Authentication verification failed:', err);
    return { verified: false };
  }

  if (!verification.verified) {
    return { verified: false };
  }

  return {
    verified: true,
    newCounter: BigInt(verification.authenticationInfo.newCounter),
  };
}
