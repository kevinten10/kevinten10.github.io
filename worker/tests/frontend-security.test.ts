import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('frontend security guards', () => {
  it('keeps admin moderation rows out of raw innerHTML sinks', () => {
    const source = readFileSync('assets/js/admin.js', 'utf8');

    expect(source).not.toContain('innerHTML');
    expect(source).not.toContain('(row.content || row.message || \'\') +');
    expect(source).toContain('body.textContent = row.content || row.message || \'\'');
    expect(source).toContain('commentActions');
    expect(source).toContain('rewardActions');
    expect(source).toContain("button.setAttribute('data-status', action.status)");
  });

  it('keeps protected API responses out of the service worker cache', () => {
    const source = readFileSync('sw.js', 'utf8');

    expect(source).toContain('shouldBypassApiCache(request, url)');
    expect(source).toContain("url.pathname.startsWith('/api/admin/')");
    expect(source).toContain("request.headers.has('Authorization')");
  });

  it('keeps runtime config out of stale service worker caches', () => {
    const source = readFileSync('sw.js', 'utf8');

    expect(source).toContain('isRuntimeConfig(url)');
    expect(source).toContain("url.pathname === '/assets/js/cloudflare-runtime.js'");
    expect(source).not.toContain("'/assets/js/cloudflare-runtime.js',");
  });

  it('ships a safe default runtime config for non-preview static hosting', () => {
    const source = readFileSync('assets/js/cloudflare-runtime.js', 'utf8');

    expect(source).toContain("apiBaseUrl: ''");
    expect(source).toContain("logoutUri: ''");
  });

  it('keeps interactive frontend modules quiet when API config is absent', () => {
    const analytics = readFileSync('assets/js/analytics.js', 'utf8');
    const comments = readFileSync('assets/js/comments.js', 'utf8');
    const rewards = readFileSync('assets/js/rewards.js', 'utf8');
    const auth = readFileSync('assets/js/auth-client.js', 'utf8');

    expect(analytics).toContain('if (!apiBase()) return;');
    expect(comments).toContain('if (!apiBase())');
    expect(rewards).toContain('if (!apiBase())');
    expect(auth).toContain('catch (err)');
    expect(auth).toContain('auth.logoutUri');
  });
});
