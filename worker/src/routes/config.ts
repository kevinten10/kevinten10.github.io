import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { ok } from '../lib/http';
import { getPublicSiteConfig } from '../lib/site-config';

export const configRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

configRoutes.get('/', async (c) => {
  return ok(c, await getPublicSiteConfig(c.env));
});
