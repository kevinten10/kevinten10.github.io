import { describe, expect, it } from 'vitest';
import { cleanText, normalizeVisitorKey } from '../src/lib/ids';

describe('ids helpers', () => {
  it('normalizes visitor keys', () => {
    expect(normalizeVisitorKey('visitor_abc-123')).toBe('visitor_abc-123');
    expect(normalizeVisitorKey('../bad')).toBe('');
  });

  it('trims text to max length', () => {
    expect(cleanText('  abcdef  ', 3)).toBe('abc');
  });
});
