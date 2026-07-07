import { afterEach, describe, expect, it, vi } from 'vitest';
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
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it('returns a configuration error when Stripe sandbox checkout is not configured', async () => {
    const db = new RecordingD1();
    const app = buildApp({
      DB: db as unknown as D1Database,
      SITE_KV: new MemoryKV() as unknown as KVNamespace
    });

    const response = await app.request('/api/rewards/stripe/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        visitorId: 'visitor789',
        displayName: 'Kevin',
        amount: '12.34',
        currency: 'USD',
        message: 'Embedded checkout please'
      })
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      success: false,
      error: 'Stripe sandbox checkout is not configured'
    });
    expect(db.runs).toBe(0);
  });

  it('creates a pending reward and sandbox embedded Checkout Session', async () => {
    const db = new RecordingD1();
    const queue = { send: vi.fn().mockResolvedValue(undefined) };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'cs_test_123',
      client_secret: 'cs_test_secret_123'
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));
    vi.stubGlobal('fetch', fetchMock);
    const app = buildApp({
      DB: db as unknown as D1Database,
      SITE_KV: new MemoryKV() as unknown as KVNamespace,
      EVENTS_QUEUE: queue as unknown as Queue,
      STRIPE_SECRET_KEY: 'sk_test_123',
      SITE_ORIGIN: 'https://kevinten-interactive-preview.pages.dev'
    });

    const response = await app.request('/api/rewards/stripe/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://kevinten-interactive-preview.pages.dev'
      },
      body: JSON.stringify({
        visitorId: 'visitor789',
        displayName: 'Kevin',
        amount: '12.34',
        currency: 'USD',
        message: 'Embedded checkout please'
      })
    });
    const body = await response.json() as {
      data: { clientSecret: string; rewardId: string; provider: string; status: string }
    };

    expect(response.status).toBe(201);
    expect(body.data.clientSecret).toBe('cs_test_secret_123');
    expect(body.data.rewardId).toMatch(/^rwd_/);
    expect(body.data).toMatchObject({ provider: 'stripe_sandbox', status: 'pending' });
    expect(db.params).toEqual(expect.arrayContaining([
      body.data.rewardId,
      'visitor789',
      'Kevin',
      'Embedded checkout please',
      12.34,
      'USD',
      'stripe_sandbox',
      'pending'
    ]));
    expect(queue.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'reward_created',
      rewardId: body.data.rewardId,
      status: 'pending'
    }));
    expect(fetchMock).toHaveBeenCalledWith('https://api.stripe.com/v1/checkout/sessions', expect.objectContaining({
      method: 'POST'
    }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk_test_123');
    expect(headers['Stripe-Version']).toBe('2026-02-25.clover');
    const params = new URLSearchParams(String(init.body));
    expect(params.get('ui_mode')).toBe('embedded_page');
    expect(params.get('mode')).toBe('payment');
    expect(params.get('submit_type')).toBe('donate');
    expect(params.get('client_reference_id')).toBe(body.data.rewardId);
    expect(params.get('metadata[reward_id]')).toBe(body.data.rewardId);
    expect(params.get('line_items[0][price_data][currency]')).toBe('usd');
    expect(params.get('line_items[0][price_data][unit_amount]')).toBe('1234');
    expect(params.get('return_url')).toBe('https://kevinten-interactive-preview.pages.dev/?stripe_session_id={CHECKOUT_SESSION_ID}#rewards');
  });
});
