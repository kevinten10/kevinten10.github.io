import type { Env, QueueEvent } from './types';
import { todayUtc, nowIso } from './lib/ids';

export async function handleQueue(batch: MessageBatch<QueueEvent>, env: Env): Promise<void> {
  for (const message of batch.messages) {
    const event = message.body;
    if (event.type === 'page_view') {
      await incrementStats(env, event.pagePath, 'pv');
    }
    if (event.type === 'comment_created' && event.status === 'approved') {
      await incrementStats(env, event.pagePath, 'comments_count');
    }
    if (event.type === 'reward_created' && (event.status === 'approved' || event.status === 'verified')) {
      await incrementStats(env, '/', 'rewards_count');
    }
    message.ack();
  }
}

async function incrementStats(env: Env, pagePath: string, field: 'pv' | 'comments_count' | 'rewards_count'): Promise<void> {
  const date = todayUtc();
  const now = nowIso();
  await env.DB.prepare(`insert into page_stats (page_path, ${field}, updated_at) values (?, 1, ?) on conflict(page_path) do update set ${field} = ${field} + 1, updated_at = ?`)
    .bind(pagePath, now, now)
    .run();
  await env.DB.prepare(`insert into daily_stats (stat_date, page_path, ${field}, updated_at) values (?, ?, 1, ?) on conflict(stat_date, page_path) do update set ${field} = ${field} + 1, updated_at = ?`)
    .bind(date, pagePath, now, now)
    .run();
}
