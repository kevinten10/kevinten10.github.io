import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { checkRateLimit } from '../lib/rate-limit';
import { fail, ok } from '../lib/http';
import { cleanText, newId, normalizeVisitorKey, nowIso } from '../lib/ids';
import { moderateComment } from '../lib/moderation';

export const commentRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

async function recentCommentCount(env: Env, key: string): Promise<number> {
  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const result = await env.DB.prepare('select count(*) as count from comments where visitor_key = ? and created_at >= ?')
    .bind(key, cutoff)
    .first<{ count: number }>();
  return Number(result?.count || 0);
}

commentRoutes.get('/', async (c) => {
  const pagePath = cleanText(c.req.query('page') || '/', 300) || '/';
  const rows = await c.env.DB.prepare(
    'select id, page_path, parent_id, author_name, author_website, content, created_at from comments where page_path = ? and status = ? order by created_at asc'
  ).bind(pagePath, 'approved').all();
  return ok(c, rows.results || []);
});

commentRoutes.post('/', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const authUser = c.get('authUser');
  const visitorKey = authUser?.userId || normalizeVisitorKey(body.visitorId) || newId('anon');
  const allowed = await checkRateLimit(c.env, `comments:${visitorKey}`, 6, 60);
  if (!allowed) return fail(c, 429, 'Too many comments. Please wait a moment.');

  const pagePath = cleanText(body.pagePath || body.page || '/', 300) || '/';
  const content = cleanText(body.content, 1000);
  const authorName = cleanText(body.nickname || authUser?.name || 'Visitor', 80) || 'Visitor';
  const website = cleanText(body.website, 200);
  if (!content) return fail(c, 400, 'content is required');

  const decision = moderateComment({
    content,
    recentCount: await recentCommentCount(c.env, visitorKey),
    authenticated: Boolean(authUser)
  });
  const id = newId('cmt');
  const createdAt = nowIso();
  await c.env.DB.prepare(
    'insert into comments (id, page_path, parent_id, user_id, visitor_key, author_name, author_website, content, status, moderation_reason, created_at, updated_at) values (?, ?, null, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, pagePath, authUser?.userId || null, visitorKey, authorName, website || null, content, decision.status, decision.reason || null, createdAt, createdAt).run();

  await c.env.EVENTS_QUEUE?.send({ type: 'comment_created', pagePath, commentId: id, status: decision.status, createdAt });
  return ok(c, { id, status: decision.status, moderationReason: decision.reason }, 201);
});

commentRoutes.post('/:id/replies', async (c) => {
  const parentId = c.req.param('id');
  const parent = await c.env.DB.prepare('select id, page_path from comments where id = ? and status = ?').bind(parentId, 'approved').first<{ id: string; page_path: string }>();
  if (!parent) return fail(c, 404, 'Parent comment not found');
  const body = await c.req.json<Record<string, unknown>>();
  body.pagePath = parent.page_path;
  body.parentId = parentId;

  const authUser = c.get('authUser');
  const visitorKey = authUser?.userId || normalizeVisitorKey(body.visitorId) || newId('anon');
  const content = cleanText(body.content, 1000);
  if (!content) return fail(c, 400, 'content is required');
  const authorName = cleanText(body.nickname || authUser?.name || 'Visitor', 80) || 'Visitor';
  const decision = moderateComment({ content, recentCount: await recentCommentCount(c.env, visitorKey), authenticated: Boolean(authUser) });
  const id = newId('cmt');
  const createdAt = nowIso();
  await c.env.DB.prepare(
    'insert into comments (id, page_path, parent_id, user_id, visitor_key, author_name, content, status, moderation_reason, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, parent.page_path, parentId, authUser?.userId || null, visitorKey, authorName, content, decision.status, decision.reason || null, createdAt, createdAt).run();
  return ok(c, { id, status: decision.status }, 201);
});
