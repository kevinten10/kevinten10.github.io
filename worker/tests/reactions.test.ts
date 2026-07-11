import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { reactionRoutes } from '../src/routes/reactions';
import type { Env, Variables } from '../src/types';
import { MemoryKV } from './helpers';

class RecordingD1 {
  params: unknown[] = [];

  prepare() {
    return {
      bind: (...params: unknown[]) => ({
        run: async () => {
          this.params = params;
          return {};
        }
      })
    };
  }
}

function buildApp(env: Partial<Env>) {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  app.route('/api/reactions', reactionRoutes);
  return {
    request: (path: string, init?: RequestInit) => app.request(path, init, env as Env)
  };
}

describe('reaction routes', () => {
  it('stores a non-null actor key for anonymous reaction de-duping', async () => {
    const db = new RecordingD1();
    const app = buildApp({
      DB: db as unknown as D1Database,
      SITE_KV: new MemoryKV() as unknown as KVNamespace
    });

    const response = await app.request('/api/reactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        visitorId: 'visitor123',
        targetType: 'page',
        targetId: '/',
        reactionType: 'like'
      })
    });

    expect(response.status).toBe(201);
    expect(db.params).toContain('visitor:visitor123');
  });
});
