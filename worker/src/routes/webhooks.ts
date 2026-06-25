import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { fail, ok } from '../lib/http';
import { verifyStripeSignature } from '../lib/stripe';
import { nowIso } from '../lib/ids';

export const webhookRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

webhookRoutes.post('/stripe', async (c) => {
  const signature = c.req.header('stripe-signature') || '';
  const payload = await c.req.text();
  const secret = c.env.STRIPE_WEBHOOK_SECRET || '';
  if (!await verifyStripeSignature(signature, payload, secret)) return fail(c, 400, 'Invalid Stripe signature');

  const event = JSON.parse(payload) as { type: string; data?: { object?: Record<string, any> } };
  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object || {};
    const rewardId = session.metadata?.reward_id || session.client_reference_id;
    if (rewardId) {
      await c.env.DB.prepare('update rewards set provider = ?, provider_order_id = ?, amount = ?, currency = ?, status = ?, verified_at = ?, updated_at = ? where id = ?')
        .bind('stripe', session.id || null, session.amount_total ? Number(session.amount_total) / 100 : null, String(session.currency || 'usd').toUpperCase(), 'verified', nowIso(), nowIso(), rewardId)
        .run();
    }
  }
  return ok(c, { received: true });
});
