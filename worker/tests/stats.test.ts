import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { statsRoutes } from '../src/routes/stats';
import type { Env, Variables } from '../src/types';
import { MemoryKV } from './helpers';

type Execution = {
  sql: string;
  params: unknown[];
};

class RecordingD1 {
  readonly executions: Execution[] = [];
  readonly firstResults: unknown[];

  constructor(firstResults: unknown[] = []) {
    this.firstResults = firstResults;
  }

  prepare(sql: string) {
    const executions = this.executions;
    const firstResults = this.firstResults;
    return {
      bind: (...params: unknown[]) => ({
        run: async () => {
          executions.push({ sql, params });
          return {};
        },
        first: async () => firstResults.shift() || null
      }),
      first: async () => firstResults.shift() || null
    };
  }
}

function buildApp(env: Partial<Env>) {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  app.route('/api/stats', statsRoutes);
  return {
    request: (path: string, init?: RequestInit) => app.request(path, init, env as Env)
  };
}

describe('stats routes', () => {
  it('does not double-count page stats locally when a queue accepts the page view', async () => {
    const db = new RecordingD1();
    const queue = { send: vi.fn().mockResolvedValue(undefined) };
    const app = buildApp({
      DB: db as unknown as D1Database,
      SITE_KV: new MemoryKV() as unknown as KVNamespace,
      EVENTS_QUEUE: queue as unknown as Queue
    });

    const response = await app.request('/api/stats/view', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-123',
        pagePath: '/hello',
        visitorId: 'visitor123'
      })
    });

    expect(response.status).toBe(200);
    expect(queue.send).toHaveBeenCalledOnce();
    expect(db.executions.some((entry) => entry.sql.includes('insert into page_stats'))).toBe(false);
  });

  it('falls back to a direct page stats update when queue send fails', async () => {
    const db = new RecordingD1();
    const queue = { send: vi.fn().mockRejectedValue(new Error('queue unavailable')) };
    const app = buildApp({
      DB: db as unknown as D1Database,
      SITE_KV: new MemoryKV() as unknown as KVNamespace,
      EVENTS_QUEUE: queue as unknown as Queue
    });

    const response = await app.request('/api/stats/view', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-456',
        pagePath: '/fallback',
        visitorId: 'visitor456'
      })
    });

    expect(response.status).toBe(200);
    expect(db.executions.some((entry) => entry.sql.includes('insert into page_stats'))).toBe(true);
    expect(db.executions.some((entry) => entry.sql.includes('uv = uv + 1'))).toBe(true);
  });

  it('falls back to raw page views when public aggregate stats lag behind the queue', async () => {
    const db = new RecordingD1([
      { page_path: '/lagging', pv: 0, uv: 0, comments_count: 0, rewards_count: 0 },
      { pv: 1, uv: 1 },
      { count: 0 },
      { count: 0 }
    ]);
    const app = buildApp({
      DB: db as unknown as D1Database,
      SITE_KV: new MemoryKV() as unknown as KVNamespace
    });

    const response = await app.request('/api/stats/public?page=%2Flagging');
    const body = await response.json() as { data: { page: { pv: number; uv: number } } };

    expect(response.status).toBe(200);
    expect(body.data.page.pv).toBe(1);
    expect(body.data.page.uv).toBe(1);
  });
});
