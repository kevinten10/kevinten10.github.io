import { Hono } from 'hono';
import type { Env, Variables, QueueEvent } from './types';
import { corsHeaders, ok } from './lib/http';
import { optionalAuth } from './lib/auth';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { commentRoutes } from './routes/comments';
import { reactionRoutes } from './routes/reactions';
import { rewardRoutes } from './routes/rewards';
import { statsRoutes } from './routes/stats';
import { adminRoutes } from './routes/admin';
import { webhookRoutes } from './routes/webhooks';
import { configRoutes } from './routes/config';
import { handleQueue } from './queue';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || null;
  if (c.req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  await next();
  Object.entries(corsHeaders(origin)).forEach(([key, value]) => c.res.headers.set(key, value));
});

app.use('/api/*', optionalAuth);

app.get('/health', (c) => ok(c, { status: 'ok' }));
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/comments', commentRoutes);
app.route('/api/reactions', reactionRoutes);
app.route('/api/rewards', rewardRoutes);
app.route('/api/stats', statsRoutes);
app.route('/api/config', configRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/webhooks', webhookRoutes);

app.notFound((c) => c.json({ success: false, error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ success: false, error: 'Internal error' }, 500);
});

export default {
  fetch: app.fetch,
  queue: async (batch: MessageBatch<QueueEvent>, env: Env) => handleQueue(batch, env)
};

export { app };
