import { describe, expect, it } from 'vitest';
import { checkRateLimit } from '../src/lib/rate-limit';
import type { Env } from '../src/types';
import { MemoryKV } from './helpers';

describe('KV rate limiting', () => {
  it('allows requests until the key reaches the configured window limit', async () => {
    const env = { SITE_KV: new MemoryKV() } as unknown as Env;

    await expect(checkRateLimit(env, 'visitor-1', 2, 60)).resolves.toBe(true);
    await expect(checkRateLimit(env, 'visitor-1', 2, 60)).resolves.toBe(true);
    await expect(checkRateLimit(env, 'visitor-1', 2, 60)).resolves.toBe(false);
  });

  it('keeps independent counters for independent keys', async () => {
    const env = { SITE_KV: new MemoryKV() } as unknown as Env;

    await expect(checkRateLimit(env, 'visitor-a', 1, 60)).resolves.toBe(true);
    await expect(checkRateLimit(env, 'visitor-a', 1, 60)).resolves.toBe(false);
    await expect(checkRateLimit(env, 'visitor-b', 1, 60)).resolves.toBe(true);
  });
});
