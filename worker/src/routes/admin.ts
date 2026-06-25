import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { fail, ok } from '../lib/http';
import { cleanText, newId, nowIso } from '../lib/ids';
import { requireAdmin } from '../lib/auth';
import { setPublicSiteConfig } from '../lib/site-config';

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminRoutes.use('*', requireAdmin);

adminRoutes.get('/summary', async (c) => {
  const [pendingComments, pendingRewards, approvedComments, supporters] = await Promise.all([
    c.env.DB.prepare("select count(*) as count from comments where status = 'pending'").first<{ count: number }>(),
    c.env.DB.prepare("select count(*) as count from rewards where status = 'pending'").first<{ count: number }>(),
    c.env.DB.prepare("select count(*) as count from comments where status = 'approved'").first<{ count: number }>(),
    c.env.DB.prepare("select count(*) as count from rewards where status in ('approved', 'verified')").first<{ count: number }>()
  ]);
  return ok(c, {
    pendingComments: Number(pendingComments?.count || 0),
    pendingRewards: Number(pendingRewards?.count || 0),
    approvedComments: Number(approvedComments?.count || 0),
    supporters: Number(supporters?.count || 0)
  });
});

adminRoutes.get('/comments', async (c) => {
  const status = cleanText(c.req.query('status') || 'pending', 20);
  const rows = await c.env.DB.prepare('select * from comments where status = ? order by created_at desc limit 50').bind(status).all();
  return ok(c, rows.results || []);
});

adminRoutes.patch('/comments/:id', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const status = cleanText(body.status, 20);
  if (!['approved', 'hidden', 'spam'].includes(status)) return fail(c, 400, 'Invalid comment status');
  const id = c.req.param('id');
  await c.env.DB.prepare('update comments set status = ?, moderation_reason = ?, updated_at = ? where id = ?')
    .bind(status, cleanText(body.reason, 200) || null, nowIso(), id)
    .run();
  await c.env.DB.prepare('insert into admin_events (id, actor_user_id, actor_email, target_type, target_id, action, reason) values (?, ?, ?, ?, ?, ?, ?)')
    .bind(newId('evt'), c.get('authUser')?.userId || null, c.get('authUser')?.email || c.req.header('cf-access-authenticated-user-email') || null, 'comment', id, status, cleanText(body.reason, 200) || null)
    .run();
  return ok(c, { id, status });
});

adminRoutes.get('/rewards', async (c) => {
  const status = cleanText(c.req.query('status') || 'pending', 20);
  const rows = await c.env.DB.prepare('select * from rewards where status = ? order by created_at desc limit 50').bind(status).all();
  return ok(c, rows.results || []);
});

adminRoutes.patch('/rewards/:id', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const status = cleanText(body.status, 20);
  if (!['approved', 'verified', 'hidden'].includes(status)) return fail(c, 400, 'Invalid reward status');
  const id = c.req.param('id');
  const verifiedAt = status === 'verified' ? nowIso() : null;
  await c.env.DB.prepare('update rewards set status = ?, verified_at = coalesce(?, verified_at), updated_at = ? where id = ?')
    .bind(status, verifiedAt, nowIso(), id)
    .run();
  await c.env.DB.prepare('insert into admin_events (id, actor_user_id, actor_email, target_type, target_id, action, reason) values (?, ?, ?, ?, ?, ?, ?)')
    .bind(newId('evt'), c.get('authUser')?.userId || null, c.get('authUser')?.email || c.req.header('cf-access-authenticated-user-email') || null, 'reward', id, status, cleanText(body.reason, 200) || null)
    .run();
  return ok(c, { id, status });
});

adminRoutes.patch('/config', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const config = await setPublicSiteConfig(c.env, body);
  await c.env.DB?.prepare('insert into admin_events (id, actor_user_id, actor_email, target_type, target_id, action, reason) values (?, ?, ?, ?, ?, ?, ?)')
    .bind(newId('evt'), c.get('authUser')?.userId || null, c.get('authUser')?.email || c.req.header('cf-access-authenticated-user-email') || null, 'site_config', 'public', 'updated', null)
    .run();
  return ok(c, config);
});
