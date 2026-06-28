import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { cleanText, newId, normalizeVisitorKey, nowIso, todayUtc } from '../lib/ids';
import { fail, ok } from '../lib/http';
import { checkRateLimit } from '../lib/rate-limit';

export const statsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const uniqueVisitorSql = 'count(distinct coalesce(user_id, visitor_key, session_id, id))';

statsRoutes.post('/view', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const sessionId = cleanText(body.sessionId, 120);
  if (!sessionId) return fail(c, 400, 'sessionId is required');
  if (!await checkRateLimit(c.env, `stats:${sessionId}`, 20, 60)) return ok(c, { tracked: false, reason: 'rate_limited' });
  const pagePath = cleanText(body.pagePath || body.page || '/', 300) || '/';
  const visitorKey = normalizeVisitorKey(body.visitorId);
  const createdAt = nowIso();
  await c.env.DB.prepare('insert into page_views (id, page_path, session_id, user_id, visitor_key, referrer, user_agent, ip_hash, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(newId('pv'), pagePath, sessionId, c.get('authUser')?.userId || null, visitorKey || null, cleanText(body.referrer, 500) || null, cleanText(body.userAgent, 500) || null, null, createdAt)
    .run();
  let queued = false;
  if (c.env.EVENTS_QUEUE) {
    try {
      await c.env.EVENTS_QUEUE.send({ type: 'page_view', pagePath, sessionId, visitorKey: visitorKey || undefined, createdAt });
      queued = true;
    } catch (err) {
      queued = false;
    }
  }
  if (!queued) await incrementPageViewStats(c.env, pagePath, createdAt);
  return ok(c, { tracked: true });
});

statsRoutes.get('/public', async (c) => {
  const pagePath = cleanText(c.req.query('page') || '/', 300) || '/';
  const cacheKey = `public_stats:${pagePath}`;
  const cached = await c.env.SITE_KV.get(cacheKey, 'json');
  if (cached) return ok(c, cached);

  const pageStats = await c.env.DB.prepare('select page_path, pv, uv, comments_count, rewards_count from page_stats where page_path = ?').bind(pagePath).first<{
    page_path: string;
    pv: number;
    uv: number;
    comments_count: number;
    rewards_count: number;
  }>();
  const rawStats = await c.env.DB.prepare(`select count(*) as pv, ${uniqueVisitorSql} as uv from page_views where page_path = ?`).bind(pagePath).first<{ pv: number; uv: number }>();
  const siteStats = await c.env.DB.prepare(`select count(*) as pv, ${uniqueVisitorSql} as uv from page_views`).first<{ pv: number; uv: number }>();
  const comments = await c.env.DB.prepare("select count(*) as count from comments where status = 'approved'").first<{ count: number }>();
  const rewards = await c.env.DB.prepare("select count(*) as count from rewards where status in ('approved', 'verified')").first<{ count: number }>();
  const page = {
    page_path: pagePath,
    pv: Math.max(Number(pageStats?.pv || 0), Number(rawStats?.pv || 0)),
    uv: Number(rawStats?.uv || pageStats?.uv || 0),
    comments_count: Number(pageStats?.comments_count || 0),
    rewards_count: Number(pageStats?.rewards_count || 0)
  };
  const data = {
    page,
    site: {
      pv: Number(siteStats?.pv || page.pv || 0),
      uv: Number(siteStats?.uv || page.uv || 0)
    },
    totalComments: Number(comments?.count || 0),
    supporterCount: Number(rewards?.count || 0)
  };
  await c.env.SITE_KV.put(cacheKey, JSON.stringify(data), { expirationTtl: 60 });
  return ok(c, data);
});

async function incrementPageViewStats(env: Env, pagePath: string, createdAt: string): Promise<void> {
  const date = todayUtc();
  await env.DB.prepare('insert into page_stats (page_path, pv, uv, updated_at) values (?, 1, 1, ?) on conflict(page_path) do update set pv = pv + 1, uv = uv + 1, updated_at = ?')
    .bind(pagePath, createdAt, createdAt)
    .run();
  await env.DB.prepare('insert into daily_stats (stat_date, page_path, pv, uv, updated_at) values (?, ?, 1, 1, ?) on conflict(stat_date, page_path) do update set pv = pv + 1, uv = uv + 1, updated_at = ?')
    .bind(date, pagePath, createdAt, createdAt)
    .run();
}
