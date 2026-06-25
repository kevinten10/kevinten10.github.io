import { describe, expect, it } from 'vitest';
import { countLinks, moderateComment, moderateReward } from '../src/lib/moderation';

describe('moderation', () => {
  it('approves normal comments', () => {
    expect(moderateComment({ content: 'Great article, thanks.', recentCount: 0, authenticated: false })).toEqual({
      status: 'approved',
      reason: ''
    });
  });

  it('moves link-heavy anonymous comments to pending', () => {
    expect(countLinks('https://a.test https://b.test')).toBe(2);
    expect(moderateComment({ content: 'https://a.test https://b.test', recentCount: 0, authenticated: false })).toEqual({
      status: 'pending',
      reason: 'too_many_links'
    });
  });

  it('starts manual rewards in pending review', () => {
    expect(moderateReward({ message: 'Thanks!' })).toEqual({
      status: 'pending',
      reason: 'manual_review'
    });
  });
});
