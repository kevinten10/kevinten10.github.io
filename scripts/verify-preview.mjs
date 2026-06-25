import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const apiBaseUrl = (process.env.API_BASE_URL || 'https://kevinten-api-preview.wshten.workers.dev').replace(/\/$/, '');
const pagesUrl = (process.env.PAGES_URL || 'https://cf85b187.kevinten-interactive-preview.pages.dev').replace(/\/$/, '');
const preferCurl = process.env.PREVIEW_VERIFY_TRANSPORT === 'curl'
  || process.platform === 'win32'
  || Boolean(process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY);

const stamp = Date.now();
const smokePage = `/preview-smoke-${stamp}`;
const visitorId = `preview-smoke-${stamp}`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: options.body
      ? { 'content-type': 'application/json', ...(options.headers || {}) }
      : options.headers
  });
}

async function requestWithCurl(url, options = {}) {
  const args = ['-sS', '-L', '-w', '\n%{http_code}'];
  const headers = options.body
    ? { 'content-type': 'application/json', ...(options.headers || {}) }
    : options.headers || {};
  for (const [key, value] of Object.entries(headers)) {
    args.push('-H', `${key}: ${value}`);
  }
  if (options.method) args.push('-X', options.method);
  if (options.body) args.push('--data-binary', options.body);
  args.push(url);

  const command = process.platform === 'win32' ? 'curl.exe' : 'curl';
  let stdout = '';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      ({ stdout } = await execFileAsync(command, args, { maxBuffer: 1024 * 1024 }));
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      await delay(attempt * 750);
    }
  }
  const marker = stdout.lastIndexOf('\n');
  const text = marker === -1 ? stdout : stdout.slice(0, marker);
  const status = Number(marker === -1 ? 0 : stdout.slice(marker + 1).trim());
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text
  };
}

async function request(url, options = {}) {
  if (preferCurl && process.env.PREVIEW_VERIFY_TRANSPORT !== 'fetch') {
    return requestWithCurl(url, options);
  }
  try {
    return await requestWithFetch(url, options);
  } catch (err) {
    console.warn(`fetch failed for ${url}; retrying with curl (${err.cause?.code || err.message})`);
    return requestWithCurl(url, options);
  }
}

async function requestJson(url, options = {}) {
  const response = await request(url, options);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

async function assertJson(name, url, predicate, options = {}) {
  const { response, body } = await requestJson(url, options);
  if (!predicate(response, body)) {
    throw new Error(`${name} failed: ${response.status} ${JSON.stringify(body)}`);
  }
  console.log(`ok ${name}`);
  return body;
}

async function assertText(name, url, predicate) {
  const response = await request(url);
  const text = await response.text();
  if (!response.ok || !predicate(text, response)) {
    throw new Error(`${name} failed: ${response.status}`);
  }
  console.log(`ok ${name}`);
  return text;
}

await assertJson('worker health', `${apiBaseUrl}/health`, (_response, body) => body?.success === true && body?.data?.status === 'ok');

await assertJson('anonymous auth state', `${apiBaseUrl}/api/auth/me`, (_response, body) => {
  return body?.success === true && body?.data?.authenticated === false;
});

await assertJson('unauthenticated profile protection', `${apiBaseUrl}/api/users/profile`, (response, body) => {
  return response.status === 401 && body?.success === false;
});

await assertJson('unauthenticated admin protection', `${apiBaseUrl}/api/admin/summary`, (response, body) => {
  return response.status === 403 && body?.success === false;
});

await assertJson('page view tracking', `${apiBaseUrl}/api/stats/view`, (_response, body) => body?.success === true && body?.data?.tracked === true, {
  method: 'POST',
  body: JSON.stringify({
    sessionId: `session-${stamp}`,
    visitorId,
    pagePath: smokePage,
    referrer: 'codex-preview-smoke',
    userAgent: 'codex-preview-smoke'
  })
});

await assertJson('anonymous comment create', `${apiBaseUrl}/api/comments`, (_response, body) => {
  return body?.success === true && body?.data?.id && body?.data?.status === 'approved';
}, {
  method: 'POST',
  body: JSON.stringify({
    pagePath: smokePage,
    visitorId,
    nickname: 'Preview Smoke',
    content: `Preview smoke comment ${stamp}`
  })
});

await assertJson('anonymous comments read', `${apiBaseUrl}/api/comments?page=${encodeURIComponent(smokePage)}`, (_response, body) => {
  return body?.success === true && Array.isArray(body?.data) && body.data.some((item) => item.content === `Preview smoke comment ${stamp}`);
});

await assertJson('page reaction create', `${apiBaseUrl}/api/reactions`, (_response, body) => {
  return body?.success === true && body?.data?.targetId === smokePage;
}, {
  method: 'POST',
  body: JSON.stringify({
    visitorId,
    targetType: 'page',
    targetId: smokePage,
    reactionType: 'like'
  })
});

await assertJson('reward record create', `${apiBaseUrl}/api/rewards`, (_response, body) => {
  return body?.success === true && body?.data?.id && body?.data?.status === 'pending';
}, {
  method: 'POST',
  body: JSON.stringify({
    visitorId,
    displayName: 'Preview Supporter',
    message: `Preview smoke reward ${stamp}`,
    amount: 1,
    currency: 'CNY'
  })
});

await assertJson('public stats read', `${apiBaseUrl}/api/stats/public?page=${encodeURIComponent(smokePage)}`, (_response, body) => {
  return body?.success === true && Number(body?.data?.page?.pv || 0) >= 1 && Number(body?.data?.page?.uv || 0) >= 1;
});

const homeHtml = await assertText('pages home', `${pagesUrl}/`, (text) => {
  return text.includes('/assets/js/cloudflare-runtime.js') && text.includes('/assets/js/comments.js') && text.includes('/assets/js/rewards.js');
});

await assertText('pages runtime config', `${pagesUrl}/assets/js/cloudflare-runtime.js`, (text) => {
  return text.includes(apiBaseUrl) && text.includes('window.CloudflareSiteConfig');
});

await assertText('pages admin shell', `${pagesUrl}/admin/`, (text) => {
  return text.includes('/assets/js/admin.js') && text.includes('/assets/js/cloudflare-runtime.js');
});

await assertText('legacy article preserved', `${pagesUrl}/2018/08/03/hello-world/`, (text) => text.length > 100);

console.log(JSON.stringify({
  apiBaseUrl,
  pagesUrl,
  smokePage,
  homeIncludesAuth0: homeHtml.includes('cdn.auth0.com')
}, null, 2));
