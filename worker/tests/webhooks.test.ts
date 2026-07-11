import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { webhookRoutes } from '../src/routes/webhooks';
import { computeStripeSignature } from '../src/lib/stripe';
import type { Env, Variables } from '../src/types';

class RewardD1 {
  updates = 0;
  params: unknown[] = [];

  prepare(sql: string) {
    return {
      bind: (...params: unknown[]) => ({
        first: async () => {
          if (sql.includes('select id, amount, currency, status from rewards')) {
            return { id: params[0], amount: 25, currency: 'USD', status: 'pending' };
          }
          return null;
        },
        run: async () => {
          if (sql.includes('update rewards set')) this.updates += 1;
          this.params = params;
          return { meta: { changes: 1 } };
        }
      })
    };
  }
}

function buildApp(env: Partial<Env>) {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  app.route('/api/webhooks', webhookRoutes);
  return {
    request: (path: string, init?: RequestInit) => app.request(path, init, env as Env)
  };
}

async function stripeRequest(app: ReturnType<typeof buildApp>, payload: Record<string, unknown>, secret = 'whsec_test') {
  const body = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await computeStripeSignature(secret, timestamp, body);
  return app.request('/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': `t=${timestamp},v1=${signature}`
    },
    body
  });
}

describe('stripe webhook route', () => {
  it('does not verify rewards for unpaid checkout sessions', async () => {
    const db = new RewardD1();
    const app = buildApp({
      DB: db as unknown as D1Database,
      STRIPE_WEBHOOK_SECRET: 'whsec_test'
    });

    const response = await stripeRequest(app, {
      id: 'evt_unpaid',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_unpaid',
          payment_status: 'unpaid',
          client_reference_id: 'rwd_test',
          amount_total: 2500,
          currency: 'usd'
        }
      }
    });

    expect(response.status).toBe(200);
    expect(db.updates).toBe(0);
  });

  it('verifies matching paid checkout sessions', async () => {
    const db = new RewardD1();
    const app = buildApp({
      DB: db as unknown as D1Database,
      STRIPE_WEBHOOK_SECRET: 'whsec_test'
    });

    const response = await stripeRequest(app, {
      id: 'evt_paid',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_paid',
          payment_status: 'paid',
          client_reference_id: 'rwd_test',
          amount_total: 2500,
          currency: 'usd'
        }
      }
    });

    expect(response.status).toBe(200);
    expect(db.updates).toBe(1);
    expect(db.params).toEqual(expect.arrayContaining(['stripe_sandbox', 'cs_paid', 25, 'USD', 'verified']));
  });

  it('rejects signed live-mode Stripe events', async () => {
    const db = new RewardD1();
    const app = buildApp({
      DB: db as unknown as D1Database,
      STRIPE_WEBHOOK_SECRET: 'whsec_test'
    });

    const response = await stripeRequest(app, {
      id: 'evt_live',
      livemode: true,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_live',
          payment_status: 'paid',
          client_reference_id: 'rwd_test',
          amount_total: 2500,
          currency: 'usd'
        }
      }
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      error: 'Live Stripe events are disabled'
    });
    expect(db.updates).toBe(0);
  });

  it('does not verify rewards when Stripe omits the paid amount', async () => {
    const db = new RewardD1();
    const app = buildApp({
      DB: db as unknown as D1Database,
      STRIPE_WEBHOOK_SECRET: 'whsec_test'
    });

    const response = await stripeRequest(app, {
      id: 'evt_missing_amount',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_missing_amount',
          payment_status: 'paid',
          client_reference_id: 'rwd_test',
          currency: 'usd'
        }
      }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { received: true, ignored: 'amount_missing' }
    });
    expect(db.updates).toBe(0);
  });

  it('does not verify rewards when Stripe omits the paid currency', async () => {
    const db = new RewardD1();
    const app = buildApp({
      DB: db as unknown as D1Database,
      STRIPE_WEBHOOK_SECRET: 'whsec_test'
    });

    const response = await stripeRequest(app, {
      id: 'evt_missing_currency',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_missing_currency',
          payment_status: 'paid',
          client_reference_id: 'rwd_test',
          amount_total: 2500
        }
      }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { received: true, ignored: 'currency_missing' }
    });
    expect(db.updates).toBe(0);
  });
});
