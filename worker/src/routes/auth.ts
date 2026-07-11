import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { ok } from '../lib/http';

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

authRoutes.get('/me', (c) => {
  const user = c.get('authUser');
  return ok(c, { authenticated: Boolean(user), user: user || null });
});
