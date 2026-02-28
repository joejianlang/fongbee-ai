/**
 * In-memory store for pre-registration email verification codes.
 * Works in single-instance / local dev. For multi-instance production, swap for Redis.
 */

interface CodeEntry {
  code: string;
  expiresAt: Date;
}

// Module-level singleton (persists across hot-reloads in Next.js dev)
const globalForStore = globalThis as unknown as { _registerCodeStore?: Map<string, CodeEntry> };
const store: Map<string, CodeEntry> = globalForStore._registerCodeStore ??= new Map();

export function setCode(email: string, code: string, ttlMs = 10 * 60 * 1000) {
  store.set(email.toLowerCase(), { code, expiresAt: new Date(Date.now() + ttlMs) });
}

export function verifyCode(email: string, code: string): boolean {
  const entry = store.get(email.toLowerCase());
  if (!entry) return false;
  if (entry.expiresAt < new Date()) {
    store.delete(email.toLowerCase());
    return false;
  }
  if (entry.code !== code) return false;
  store.delete(email.toLowerCase()); // consume
  return true;
}
