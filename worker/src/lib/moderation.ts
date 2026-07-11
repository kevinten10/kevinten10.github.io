export type ModerationDecision = {
  status: 'approved' | 'pending';
  reason: string;
};

const BLOCKED_PATTERNS = [/casino/i, /viagra/i, /loan\s*offer/i, /<script/i];

export function countLinks(content: string): number {
  return (content.match(/https?:\/\//g) || []).length;
}

export function moderateComment(input: { content: string; recentCount: number; authenticated: boolean }): ModerationDecision {
  const content = input.content.trim();
  if (input.recentCount >= 5) return { status: 'pending', reason: 'rate_limited' };
  if (content.length < 2) return { status: 'pending', reason: 'too_short' };
  if (content.length > 1000) return { status: 'pending', reason: 'too_long' };
  if (countLinks(content) > (input.authenticated ? 2 : 1)) return { status: 'pending', reason: 'too_many_links' };
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(content))) return { status: 'pending', reason: 'blocked_pattern' };
  return { status: 'approved', reason: '' };
}

export function moderateReward(input: { message: string }): ModerationDecision {
  if (input.message.length > 300) return { status: 'pending', reason: 'message_too_long' };
  return { status: 'pending', reason: 'manual_review' };
}
