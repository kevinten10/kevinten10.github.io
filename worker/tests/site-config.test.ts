import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { configRoutes } from '../src/routes/config';
import { adminRoutes } from '../src/routes/admin';
import type { AuthUser, Env, Variables } from '../src/types';
import { MemoryKV } from './helpers';

function buildApp(env: Partial<Env>, authUser?: AuthUser) {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  app.route('/api/config', configRoutes);
  if (authUser) {
    app.use('/api/admin/*', async (c, next) => {
      c.set('authUser', authUser);
      await next();
    });
  }
  app.route('/api/admin', adminRoutes);
  return {
    request: (path: string, init?: RequestInit) => {
      return app.request(path, init, env as Env);
    }
  };
}

describe('site config routes', () => {
  it('returns default public site config from KV when unset', async () => {
    const app = buildApp({
      SITE_KV: new MemoryKV() as unknown as KVNamespace,
      ADMIN_EMAILS: 'admin@example.com'
    });

    const response = await app.request('/api/config');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        commentsEnabled: true,
        rewardsEnabled: true,
        publicStatsEnabled: true,
        rewardCurrency: 'CNY',
        rewardMessage: ''
      }
    });
  });

  it('lets an admin update public site config stored in KV', async () => {
    const app = buildApp({
      SITE_KV: new MemoryKV() as unknown as KVNamespace,
      ADMIN_EMAILS: 'admin@example.com'
    }, {
      sub: 'auth0|admin',
      email: 'admin@example.com',
      role: 'admin',
      userId: 'usr_admin'
    });

    const update = await app.request('/api/admin/config', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        commentsEnabled: false,
        rewardsEnabled: true,
        publicStatsEnabled: false,
        rewardCurrency: 'usd',
        rewardMessage: 'Thanks for supporting the site'
      })
    });
    const response = await app.request('/api/config');

    expect(update.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        commentsEnabled: false,
        rewardsEnabled: true,
        publicStatsEnabled: false,
        rewardCurrency: 'USD',
        rewardMessage: 'Thanks for supporting the site'
      }
    });
  });

  it('rejects spoofed Cloudflare Access email headers without an authenticated admin context', async () => {
    const app = buildApp({
      SITE_KV: new MemoryKV() as unknown as KVNamespace,
      ADMIN_EMAILS: 'admin@example.com'
    });

    const response = await app.request('/api/admin/config', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'cf-access-authenticated-user-email': 'admin@example.com'
      },
      body: JSON.stringify({ publicStatsEnabled: false })
    });

    expect(response.status).toBe(403);
  });
});
