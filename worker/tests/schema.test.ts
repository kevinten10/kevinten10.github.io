import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('D1 schema', () => {
  const sql = readFileSync('worker/migrations/0001_initial.sql', 'utf8');
  const allMigrations = [
    sql,
    readFileSync('worker/migrations/0002_reaction_actor_keys.sql', 'utf8')
  ].join('\n');

  for (const table of ['users', 'visitor_profiles', 'comments', 'reactions', 'rewards', 'page_views', 'daily_stats', 'page_stats', 'admin_events']) {
    it(`creates ${table}`, () => {
      expect(sql).toContain(`create table if not exists ${table}`);
    });
  }

  it('adds a reaction actor key for anonymous de-duping', () => {
    expect(allMigrations).toContain('actor_key text');
    expect(allMigrations).toContain('on reactions(target_type, target_id, reaction_type, actor_key)');
  });
});
