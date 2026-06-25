import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { cleanText, nowIso } from '../lib/ids';
import { fail, ok } from '../lib/http';
import { requireAuth } from '../lib/auth';

export const userRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

userRoutes.use('*', requireAuth);

userRoutes.get('/profile', async (c) => {
  const user = c.get('authUser');
  const row = await c.env.DB.prepare('select id, email, display_name, avatar_url, role, created_at from users where id = ?')
    .bind(user?.userId)
    .first();
  return ok(c, row || null);
});

userRoutes.patch('/profile', async (c) => {
  const user = c.get('authUser');
  const body = await c.req.json<Record<string, unknown>>();
  const displayName = cleanText(body.displayName, 80);
  if (!displayName) return fail(c, 400, 'displayName is required');
  await c.env.DB.prepare('update users set display_name = ?, updated_at = ? where id = ?')
    .bind(displayName, nowIso(), user?.userId)
    .run();
  return ok(c, { displayName });
});
