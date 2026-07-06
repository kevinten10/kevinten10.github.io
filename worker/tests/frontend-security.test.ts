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
    expect(source).toContain('admin-row-meta');
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
    const prepare = readFileSync('scripts/prepare-pages-preview.mjs', 'utf8');

    expect(source).toContain('isRuntimeConfig(url)');
    expect(source).toContain("url.pathname === '/assets/js/cloudflare-runtime.js'");
    expect(source).not.toContain("'/assets/js/cloudflare-runtime.js',");
    expect(prepare).toContain('AUTH0_ALLOWED_ORIGINS');
    expect(prepare).toContain('DEFAULT_API_BASE_URL');
    expect(prepare).toContain('https://kevinten-api-preview.wshten.workers.dev');
    expect(prepare).toContain("runtimeValue('AUTH0_CLIENT_ID')");
    expect(prepare).not.toContain('DEFAULT_AUTH0_CLIENT_ID');
    expect(prepare).toContain('window.location.origin');
  });

  it('ships a safe default runtime config for non-preview static hosting', () => {
    const source = readFileSync('assets/js/cloudflare-runtime.js', 'utf8');

    expect(source).toContain("apiBaseUrl: ''");
    expect(source).toContain("logoutUri: ''");
    expect(source).toContain('allowedOrigins: []');
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

  it('keeps optional GitHub stats quiet when the page has no stats container', () => {
    const source = readFileSync('assets/js/github-stats.js', 'utf8');
    const html = readFileSync('index.html', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');

    expect(source).toContain("document.getElementById('github-stats')");
    expect(source).not.toContain('GitHub stats container not found');
    expect(html).not.toContain('images/hero/hero-bg-dark.webp" as="image"');
    expect(html).toContain('/assets/js/github-stats.js?v=32');
    expect(serviceWorker).toContain("const SW_VERSION = '46'");
    expect(serviceWorker).toContain('/assets/js/github-stats.js?v=32');
  });

  it('ships public visitor stats with formatted counters', () => {
    const html = readFileSync('index.html', 'utf8');
    const analytics = readFileSync('assets/js/analytics.js', 'utf8');
    const route = readFileSync('worker/src/routes/stats.ts', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');

    expect(html).toContain('data-public-stat="pageViews"');
    expect(html).toContain('data-public-stat="visitors"');
    expect(html).toContain('/assets/js/analytics.js?v=4');
    expect(analytics).toContain("key === 'visitors'");
    expect(analytics).toContain('formatCount');
    expect(route).toContain('uniqueVisitorSql');
    expect(route).toContain('site: {');
    expect(serviceWorker).toContain('/assets/js/analytics.js?v=4');
  });

  it('ships manual support records with unavailable WeChat and active Alipay flows', () => {
    const html = readFileSync('index.html', 'utf8');
    const rewards = readFileSync('assets/js/rewards.js', 'utf8');
    const css = readFileSync('assets/css/rewards.css', 'utf8');
    const route = readFileSync('worker/src/routes/rewards.ts', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');

    expect(html).toContain('/img/weixin.jpg');
    expect(html).toContain('/img/alipay.jpg');
    expect(html).toContain('Stripe 只保留沙箱测试');
    expect(html).toContain('data-i18n="rewards.note"');
    expect(html).toContain('value="wechat_qr"');
    expect(html).toContain('value="alipay_qr"');
    expect(html).toContain('WeChat unavailable');
    expect(html).toContain('value="wechat_qr" disabled');
    expect(html).toContain('/assets/css/rewards.css?v=3');
    expect(html).toContain('/assets/js/rewards.js?v=4');
    expect(rewards).toContain('selectedProvider');
    expect(rewards).toContain('provider: selectedProvider(section)');
    expect(rewards).toContain('if (input.disabled) return');
    expect(rewards).toContain('if (input && !input.disabled)');
    expect(rewards).toContain('stripe_sandbox');
    expect(rewards).toContain('rewards-in-view');
    expect(css).toContain('.reward-qr-panel');
    expect(css).toContain('.reward-qr.is-disabled');
    expect(route).toContain("new Set(['manual_qr', 'wechat_qr', 'alipay_qr'])");
    expect(route).not.toContain('personal_listener');
    expect(serviceWorker).toContain('/assets/css/rewards.css?v=3');
    expect(serviceWorker).toContain('/assets/js/rewards.js?v=4');
    expect(serviceWorker).toContain('/assets/js/i18n.js?v=34');
    expect(serviceWorker).toContain('/img/weixin.jpg');
    expect(serviceWorker).toContain('/img/alipay.jpg');
  });

  it('ships the upgraded login and comments interface assets together', () => {
    const html = readFileSync('index.html', 'utf8');
    const comments = readFileSync('assets/js/comments.js', 'utf8');
    const auth = readFileSync('assets/js/auth-client.js', 'utf8');
    const css = readFileSync('assets/css/comments.css', 'utf8');
    const assistantCss = readFileSync('assets/css/ai-assistant.css', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');

    expect(html).toContain('footer-auth-shell');
    expect(html).toContain('/assets/css/comments.css?v=2');
    expect(html).toContain('/assets/css/ai-assistant.css?v=3');
    expect(html).toContain('/assets/js/auth-client.js?v=2');
    expect(html).toContain('/assets/js/comments.js?v=5');
    expect(comments).toContain('comments-auth-card');
    expect(comments).toContain('data-comments-count');
    expect(comments).toContain('comments-in-view');
    expect(auth).toContain('[data-auth-shell]');
    expect(auth).toContain('[data-auth-status]');
    expect(css).toContain('.comments-auth-card');
    expect(css).toContain('.comments-state');
    expect(assistantCss).toContain('body.comments-in-view .ai-fab');
    expect(assistantCss).toContain('body.rewards-in-view .ai-fab');
    expect(serviceWorker).toContain('/assets/css/ai-assistant.css?v=3');
    expect(serviceWorker).toContain('/assets/css/comments.css?v=2');
    expect(serviceWorker).toContain('/assets/js/comments.js?v=5');
  });
});
