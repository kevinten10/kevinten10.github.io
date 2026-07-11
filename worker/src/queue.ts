import type { Env, QueueEvent } from './types';
import { newId, todayUtc, nowIso } from './lib/ids';

export async function handleQueue(batch: MessageBatch<QueueEvent>, env: Env): Promise<void> {
  for (const message of batch.messages) {
    const event = message.body;
    if (event.type === 'page_view') {
      await incrementPageViewStats(env, event.pagePath);
    }
    if (event.type === 'comment_created' && event.status === 'approved') {
      await incrementStats(env, event.pagePath, 'comments_count');
    }
    if (event.type === 'comment_created') {
      if (event.status === 'approved') {
        await recordQueueWork(env, 'comment', event.commentId, 'notification_queued');
      } else {
        await recordQueueWork(env, 'comment', event.commentId, 'moderation_queued', `comment_status:${event.status}`);
      }
    }
    if (event.type === 'reward_created' && (event.status === 'approved' || event.status === 'verified')) {
      await incrementStats(env, '/', 'rewards_count');
    }
    if (event.type === 'reward_created') {
      if (event.status === 'approved' || event.status === 'verified') {
        await recordQueueWork(env, 'reward', event.rewardId, 'notification_queued');
      } else {
        await recordQueueWork(env, 'reward', event.rewardId, 'moderation_queued', `reward_status:${event.status}`);
      }
    }
    message.ack();
  }
}

async function incrementPageViewStats(env: Env, pagePath: string): Promise<void> {
  const date = todayUtc();
  const now = nowIso();
  await env.DB.prepare('insert into page_stats (page_path, pv, uv, updated_at) values (?, 1, 1, ?) on conflict(page_path) do update set pv = pv + 1, uv = uv + 1, updated_at = ?')
    .bind(pagePath, now, now)
    .run();
  await env.DB.prepare('insert into daily_stats (stat_date, page_path, pv, uv, updated_at) values (?, ?, 1, 1, ?) on conflict(stat_date, page_path) do update set pv = pv + 1, uv = uv + 1, updated_at = ?')
    .bind(date, pagePath, now, now)
    .run();
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

async function recordQueueWork(env: Env, targetType: string, targetId: string, action: string, reason = ''): Promise<void> {
  await env.DB.prepare('insert into admin_events (id, actor_user_id, actor_email, target_type, target_id, action, reason) values (?, null, null, ?, ?, ?, ?)')
    .bind(newId('evt'), targetType, targetId, action, reason)
    .run();
}
