import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { cleanText, newId, normalizeVisitorKey, nowIso } from '../lib/ids';
import { fail, ok } from '../lib/http';
import { moderateReward } from '../lib/moderation';
import { checkRateLimit } from '../lib/rate-limit';

export const rewardRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

rewardRoutes.get('/', async (c) => {
  const rows = await c.env.DB.prepare(
    "select id, display_name, message, amount, currency, provider, status, verified_at, created_at from rewards where status in ('approved', 'verified') order by created_at desc limit 30"
  ).all();
  return ok(c, rows.results || []);
});

rewardRoutes.post('/', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const authUser = c.get('authUser');
  const visitorKey = authUser?.userId || normalizeVisitorKey(body.visitorId);
  if (!visitorKey) return fail(c, 400, 'visitorId is required');
  if (!await checkRateLimit(c.env, `rewards:${visitorKey}`, 5, 300)) return fail(c, 429, 'Too many reward submissions');

  const displayName = cleanText(body.displayName || body.nickname || authUser?.name || 'Supporter', 80) || 'Supporter';
  const message = cleanText(body.message, 300);
  const currency = cleanText(body.currency || 'CNY', 8).toUpperCase() || 'CNY';
  const amountValue = body.amount === undefined || body.amount === null || body.amount === '' ? null : Number(body.amount);
  if (amountValue !== null && (!Number.isFinite(amountValue) || amountValue < 0)) return fail(c, 400, 'Invalid amount');

  const decision = moderateReward({ message });
  const id = newId('rwd');
  const createdAt = nowIso();
  await c.env.DB.prepare(
    'insert into rewards (id, user_id, visitor_key, display_name, message, amount, currency, provider, status, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, authUser?.userId || null, visitorKey, displayName, message || null, amountValue, currency, 'manual_qr', decision.status, createdAt, createdAt).run();
  await c.env.EVENTS_QUEUE?.send({ type: 'reward_created', rewardId: id, status: decision.status, createdAt });
  return ok(c, { id, status: decision.status }, 201);
});
