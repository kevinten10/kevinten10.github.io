import type { Env } from '../types';

export async function checkRateLimit(env: Env, key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const safeKey = `rate:${key}`;
  const current = Number((await env.SITE_KV.get(safeKey)) || '0');
  if (current >= limit) return false;
  await env.SITE_KV.put(safeKey, String(current + 1), { expirationTtl: windowSeconds });
  return true;
}
