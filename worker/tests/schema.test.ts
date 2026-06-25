import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('D1 schema', () => {
  const sql = readFileSync('worker/migrations/0001_initial.sql', 'utf8');

  for (const table of ['users', 'visitor_profiles', 'comments', 'reactions', 'rewards', 'page_views', 'daily_stats', 'page_stats', 'admin_events']) {
    it(`creates ${table}`, () => {
      expect(sql).toContain(`create table if not exists ${table}`);
    });
  }
});
