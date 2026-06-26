import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { webhookRoutes } from '../src/routes/webhooks';
import { computeStripeSignature } from '../src/lib/stripe';
import type { Env, Variables } from '../src/types';

class RewardD1 {
  updates = 0;

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
  });
});
