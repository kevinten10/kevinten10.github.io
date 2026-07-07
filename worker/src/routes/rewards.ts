import { Hono } from 'hono';
import type { AuthUser, Env, Variables } from '../types';
import { cleanText, newId, normalizeVisitorKey, nowIso } from '../lib/ids';
import { fail, ok } from '../lib/http';
import { moderateReward } from '../lib/moderation';
import { checkRateLimit } from '../lib/rate-limit';

export const rewardRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const rewardProviders = new Set(['manual_qr', 'wechat_qr', 'alipay_qr']);
const stripeProvider = 'stripe_sandbox';
const stripeApiVersion = '2026-02-25.clover';

type PreparedReward = {
  id: string;
  userId: string | null;
  visitorKey: string;
  displayName: string;
  message: string;
  amountValue: number | null;
  currency: string;
  provider: string;
  status: 'approved' | 'pending';
  createdAt: string;
};

type PreparedRewardResult =
  | { reward: PreparedReward }
  | { error: { status: number; message: string } };

function prepareReward(
  body: Record<string, unknown>,
  authUser: AuthUser | undefined,
  provider: string,
  options: { defaultCurrency?: string; requireAmount?: boolean } = {}
): PreparedRewardResult {
  const visitorKey = authUser?.userId || normalizeVisitorKey(body.visitorId);
  if (!visitorKey) return { error: { status: 400, message: 'visitorId is required' } };

  const displayName = cleanText(body.displayName || body.nickname || authUser?.name || 'Supporter', 80) || 'Supporter';
  const message = cleanText(body.message, 300);
  const currency = cleanText(body.currency || options.defaultCurrency || 'CNY', 8).toUpperCase() || options.defaultCurrency || 'CNY';
  const amountValue = body.amount === undefined || body.amount === null || body.amount === '' ? null : Number(body.amount);
  if (amountValue === null && options.requireAmount) return { error: { status: 400, message: 'Amount is required' } };
  if (amountValue !== null && (!Number.isFinite(amountValue) || amountValue < 0 || (options.requireAmount && amountValue <= 0))) {
    return { error: { status: 400, message: 'Invalid amount' } };
  }

  const decision = moderateReward({ message });
  const createdAt = nowIso();
  return {
    reward: {
      id: newId('rwd'),
      userId: authUser?.userId || null,
      visitorKey,
      displayName,
      message,
      amountValue,
      currency,
      provider,
      status: decision.status,
      createdAt
    }
  };
}

async function insertReward(env: Env, reward: PreparedReward, providerOrderId: string | null = null): Promise<void> {
  await env.DB.prepare(
    'insert into rewards (id, user_id, visitor_key, display_name, message, amount, currency, provider, provider_order_id, status, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    reward.id,
    reward.userId,
    reward.visitorKey,
    reward.displayName,
    reward.message || null,
    reward.amountValue,
    reward.currency,
    reward.provider,
    providerOrderId,
    reward.status,
    reward.createdAt,
    reward.createdAt
  ).run();
  await env.EVENTS_QUEUE?.send({ type: 'reward_created', rewardId: reward.id, status: reward.status, createdAt: reward.createdAt });
}

function stripeSecret(env: Env): string {
  return cleanText(env.STRIPE_SECRET_KEY, 256);
}

function isStripeSandboxSecret(secret: string): boolean {
  return secret.startsWith('sk_test_') || secret.startsWith('rk_test_');
}

function stripeMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

function safeOrigin(value: string | undefined | null): string {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function stripeReturnUrl(env: Env, requestOrigin: string | null): string {
  const origin = safeOrigin(requestOrigin) || safeOrigin(env.SITE_ORIGIN) || 'https://kevinten.com';
  return `${origin}/?stripe_session_id={CHECKOUT_SESSION_ID}#rewards`;
}

async function createStripeCheckoutSession(
  env: Env,
  reward: PreparedReward,
  requestOrigin: string | null
): Promise<{ id: string; clientSecret: string } | null> {
  if (reward.amountValue === null) return null;
  const params = new URLSearchParams();
  params.set('ui_mode', 'embedded_page');
  params.set('mode', 'payment');
  params.set('submit_type', 'donate');
  params.set('return_url', stripeReturnUrl(env, requestOrigin));
  params.set('client_reference_id', reward.id);
  params.set('metadata[reward_id]', reward.id);
  params.set('metadata[visitor_key]', reward.visitorKey);
  params.set('metadata[display_name]', reward.displayName);
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', reward.currency.toLowerCase());
  params.set('line_items[0][price_data][unit_amount]', String(stripeMinorUnits(reward.amountValue)));
  params.set('line_items[0][price_data][product_data][name]', 'Support KevinTen');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecret(env)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': env.STRIPE_API_VERSION || stripeApiVersion
    },
    body: params
  });
  const result = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || typeof result.client_secret !== 'string' || typeof result.id !== 'string') return null;
  return { id: result.id, clientSecret: result.client_secret };
}

rewardRoutes.get('/', async (c) => {
  const rows = await c.env.DB.prepare(
    "select id, display_name, message, amount, currency, provider, status, verified_at, created_at from rewards where status in ('approved', 'verified') order by created_at desc limit 30"
  ).all();
  return ok(c, rows.results || []);
});

rewardRoutes.post('/stripe/checkout', async (c) => {
  const secret = stripeSecret(c.env);
  if (!secret) return fail(c, 503, 'Stripe sandbox checkout is not configured');
  if (!isStripeSandboxSecret(secret)) return fail(c, 503, 'Stripe sandbox checkout requires a test secret key');

  const body = await c.req.json<Record<string, unknown>>();
  const authUser = c.get('authUser');
  const prepared = prepareReward(body, authUser, stripeProvider, { defaultCurrency: 'USD', requireAmount: true });
  if ('error' in prepared) return fail(c, prepared.error.status, prepared.error.message);
  if (!await checkRateLimit(c.env, `stripe-rewards:${prepared.reward.visitorKey}`, 5, 300)) return fail(c, 429, 'Too many reward submissions');

  const session = await createStripeCheckoutSession(c.env, prepared.reward, c.req.header('origin') || null);
  if (!session) return fail(c, 502, 'Stripe checkout unavailable');
  await insertReward(c.env, prepared.reward, session.id);
  return ok(c, {
    rewardId: prepared.reward.id,
    clientSecret: session.clientSecret,
    provider: prepared.reward.provider,
    status: prepared.reward.status
  }, 201);
});

rewardRoutes.post('/', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const authUser = c.get('authUser');
  const provider = cleanText(body.provider || 'manual_qr', 24) || 'manual_qr';
  if (!rewardProviders.has(provider)) return fail(c, 400, 'Invalid reward provider');
  const prepared = prepareReward(body, authUser, provider);
  if ('error' in prepared) return fail(c, prepared.error.status, prepared.error.message);
  if (!await checkRateLimit(c.env, `rewards:${prepared.reward.visitorKey}`, 5, 300)) return fail(c, 429, 'Too many reward submissions');

  await insertReward(c.env, prepared.reward);
  return ok(c, { id: prepared.reward.id, status: prepared.reward.status, provider }, 201);
});
