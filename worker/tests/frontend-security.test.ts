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
    expect(serviceWorker).toContain("const SW_VERSION = '51'");
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

  it('ships the optimized homepage journey and anchor behavior', () => {
    const html = readFileSync('index.html', 'utf8');
    const mainCss = readFileSync('assets/css/main.css', 'utf8');
    const app = readFileSync('assets/js/app.js', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');

    expect(html).toContain('href="#rewards"');
    expect(html).toContain('href="#comments"');
    expect(html).toContain('data-hero-density="editorial"');
    expect(html).toContain('hero-compact-actions');
    expect(html).toContain('/assets/css/main.css?v=37');
    expect(html).toContain('/assets/js/app.js?v=32');
    expect(mainCss).toContain('scroll-margin-top');
    expect(mainCss).toContain('.hero-compact-actions');
    expect(mainCss).toContain('[data-hero-density="editorial"]');
    expect(app).toContain('findActiveSection');
    expect(app).toContain('linkedSectionIds');
    expect(serviceWorker).toContain("const SW_VERSION = '51'");
    expect(serviceWorker).toContain('/assets/css/main.css?v=37');
    expect(serviceWorker).toContain('/assets/js/app.js?v=32');
  });

  it('ships AnyCap generated illustrations and a lightweight promo video path', () => {
    const html = readFileSync('index.html', 'utf8');
    const mainCss = readFileSync('assets/css/main.css', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');

    expect(html).toContain('anycap-media-section');
    expect(html).toContain('/images/anycap/ai-native-system-map-1600.webp');
    expect(html).toContain('/images/anycap/openoctopus-realm-map-1600.webp');
    expect(html).toContain('/video/kevinten-ai-native-promo-poster.jpg');
    expect(html).toContain('/video/kevinten-ai-native-promo.mp4');
    expect(html).toContain('controls muted playsinline preload="metadata"');
    expect(html).toContain('data-video-trigger');
    expect(html).toContain("document.querySelectorAll('#video-play-btn, [data-video-trigger]')");
    expect(html).toContain('playback.catch');
    expect(html).not.toContain('/video/final_v3.mp4');
    expect(html).not.toContain('/video/poster.jpg');
    expect(mainCss).toContain('.anycap-media-grid');
    expect(mainCss).toContain('.anycap-media-play');
    expect(serviceWorker).toContain('/images/anycap/ai-native-system-map-1600.webp');
    expect(serviceWorker).toContain('/images/anycap/openoctopus-realm-map-1600.webp');
    expect(serviceWorker).toContain('/video/kevinten-ai-native-promo-poster.jpg');
    expect(serviceWorker).not.toContain('/video/kevinten-ai-native-promo.mp4');
  });

  it('keeps payment and comments reachable through a right floating rail', () => {
    const html = readFileSync('index.html', 'utf8');
    const mainCss = readFileSync('assets/css/main.css', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');

    expect(html).toContain('quick-action-rail');
    expect(html).toContain('data-quick-action="rewards"');
    expect(html).toContain('data-quick-action="comments"');
    expect(html).toContain('aria-label="打开支持与鸣谢"');
    expect(html).toContain('aria-label="打开留言区"');
    expect(html).toContain('/assets/css/main.css?v=37');
    expect(mainCss).toContain('.quick-action-rail');
    expect(mainCss).toContain('position: fixed');
    expect(mainCss).toContain('.quick-action-link');
    expect(mainCss).toContain('body.rewards-in-view .quick-action-link[data-quick-action="rewards"]');
    expect(mainCss).toContain('body.comments-in-view .quick-action-link[data-quick-action="comments"]');
    expect(mainCss).toContain('@media (max-width: 760px)');
    expect(serviceWorker).toContain("const SW_VERSION = '51'");
    expect(serviceWorker).toContain('/assets/css/main.css?v=37');
  });

  it('ships manual support records with unavailable WeChat, active Alipay, and embedded Stripe sandbox flows', () => {
    const html = readFileSync('index.html', 'utf8');
    const rewards = readFileSync('assets/js/rewards.js', 'utf8');
    const css = readFileSync('assets/css/rewards.css', 'utf8');
    const route = readFileSync('worker/src/routes/rewards.ts', 'utf8');
    const runtime = readFileSync('assets/js/cloudflare-runtime.js', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');

    expect(html).not.toContain('/img/weixin.jpg');
    expect(html).toContain('reward-qr-placeholder');
    expect(html).toContain('微信收款码未配置');
    expect(html).toContain('/img/alipay.jpg');
    expect(html).toContain('Stripe 内嵌沙箱测试');
    expect(html).toContain('data-i18n="rewards.note"');
    expect(html).toContain('value="wechat_qr"');
    expect(html).toContain('value="alipay_qr"');
    expect(html).toContain('value="stripe_sandbox"');
    expect(html).toContain('WeChat unavailable');
    expect(html).toContain('value="wechat_qr" disabled');
    expect(html).toContain('data-stripe-embedded-shell');
    expect(html).toContain('id="stripe-embedded-checkout"');
    expect(html).toContain('https://js.stripe.com/v3/');
    expect(html).toContain('/assets/css/rewards.css?v=4');
    expect(html).toContain('/assets/js/cloudflare-runtime.js?v=3');
    expect(html).toContain('/assets/js/rewards.js?v=5');
    expect(rewards).toContain('selectedProvider');
    expect(rewards).toContain('provider: selectedProvider(section)');
    expect(rewards).toContain('if (input.disabled) return');
    expect(rewards).toContain('if (input && !input.disabled)');
    expect(rewards).toContain('stripe_sandbox');
    expect(rewards).toContain('createEmbeddedCheckoutPage');
    expect(rewards).toContain('/api/rewards/stripe/checkout');
    expect(rewards).toContain('stripe.publishableKey');
    expect(rewards).toContain('rewards-in-view');
    expect(css).toContain('.reward-qr-panel');
    expect(css).toContain('.reward-qr-placeholder');
    expect(css).toContain('.reward-qr.is-disabled');
    expect(css).toContain('.stripe-embedded-shell');
    expect(route).toContain("new Set(['manual_qr', 'wechat_qr', 'alipay_qr'])");
    expect(route).toContain("rewardRoutes.post('/stripe/checkout'");
    expect(route).toContain("ui_mode', 'embedded_page'");
    expect(route).not.toContain('personal_listener');
    expect(runtime).toContain('stripe:');
    expect(runtime).toContain("publishableKey: ''");
    expect(serviceWorker).toContain("const SW_VERSION = '51'");
    expect(serviceWorker).toContain('/assets/css/rewards.css?v=4');
    expect(serviceWorker).toContain('/assets/js/rewards.js?v=5');
    expect(serviceWorker).toContain('/assets/js/i18n.js?v=36');
    expect(serviceWorker).not.toContain('/img/weixin.jpg');
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
    expect(html).toContain('/assets/css/ai-assistant.css?v=4');
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
    expect(serviceWorker).toContain('/assets/css/ai-assistant.css?v=4');
    expect(serviceWorker).toContain('/assets/css/comments.css?v=2');
    expect(serviceWorker).toContain('/assets/js/comments.js?v=5');
  });

  it('ships a polished AI assistant with unique prompts and local knowledge fallback', () => {
    const html = readFileSync('index.html', 'utf8');
    const assistant = readFileSync('assets/js/ai-assistant.js', 'utf8');
    const i18n = readFileSync('assets/js/i18n.js', 'utf8');
    const css = readFileSync('assets/css/ai-assistant.css', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');

    expect(html).toContain('/assets/css/ai-assistant.css?v=4');
    expect(html).toContain('/assets/js/ai-assistant.js?v=3');
    expect(assistant).toContain('findLocalAnswer');
    expect(assistant).toContain('localKnowledge');
    expect(assistant).toContain("key: 'ai.suggested4'");
    expect(assistant).toContain('aria-expanded="false"');
    expect(assistant).toContain('aria-controls="ai-drawer"');
    expect(assistant).toContain('aria-live="polite"');
    expect(assistant).toContain('ai-clear');
    expect(assistant).toContain('updateSendState');
    expect(assistant).toContain('ai.suggested4');
    expect(assistant).not.toContain('Sorry, I encountered an error. Please try again.');
    expect(i18n).toContain("'ai.suggested4': 'How does AI Native show up in his work?'");
    expect(i18n).toContain("'ai.suggested4': 'KevinTen 的 AI Native 项目有哪些？'");
    expect(i18n).toContain("'ai.offline'");
    expect(i18n).toContain("'ai.clear'");
    expect(css).toContain('.ai-shell-status');
    expect(css).toContain('.ai-message-avatar');
    expect(css).toContain('.ai-clear');
    expect(css).toContain('min-height: 0');
    expect(serviceWorker).toContain("const SW_VERSION = '51'");
    expect(serviceWorker).toContain('/assets/css/ai-assistant.css?v=4');
    expect(serviceWorker).toContain('/assets/js/ai-assistant.js?v=3');
  });
});
