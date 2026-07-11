import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { fail, ok } from '../lib/http';
import { verifyStripeSignature } from '../lib/stripe';
import { nowIso } from '../lib/ids';

export const webhookRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function amountFromCents(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value / 100;
}

webhookRoutes.post('/stripe', async (c) => {
  const signature = c.req.header('stripe-signature') || '';
  const payload = await c.req.text();
  const secret = c.env.STRIPE_WEBHOOK_SECRET || '';
  if (!await verifyStripeSignature(signature, payload, secret)) return fail(c, 400, 'Invalid Stripe signature');

  let event: JsonRecord;
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!isRecord(parsed)) return fail(c, 400, 'Invalid Stripe payload');
    event = parsed;
  } catch {
    return fail(c, 400, 'Invalid Stripe payload');
  }

  if (event.livemode === true) return fail(c, 400, 'Live Stripe events are disabled');

  if (event.type === 'checkout.session.completed') {
    const data = isRecord(event.data) ? event.data : {};
    const session = isRecord(data.object) ? data.object : {};
    if (session.payment_status !== 'paid') return ok(c, { received: true, ignored: 'unpaid' });
    const metadata = isRecord(session.metadata) ? session.metadata : {};
    const rewardId = stringValue(metadata.reward_id) || stringValue(session.client_reference_id);
    if (rewardId) {
      const reward = await c.env.DB.prepare('select id, amount, currency, status from rewards where id = ?').bind(rewardId).first<{
        id: string;
        amount: number | null;
        currency: string | null;
        status: string;
      }>();
      if (!reward || !['pending', 'approved'].includes(reward.status)) return ok(c, { received: true, ignored: 'reward_not_pending' });
      const paidAmount = amountFromCents(session.amount_total);
      const paidCurrency = stringValue(session.currency).toUpperCase() || null;
      if (reward.amount !== null && paidAmount === null) return ok(c, { received: true, ignored: 'amount_missing' });
      if (reward.amount !== null && Number(reward.amount) !== paidAmount) return ok(c, { received: true, ignored: 'amount_mismatch' });
      if (reward.currency && !paidCurrency) return ok(c, { received: true, ignored: 'currency_missing' });
      if (reward.currency && reward.currency.toUpperCase() !== paidCurrency) return ok(c, { received: true, ignored: 'currency_mismatch' });
      await c.env.DB.prepare('update rewards set provider = ?, provider_order_id = ?, amount = ?, currency = ?, status = ?, verified_at = ?, updated_at = ? where id = ?')
        .bind('stripe_sandbox', stringValue(session.id) || null, paidAmount, paidCurrency, 'verified', nowIso(), nowIso(), rewardId)
        .run();
    }
  }
  return ok(c, { received: true });
});
