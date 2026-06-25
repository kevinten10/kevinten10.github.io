import { describe, expect, it, vi } from 'vitest';
import { handleQueue } from '../src/queue';
import type { Env, QueueEvent } from '../src/types';

type Execution = {
  sql: string;
  params: unknown[];
};

class RecordingD1 {
  readonly executions: Execution[] = [];

  prepare(sql: string) {
    const executions = this.executions;
    return {
      bind: (...params: unknown[]) => ({
        run: async () => {
          executions.push({ sql, params });
          return {};
        }
      })
    };
  }
}

function batch(events: QueueEvent[]) {
  return {
    messages: events.map((body) => ({
      body,
      ack: vi.fn()
    }))
  } as unknown as MessageBatch<QueueEvent>;
}

describe('queue processing', () => {
  it('records moderation work for pending comments', async () => {
    const db = new RecordingD1();

    await handleQueue(batch([
      { type: 'comment_created', pagePath: '/', commentId: 'cmt_pending', status: 'pending', createdAt: '2026-06-25T00:00:00.000Z' }
    ]), { DB: db } as unknown as Env);

    expect(db.executions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        params: expect.arrayContaining(['comment', 'cmt_pending', 'moderation_queued'])
      })
    ]));
  });

  it('records notification work for approved comments', async () => {
    const db = new RecordingD1();

    await handleQueue(batch([
      { type: 'comment_created', pagePath: '/', commentId: 'cmt_approved', status: 'approved', createdAt: '2026-06-25T00:00:00.000Z' }
    ]), { DB: db } as unknown as Env);

    expect(db.executions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        params: expect.arrayContaining(['comment', 'cmt_approved', 'notification_queued'])
      })
    ]));
  });

  it('records moderation work for pending rewards', async () => {
    const db = new RecordingD1();

    await handleQueue(batch([
      { type: 'reward_created', rewardId: 'rwd_pending', status: 'pending', createdAt: '2026-06-25T00:00:00.000Z' }
    ]), { DB: db } as unknown as Env);

    expect(db.executions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        params: expect.arrayContaining(['reward', 'rwd_pending', 'moderation_queued'])
      })
    ]));
  });

  it('records notification work for verified rewards', async () => {
    const db = new RecordingD1();

    await handleQueue(batch([
      { type: 'reward_created', rewardId: 'rwd_verified', status: 'verified', createdAt: '2026-06-25T00:00:00.000Z' }
    ]), { DB: db } as unknown as Env);

    expect(db.executions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        params: expect.arrayContaining(['reward', 'rwd_verified', 'notification_queued'])
      })
    ]));
  });
});
