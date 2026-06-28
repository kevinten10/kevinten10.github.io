import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { rewardRoutes } from '../src/routes/rewards';
import type { Env, Variables } from '../src/types';
import { MemoryKV } from './helpers';

class RecordingD1 {
  params: unknown[] = [];
  runs = 0;

  prepare() {
    return {
      bind: (...params: unknown[]) => ({
        run: async () => {
          this.params = params;
          this.runs += 1;
          return {};
        },
        all: async () => ({ results: [] })
      }),
      all: async () => ({ results: [] })
    };
  }
}

function buildApp(env: Partial<Env>) {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  app.route('/api/rewards', rewardRoutes);
  return {
    request: (path: string, init?: RequestInit) => app.request(path, init, env as Env)
  };
}

describe('reward routes', () => {
  it('stores the selected manual QR provider for support records', async () => {
    const db = new RecordingD1();
    const queue = { send: vi.fn().mockResolvedValue(undefined) };
    const app = buildApp({
      DB: db as unknown as D1Database,
      SITE_KV: new MemoryKV() as unknown as KVNamespace,
      EVENTS_QUEUE: queue as unknown as Queue
    });

    const response = await app.request('/api/rewards', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        visitorId: 'visitor123',
        displayName: 'Kevin',
        amount: '20',
        currency: 'CNY',
        provider: 'alipay_qr',
        message: 'Thanks'
      })
    });
    const body = await response.json() as { data: { provider: string; status: string } };

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({ provider: 'alipay_qr', status: 'pending' });
    expect(db.params).toEqual(expect.arrayContaining(['alipay_qr', 20, 'CNY', 'Kevin']));
    expect(queue.send).toHaveBeenCalledWith(expect.objectContaining({ type: 'reward_created', status: 'pending' }));
  });

  it('rejects unknown reward providers', async () => {
    const db = new RecordingD1();
    const app = buildApp({
      DB: db as unknown as D1Database,
      SITE_KV: new MemoryKV() as unknown as KVNamespace
    });

    const response = await app.request('/api/rewards', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        visitorId: 'visitor456',
        displayName: 'Kevin',
        provider: 'personal_listener'
      })
    });

    expect(response.status).toBe(400);
    expect(db.runs).toBe(0);
  });
});
