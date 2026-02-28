/**
 * NextAuth v4 配置
 *
 * Providers:
 * 1. CredentialsProvider — 邮箱/密码登录
 * 2. CredentialsProvider (passkey) — Passkey 验证后的 session 建立
 *
 * Session strategy: JWT (无需数据库 session 表)
 * 数据留存: Canada Region (Supabase ca-central-1)
 */

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },

  providers: [
    // ── 1. 邮箱/密码登录 ─────────────────────────────────────────────────────
    CredentialsProvider({
      id: 'credentials',
      name: '邮箱密码',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            password: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            isAnonymized: true,
          },
        });

        if (!user || !user.password) return null;
        if (user.status === 'SUSPENDED' || user.status === 'DELETED') return null;
        if (user.isAnonymized) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        // 更新最后登录时间
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          role: user.role,
        };
      },
    }),

    // ── 2. 桥接 token：自定义 API 已验证后，用 JWT token 建立 NextAuth session ──
    // 登录页在 /api/auth/signin 或 /api/auth/verify-2fa 成功后调用:
    // signIn('token', { token: data.token, redirect: false })
    CredentialsProvider({
      id: 'token',
      name: 'Pre-authenticated Token',
      credentials: {
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        try {
          const payload = jwt.verify(
            credentials.token,
            process.env.JWT_SECRET || 'your-secret-key'
          ) as { userId: string; email: string; role: string };

          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
              isAnonymized: true,
            },
          });

          if (!user) return null;
          if (user.status === 'SUSPENDED' || user.status === 'DELETED') return null;
          if (user.isAnonymized) return null;

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),

    // ── 3. Passkey 验证后建立 session ─────────────────────────────────────────
    // 前端在 verifyAuthenticationResponse 成功后，调用:
    // signIn('passkey', { userId, email, passkeyVerified: 'true' })
    CredentialsProvider({
      id: 'passkey',
      name: 'Passkey',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
        email: { label: 'Email', type: 'email' },
        passkeyVerified: { label: 'Passkey Verified', type: 'text' },
      },
      async authorize(credentials) {
        // ⚠️  此处依赖 /api/auth/passkeys/authenticate 已验证
        // passkeyVerified='true' 由前端在验证成功后传入
        if (credentials?.passkeyVerified !== 'true') return null;
        if (!credentials?.userId || !credentials?.email) return null;

        const user = await prisma.user.findUnique({
          where: {
            id: credentials.userId,
            email: credentials.email,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            isAnonymized: true,
          },
        });

        if (!user) return null;
        if (user.status === 'SUSPENDED' || user.status === 'DELETED') return null;
        if (user.isAnonymized) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role;
        // Fetch city from DB on first sign-in so it's always fresh in the token
        const dbUser = await prisma.user.findUnique({
          where:  { id: user.id as string },
          select: { city: true },
        });
        token.city = dbUser?.city ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id   = token.id   as string;
        session.user.role = token.role as string;
        session.user.city = token.city as string | null | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
