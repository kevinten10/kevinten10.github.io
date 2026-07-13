import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
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
    expect(serviceWorker).toContain("const SW_VERSION = '57'");
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
    expect(html).toContain('hero-social-matrix animate-on-scroll stagger-5" hidden');
    expect(html).toContain('contact-social-bar');
    expect(html).toContain('/assets/css/main.css?v=40');
    expect(html).toContain('/assets/js/app.js?v=32');
    expect(mainCss).toContain('scroll-margin-top');
    expect(mainCss).toContain('.hero-compact-actions');
    expect(mainCss).toContain('[data-hero-density="editorial"]');
    expect(mainCss).toContain('min-height: calc(100svh - 3rem)');
    expect(mainCss).toContain('.hero-social-matrix');
    expect(app).toContain('findActiveSection');
    expect(app).toContain('linkedSectionIds');
    expect(serviceWorker).toContain("const SW_VERSION = '57'");
    expect(serviceWorker).toContain('/assets/css/main.css?v=40');
    expect(serviceWorker).toContain('/assets/js/app.js?v=32');
  });

  it('keeps the promo video and project artwork without a standalone media detour', () => {
    const html = readFileSync('index.html', 'utf8');
    const homepage = readFileSync('assets/js/homepage.js', 'utf8');
    const mainCss = readFileSync('assets/css/main.css', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');

    expect(html).not.toContain('anycap-media-section');
    expect(html).not.toContain('id="media"');
    expect(html).not.toContain('data-i18n="media.title"');
    expect(html).not.toContain('/images/anycap/ai-native-system-map-1600.webp');
    expect(html).toContain('/images/anycap/openoctopus-realm-map-1600.webp');
    expect(html).toContain('/video/kevinten-ai-native-promo-poster.jpg');
    expect(html).toContain('/video/kevinten-ai-native-promo.mp4');
    expect(html).toContain('controls muted playsinline preload="metadata"');
    expect(html).toContain('id="video-play-btn"');
    expect(html).toContain('/assets/js/homepage.js?v=1');
    expect(homepage).toContain("document.querySelectorAll('#video-play-btn, [data-video-trigger]')");
    expect(homepage).toContain('playback.catch');
    expect(homepage).toContain('[data-open-eco-projects]');
    expect(html).not.toContain('/video/final_v3.mp4');
    expect(html).not.toContain('/video/poster.jpg');
    expect(mainCss).not.toContain('.anycap-media-grid');
    expect(mainCss).not.toContain('.anycap-media-play');
    expect(serviceWorker).not.toContain('/images/anycap/ai-native-system-map-1600.webp');
    expect(serviceWorker).toContain('/images/anycap/openoctopus-realm-map-1600.webp');
    expect(serviceWorker).toContain('/video/kevinten-ai-native-promo-poster.jpg');
    expect(serviceWorker).toContain('/assets/js/homepage.js?v=1');
    expect(serviceWorker).not.toContain('/video/kevinten-ai-native-promo.mp4');
  });

  it('publishes only the production promo assets from the video workspace', () => {
    const prepare = readFileSync('scripts/prepare-pages-preview.mjs', 'utf8');
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

    expect(prepare).not.toMatch(/const includeDirs = \[[^\n]*'video'/);
    expect(prepare).toContain("'video/kevinten-ai-native-promo.mp4'");
    expect(prepare).toContain("'video/kevinten-ai-native-promo-poster.jpg'");
    expect(prepare).toContain("process.argv.includes('--require-auth0')");
    expect(prepare).toContain('AUTH0_CLIENT_ID is required for Pages deployment');
    expect(prepare).toContain("indexHtml.replace(/\\r\\n/g, '\\n')");
    expect(packageJson.scripts['deploy:pages']).toContain('--require-auth0');
  });

  it('publishes Cloudflare Pages security headers with an enforced CSP', () => {
    const headers = readFileSync('_headers', 'utf8');
    const html = readFileSync('index.html', 'utf8');
    const structuredData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

    execFileSync(process.execPath, ['scripts/prepare-pages-preview.mjs'], { stdio: 'ignore' });
    expect(readFileSync('dist/pages/_headers', 'utf8')).toBe(headers);
    expect(headers).toContain('Strict-Transport-Security: max-age=31536000');
    expect(headers).toContain('X-Content-Type-Options: nosniff');
    expect(headers).toContain('Referrer-Policy: strict-origin-when-cross-origin');
    expect(headers).toContain('X-Frame-Options: DENY');
    expect(headers).toContain('Permissions-Policy: camera=(), geolocation=(), microphone=(), usb=()');
    expect(headers).toContain('Content-Security-Policy:');
    expect(headers).toContain('/articles*');
    expect(headers).not.toContain('Content-Security-Policy-Report-Only:');
    expect(headers).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(headers).toContain("script-src-attr 'none'");
    expect(headers).toContain("base-uri 'self'");
    expect(headers).toContain("object-src 'none'");
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain('https://cdn.auth0.com');
    expect(headers).toContain('https://js.stripe.com');
    expect(structuredData).not.toBeNull();
    expect(html.match(/<script(?![^>]*\bsrc=)[^>]*>/g) || []).toEqual(['<script type="application/ld+json">']);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
    const structuredDataHash = createHash('sha256')
      .update((structuredData?.[1] || '').replace(/\r\n/g, '\n'))
      .digest('base64');
    expect(headers).toContain(`'sha256-${structuredDataHash}'`);
    headers.split('\n').forEach((line) => expect(line.length).toBeLessThanOrEqual(2000));
    expect(headers).not.toContain('includeSubDomains');
    expect(headers).not.toContain('preload');
  });

  it('loads the published article index module and links only to existing articles', () => {
    const html = readFileSync('articles.html', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');
    const headers = readFileSync('_headers', 'utf8').replace(/\r\n/g, '\n');
    const sitemap = readFileSync('sitemap.xml', 'utf8');
    const robots = readFileSync('robots.txt', 'utf8');
    const scriptPath = '/assets/js/articles.js?v=3';
    const dataPath = '/assets/data/articles.json?v=2';
    const sourcePath = scriptPath.replace(/^\//, '').replace(/\?.*$/, '');
    const source = readFileSync(sourcePath, 'utf8');
    const payload = JSON.parse(readFileSync(dataPath.replace(/^\//, '').replace(/\?.*$/, ''), 'utf8'));
    const articleHeaders = headers.match(/\/articles\*\n([\s\S]*?)(?=\n\/|$)/)?.[1] || '';

    execFileSync(process.execPath, ['scripts/generate-articles-index.mjs', '--check'], { stdio: 'ignore' });
    expect(html).toContain(`<link rel="preload" href="${dataPath}" as="fetch" crossorigin>`);
    expect(html).toContain(`<link rel="preload" href="${scriptPath}" as="script">`);
    expect(html).toContain(`<script src="${scriptPath}" defer></script>`);
    expect(html).toContain('<button class="mobile-menu-btn"');
    expect(html).toContain('<script src="/assets/js/mobile-nav.js?v=32" defer></script>');
    const mobileNav = readFileSync('assets/js/mobile-nav.js', 'utf8');
    expect(mobileNav).not.toContain('document.body.style');
    expect(mobileNav).toContain("document.body.classList.add('mobile-nav-open')");
    expect(mobileNav).toContain("document.body.classList.remove('mobile-nav-open')");
    expect(html).not.toContain('/assets/js/legacy/articles.js');
    expect(html).toContain('<link rel="canonical" href="https://kevinten.com/articles">');
    expect(html).toContain('<meta property="og:url" content="https://kevinten.com/articles">');
    expect(html).not.toContain('kevinten10.github.io');
    expect(html).not.toMatch(/\sstyle=/);
    expect(articleHeaders).not.toContain("style-src 'self' 'unsafe-inline'");
    expect(articleHeaders).toContain("style-src-attr 'none'");
    expect(serviceWorker).toContain("const SW_VERSION = '57'");
    expect(serviceWorker).toContain('const RUNTIME_CACHE = `runtime-v${SW_VERSION}`');
    expect(existsSync(sourcePath)).toBe(true);
    expect(source).toContain("const ARTICLES_INDEX_URL = '/assets/data/articles.json?v=2'");
    expect(payload.total).toBe(143);
    expect(payload.articles).toHaveLength(143);
    expect(new Set(payload.articles.map((article: { url: string }) => article.url)).size).toBe(143);
    expect(JSON.stringify(payload)).not.toMatch(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/);
    expect(payload.articles.find((article: { url: string }) => article.url.includes('Aws-CodeDeploy'))?.title).toBe('AWS-CodeDeploy简洁快速文档');
    expect(payload.articles.find((article: { url: string }) => article.url.includes('Aws-Java-SDK1'))?.excerpt).toContain('AWS SDK for Java 1.x');
    payload.articles.forEach((article: { date: string; url: string }, index: number) => {
      if (index > 0) expect(article.date <= payload.articles[index - 1].date).toBe(true);
      const url = article.url;
      expect(existsSync(`${decodeURI(url).replace(/^\//, '')}index.html`)).toBe(true);
      expect(sitemap).toContain(`<loc>https://kevinten.com${encodeURI(url)}</loc>`);
    });
    expect((sitemap.match(/<loc>/g) || [])).toHaveLength(148);
    expect(robots).toContain('Sitemap: https://kevinten.com/sitemap.xml');
  });

  it('does not leave static Next.js portfolio content hidden by reveal classes', () => {
    const hero = readFileSync('next-portfolio/components/sections/HeroSection.tsx', 'utf8');
    const projects = readFileSync('next-portfolio/components/sections/ProjectsSection.tsx', 'utf8');

    expect(hero).not.toContain('hero-avatar-wrap animate-on-scroll');
    expect(hero).not.toContain('hero-header animate-on-scroll');
    expect(projects).not.toContain('project-card animate-on-scroll');
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
    expect(html).toContain('/assets/css/main.css?v=40');
    expect(mainCss).toContain('.quick-action-rail');
    expect(mainCss).toContain('position: fixed');
    expect(mainCss).toContain('.quick-action-link');
    expect(mainCss).toContain('body.rewards-in-view .quick-action-link[data-quick-action="rewards"]');
    expect(mainCss).toContain('body.comments-in-view .quick-action-link[data-quick-action="comments"]');
    expect(mainCss).toContain('@media (max-width: 760px)');
    expect(serviceWorker).toContain("const SW_VERSION = '57'");
    expect(serviceWorker).toContain('/assets/css/main.css?v=40');
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
    expect(serviceWorker).toContain("const SW_VERSION = '57'");
    expect(serviceWorker).toContain('/assets/css/rewards.css?v=4');
    expect(serviceWorker).toContain('/assets/js/rewards.js?v=5');
    expect(serviceWorker).toContain('/assets/js/i18n.js?v=39');
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
    expect(html).toContain('/assets/css/ai-assistant.css?v=5');
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
    expect(serviceWorker).toContain('/assets/css/ai-assistant.css?v=5');
    expect(serviceWorker).toContain('/assets/css/comments.css?v=2');
    expect(serviceWorker).toContain('/assets/js/comments.js?v=5');
  });

  it('ships a polished AI assistant with unique prompts and local knowledge fallback', () => {
    const html = readFileSync('index.html', 'utf8');
    const assistant = readFileSync('assets/js/ai-assistant.js', 'utf8');
    const i18n = readFileSync('assets/js/i18n.js', 'utf8');
    const css = readFileSync('assets/css/ai-assistant.css', 'utf8');
    const serviceWorker = readFileSync('sw.js', 'utf8');

    expect(html).toContain('/assets/css/ai-assistant.css?v=5');
    expect(html).toContain('/assets/js/ai-assistant.js?v=4');
    expect(assistant).toContain('findLocalAnswer');
    expect(assistant).toContain('localKnowledge');
    expect(assistant).toContain("key: 'ai.suggested4'");
    expect(assistant).toContain('aria-expanded="false"');
    expect(assistant).toContain('aria-controls="ai-drawer"');
    expect(assistant).toContain('aria-live="polite"');
    expect(assistant).toContain('ai-clear');
    expect(assistant).toContain('updateInputState');
    expect(assistant).toContain('ai.suggested4');
    expect(assistant).toContain("endpoint: '/api/assistant'");
    expect(assistant).toContain('window.KevinAuth.apiBase()');
    expect(assistant).toContain('requestTimeoutMs: 18000');
    expect(assistant).toContain('maxInputLength: 500');
    expect(assistant).toContain('AbortController');
    expect(assistant).toContain('requestId !== state.requestId');
    expect(assistant).toContain('ai-message-link');
    expect(assistant).not.toContain('cloudbase.callFunction');
    expect(assistant).not.toContain("functionName: 'aiChat'");
    expect(assistant).not.toContain('Sorry, I encountered an error. Please try again.');
    expect(i18n).toContain("'ai.suggested4': 'How does AI Native show up in his work?'");
    expect(i18n).toContain("'ai.suggested4': 'KevinTen 的 AI Native 项目有哪些？'");
    expect(i18n).toContain("'ai.offline'");
    expect(i18n).toContain("'ai.clear'");
    expect(css).toContain('.ai-shell-status');
    expect(css).toContain('.ai-message-avatar');
    expect(css).toContain('.ai-clear');
    expect(css).toContain('.ai-service-state');
    expect(css).toContain('.ai-message-link');
    expect(css).toContain('.ai-input-meta');
    expect(css).toContain('min-height: 0');
    expect(serviceWorker).toContain("const SW_VERSION = '57'");
    expect(serviceWorker).toContain('/assets/css/ai-assistant.css?v=5');
    expect(serviceWorker).toContain('/assets/js/ai-assistant.js?v=4');
  });
});
