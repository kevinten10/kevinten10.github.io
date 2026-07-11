import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { cleanText, newId, normalizeVisitorKey } from '../lib/ids';
import { fail, ok } from '../lib/http';
import { checkRateLimit } from '../lib/rate-limit';

export const reactionRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

reactionRoutes.post('/', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const authUser = c.get('authUser');
  const visitorKey = authUser?.userId || normalizeVisitorKey(body.visitorId);
  if (!visitorKey) return fail(c, 400, 'visitorId is required');
  if (!await checkRateLimit(c.env, `react:${visitorKey}`, 30, 60)) return fail(c, 429, 'Too many reactions');

  const targetType = cleanText(body.targetType, 20);
  const targetId = cleanText(body.targetId, 120);
  const reactionType = cleanText(body.reactionType || 'like', 40);
  if (!['comment', 'page', 'reward'].includes(targetType) || !targetId) return fail(c, 400, 'Invalid reaction target');

  const id = newId('rct');
  const actorKey = authUser?.userId ? `user:${authUser.userId}` : `visitor:${visitorKey}`;
  await c.env.DB.prepare('insert or ignore into reactions (id, target_type, target_id, reaction_type, user_id, visitor_key, actor_key) values (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, targetType, targetId, reactionType, authUser?.userId || null, visitorKey, actorKey)
    .run();
  return ok(c, { id, targetType, targetId, reactionType }, 201);
});
