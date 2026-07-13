import { execFile } from 'node:child_process';
import { Resolver, resolve4, resolveCname, resolveNs } from 'node:dns/promises';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve as resolvePath } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { readWranglerOAuthToken } from './cloudflare-access-provision.mjs';
import { verifyRewardQrs } from './verify-reward-qrs.mjs';

const execFileAsync = promisify(execFile);

const cloudflareApi = 'https://api.cloudflare.com/client/v4';
const githubPagesIps = new Set(['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153']);
const expectedCloudflareNameservers = ['chip.ns.cloudflare.com', 'faye.ns.cloudflare.com'];
const expectedPagesTarget = 'kevinten-interactive-preview.pages.dev';
const fallbackDnsServers = ['1.1.1.1', '8.8.8.8'];

function envValue(key, fallback = '', env = process.env) {
  return env?.[key]?.trim() || fallback;
}

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

export function normalizeHostname(value) {
  return String(value || '').trim().toLowerCase().replace(/\.$/, '');
}

export function normalizeNameservers(nameservers) {
  return (nameservers || []).map(normalizeHostname).filter(Boolean);
}

export function hasCloudflareNameservers(nameservers) {
  return normalizeNameservers(nameservers).some((item) => item.endsWith('.ns.cloudflare.com'));
}

export function hasGithubPagesAddress(addresses) {
  return addresses.some((item) => githubPagesIps.has(item));
}

export function includesAll(actual, expected) {
  const set = new Set(actual || []);
  return expected.every((item) => set.has(item));
}

function recordName(record) {
  return typeof record === 'string' ? record : record?.name || record?.domain || '';
}

export function hasActivePagesDomains(records, hosts) {
  return (hosts || []).every((host) => {
    const normalizedHost = normalizeHostname(host);
    const record = (records || []).find((item) => normalizeHostname(recordName(item)) === normalizedHost);
    return Boolean(record) && record?.status === 'active';
  });
}

export function describePagesDomains(records, hosts) {
  return (hosts || []).map((host) => {
    const normalizedHost = normalizeHostname(host);
    const record = (records || []).find((item) => normalizeHostname(recordName(item)) === normalizedHost);
    if (!record) return `${host}:missing`;
    return `${host}:${record?.status || 'unknown'}`;
  });
}

export function hasExpectedPagesDnsRecords(records, hosts, target = expectedPagesTarget) {
  const normalizedTarget = normalizeHostname(target);
  return (hosts || []).every((host) => {
    const normalizedHost = normalizeHostname(host);
    return (records || []).some((record) => {
      return normalizeHostname(record?.name) === normalizedHost
        && String(record?.type || '').toUpperCase() === 'CNAME'
        && normalizeHostname(record?.content) === normalizedTarget
        && record?.proxied === true;
    });
  });
}

export function describeExpectedPagesDnsRecords(records, hosts, target = expectedPagesTarget) {
  const normalizedTarget = normalizeHostname(target);
  return (hosts || []).map((host) => {
    const normalizedHost = normalizeHostname(host);
    const record = (records || []).find((item) => normalizeHostname(item?.name) === normalizedHost);
    if (!record) return `${host}:missing`;
    const type = String(record.type || 'unknown').toUpperCase();
    const content = normalizeHostname(record.content) || 'empty';
    const proxyMode = record.proxied === true ? 'proxied' : record.proxied === false ? 'dns-only' : 'unknown-proxy';
    const targetStatus = type === 'CNAME' && content === normalizedTarget ? 'target-ok' : 'target-mismatch';
    return `${host}:${type}->${content}:${proxyMode}:${targetStatus}`;
  });
}

export function parseDigResponse(stdout) {
  const status = stdout.match(/status:\s*([A-Z]+)/i)?.[1]?.toUpperCase() || 'UNKNOWN';
  const answers = String(stdout || '').split(/\r?\n/).map((line) => {
    const match = line.match(/^(\S+)\s+(\d+)\s+IN\s+(\S+)\s+(.+)$/i);
    if (!match) return null;
    return {
      name: normalizeHostname(match[1]),
      ttl: Number(match[2]),
      type: String(match[3] || '').toUpperCase(),
      value: String(match[4] || '').trim()
    };
  }).filter(Boolean);
  return {
    status,
    answers,
    addresses: answers.filter((item) => item.type === 'A').map((item) => item.value),
    cnames: answers.filter((item) => item.type === 'CNAME').map((item) => normalizeHostname(item.value))
  };
}

export function parseNslookupResponse(stdout) {
  const text = String(stdout || '');
  const status = /query refused/i.test(text)
    ? 'REFUSED'
    : /server failed|servfail/i.test(text)
      ? 'SERVFAIL'
      : /can't find|non-existent domain|nxdomain/i.test(text)
        ? 'NXDOMAIN'
        : 'NOERROR';
  const nameservers = [...text.matchAll(/nameserver\s*=\s*(\S+)/ig)]
    .map((match) => normalizeHostname(match[1]));
  const cnames = [...text.matchAll(/canonical name\s*=\s*(\S+)/ig)]
    .map((match) => normalizeHostname(match[1]));
  const addresses = [];
  let answerSection = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*Name:\s+/i.test(line)) answerSection = true;
    const address = line.match(/^\s*Address(?:es)?:\s*([0-9.]+)\s*$/i)?.[1];
    if (answerSection && address) addresses.push(address);
  }
  return {
    status,
    nameservers: [...new Set(nameservers)],
    answers: addresses.length + cnames.length,
    addresses: [...new Set(addresses)],
    cnames: [...new Set(cnames)]
  };
}

export function isAuthoritativeDnsReady(summary) {
  const addresses = summary?.addresses || [];
  const cnames = summary?.cnames || [];
  return summary?.status === 'NOERROR'
    && (addresses.length > 0 || cnames.length > 0)
    && !hasGithubPagesAddress(addresses)
    && !cnames.includes('kevinten10.github.io')
    && (addresses.length > 0 || cnames.includes(expectedPagesTarget));
}

export function isProductionHttpReady({ status = 0, server = '', cfRay = '', githubRequestId = '', bodyText = '' } = {}) {
  const normalizedServer = String(server || '').toLowerCase();
  const hasCloudflareHeader = normalizedServer.includes('cloudflare') || Boolean(cfRay);
  const hasGithubHeader = normalizedServer.includes('github') || Boolean(githubRequestId);
  const hasRuntimeConfig = String(bodyText || '').includes('/assets/js/cloudflare-runtime.js')
    || String(bodyText || '').includes('window.CloudflareSiteConfig');
  return status >= 200 && status < 400 && hasCloudflareHeader && !hasGithubHeader && hasRuntimeConfig;
}

export function hasCloudflareAccessMarker({ location = '', finalUrl = '', bodyText = '' } = {}) {
  const haystack = [location, finalUrl, bodyText].map((item) => String(item || '').toLowerCase()).join('\n');
  return haystack.includes('cloudflare access')
    || haystack.includes('cloudflareaccess.com')
    || haystack.includes('/cdn-cgi/access/login');
}

function safeUrlHostname(value) {
  try {
    return value ? new URL(value).hostname : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function isCloudflareAccessProtected({
  status = 0,
  server = '',
  cfRay = '',
  location = '',
  finalUrl = '',
  bodyText = ''
} = {}) {
  const normalizedServer = String(server || '').toLowerCase();
  const hasCloudflareHeader = normalizedServer.includes('cloudflare') || Boolean(cfRay);
  const hasAccessMarker = hasCloudflareAccessMarker({ location, finalUrl, bodyText });
  return status >= 200 && status < 400 && hasCloudflareHeader && hasAccessMarker;
}

export function createCutoverAudit({ startedAt = new Date().toISOString(), apiBaseUrl = '', pagesUrl = '', productionOrigins = [] } = {}) {
  return {
    schemaVersion: 1,
    startedAt,
    apiBaseUrl,
    pagesUrl,
    productionOrigins,
    checks: []
  };
}

export function recordCutoverCheck(audit, name, ok, detail = '') {
  const entry = {
    name,
    status: ok ? 'ok' : 'not_ready'
  };
  if (detail) entry.detail = String(detail);
  if (audit?.checks) audit.checks.push(entry);
  return entry;
}

export function finalizeCutoverAudit(audit, ready, completedAt = new Date().toISOString()) {
  const checks = audit?.checks || [];
  return {
    ...audit,
    completedAt,
    ready: Boolean(ready),
    totalChecks: checks.length,
    passedChecks: checks.filter((item) => item.status === 'ok').length,
    failedChecks: checks.filter((item) => item.status !== 'ok').length
  };
}

async function writeCutoverAuditFile(path, audit, ready) {
  const report = finalizeCutoverAudit(audit, ready);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function printCheck(name, ok, detail = '', audit = null) {
  const marker = ok ? 'ok' : 'not ready';
  console.log(`${marker} ${name}${detail ? `: ${detail}` : ''}`);
  recordCutoverCheck(audit, name, ok, detail);
}

function headerAccessor(headersText) {
  const headers = new Map();
  const lines = String(headersText || '').split(/\r?\n/).slice(1);
  for (const line of lines) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (!key) continue;
    headers.set(key, headers.has(key) ? `${headers.get(key)}, ${value}` : value);
  }
  return {
    get(name) {
      return headers.get(String(name || '').toLowerCase()) || null;
    }
  };
}

export function parseCurlResponseOutput(stdout) {
  const marker = stdout.lastIndexOf('\n__STATUS__:');
  const payload = marker === -1 ? stdout : stdout.slice(0, marker);
  const status = marker === -1 ? 0 : Number(stdout.slice(marker + '\n__STATUS__:'.length).trim());
  let headersText = '';
  let bodyStart = 0;
  for (const match of payload.matchAll(/^HTTP\/[^\r\n]*/gm)) {
    const rest = payload.slice(match.index || 0);
    const separator = /\r?\n\r?\n/.exec(rest);
    if (!separator) continue;
    headersText = rest.slice(0, separator.index);
    bodyStart = (match.index || 0) + separator.index + separator[0].length;
  }
  if (!headersText) {
    return {
      status,
      text: payload,
      headersText: '',
      headers: headerAccessor('')
    };
  }
  return {
    status,
    text: payload.slice(bodyStart),
    headersText,
    headers: headerAccessor(headersText)
  };
}

async function requestJson(url, options = {}) {
  const { response, text } = await requestText(url, options);
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

async function requestText(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return { response, text: await response.text(), headersText: '' };
  } catch (err) {
    return requestTextWithCurl(url, options);
  }
}

async function requestTextWithCurl(url, options = {}) {
  const args = ['-sS'];
  if (options.redirect !== 'manual') args.push('-L');
  args.push('-i', '--retry', '3', '--retry-delay', '1', '--retry-all-errors');
  const headers = options.headers || {};
  for (const [key, value] of Object.entries(headers)) {
    args.push('-H', `${key}: ${value}`);
  }
  if (options.method) args.push('-X', options.method);
  if (options.body) args.push('--data-binary', options.body);
  args.push('-w', '\n__STATUS__:%{http_code}', url);
  const { stdout } = await execFileAsync(process.platform === 'win32' ? 'curl.exe' : 'curl', args, {
    maxBuffer: 1024 * 1024
  });
  const parsed = parseCurlResponseOutput(stdout);
  return {
    response: {
      ok: parsed.status >= 200 && parsed.status < 300,
      status: parsed.status,
      statusText: String(parsed.status),
      headers: parsed.headers
    },
    text: parsed.text,
    headersText: parsed.headersText
  };
}

async function requestHeadersWithCurl(url, options = {}) {
  const args = ['-sS', '-i', '--retry', '3', '--retry-delay', '1', '--retry-all-errors'];
  const headers = options.headers || {};
  for (const [key, value] of Object.entries(headers)) {
    args.push('-H', `${key}: ${value}`);
  }
  if (options.method) args.push('-X', options.method);
  args.push('-w', '\n__STATUS__:%{http_code}', url);
  const { stdout } = await execFileAsync(process.platform === 'win32' ? 'curl.exe' : 'curl', args, {
    maxBuffer: 1024 * 1024
  });
  const marker = stdout.lastIndexOf('\n__STATUS__:');
  const text = marker === -1 ? stdout : stdout.slice(0, marker);
  const status = marker === -1 ? 0 : Number(stdout.slice(marker + '\n__STATUS__:'.length).trim());
  return { status, text };
}

async function allowedCorsOrigin(url, origin) {
  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'GET'
      }
    });
    return response.headers.get('access-control-allow-origin') === origin;
  } catch {
    const result = await requestHeadersWithCurl(url, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'GET'
      }
    });
    return result.status === 204 && new RegExp(`access-control-allow-origin:\\s*${origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(result.text);
  }
}

function cloudflareToken(env = process.env) {
  return envValue('CLOUDFLARE_API_TOKEN', '', env) || readWranglerOAuthToken(env);
}

async function cloudflareGet(path, env = process.env) {
  const token = cloudflareToken(env);
  if (!token) throw new Error('Cloudflare API token or Wrangler OAuth token is required');
  const { response, body } = await requestJson(`${cloudflareApi}${path}`, {
    headers: { authorization: `Bearer ${token}` }
  });
  if (!response.ok || body?.success === false) {
    const message = body?.errors?.map((item) => item.message).join('; ') || response.statusText;
    throw new Error(message);
  }
  return body.result;
}

async function auth0App(clientId, env = process.env) {
  if (!clientId) throw new Error('AUTH0_CLIENT_ID is required');
  const timeoutMs = Number(envValue('AUTH0_CLI_TIMEOUT_MS', '30000', env)) || 30000;
  try {
    const { stdout } = await execFileAsync(auth0Executable(env), auth0AppShowArgs(clientId), {
      maxBuffer: 1024 * 1024,
      timeout: timeoutMs,
      killSignal: 'SIGTERM',
      cwd: process.cwd(),
      env: auth0ChildEnv(env)
    });
    return JSON.parse(stdout);
  } catch (err) {
    if (err.killed || err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      throw new Error(`Auth0 CLI did not finish within ${timeoutMs}ms; refresh Auth0 CLI login or set AUTH0_CLI_TIMEOUT_MS for a slower environment`);
    }
    const detail = err.stderr?.trim() || err.stdout?.trim() || err.message;
    throw new Error(`Auth0 CLI failed: ${detail}`);
  }
}

function auth0Domain(env = process.env) {
  return envValue('AUTH0_DOMAIN', 'dev-8abkwbejxgjbcz1l.us.auth0.com', env).replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function auth0ClientIdFromRuntime(source = '') {
  const match = String(source).match(/["']clientId["']\s*:\s*["']([^"']+)["']/);
  return match?.[1]?.trim() || '';
}

function auth0PublicAuthorizeUrl({ domain, clientId, origin }) {
  const url = new URL(`https://${domain}/authorize`);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', `${origin.replace(/\/$/, '')}/`);
  url.searchParams.set('scope', 'openid profile email');
  url.searchParams.set('state', 'cutover-readiness');
  url.searchParams.set('code_challenge', 'cutoverReadinessChallenge000000000000000000000');
  url.searchParams.set('code_challenge_method', 'S256');
  return url;
}

function auth0PublicLogoutUrl({ domain, clientId, origin }) {
  const url = new URL(`https://${domain}/v2/logout`);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('returnTo', `${origin.replace(/\/$/, '')}/`);
  return url;
}

export function isAuth0PublicRouteAllowed({ status = 0, location = '', finalUrl = '', bodyText = '' } = {}) {
  const haystack = [location, finalUrl, bodyText].map((item) => String(item || '').toLowerCase()).join('\n');
  if (status < 200 || status >= 400) return false;
  return ![
    'callback url mismatch',
    'returnto url is not in the list',
    'unauthorized_client',
    'invalid_request',
    'not in the list of allowed'
  ].some((marker) => haystack.includes(marker));
}

export async function auth0PublicProductionCheckWithRequester({
  clientId,
  domain,
  productionOrigins,
  request = requestText
}) {
  if (!clientId) throw new Error('AUTH0_CLIENT_ID is required');
  const results = [];
  for (const origin of productionOrigins) {
    const authorize = await request(auth0PublicAuthorizeUrl({ domain, clientId, origin }).href, { redirect: 'manual' });
    results.push({
      origin,
      route: 'authorize',
      ok: isAuth0PublicRouteAllowed({
        status: authorize.response.status || 0,
        location: authorize.response.headers.get('location') || '',
        finalUrl: authorize.response.url || '',
        bodyText: authorize.text
      })
    });

    const logout = await request(auth0PublicLogoutUrl({ domain, clientId, origin }).href, { redirect: 'manual' });
    results.push({
      origin,
      route: 'logout',
      ok: isAuth0PublicRouteAllowed({
        status: logout.response.status || 0,
        location: logout.response.headers.get('location') || '',
        finalUrl: logout.response.url || '',
        bodyText: logout.text
      })
    });
  }
  const failures = results.filter((item) => !item.ok);
  return {
    ok: failures.length === 0,
    detail: failures.length
      ? failures.map((item) => `${item.origin}:${item.route}`).join(', ')
      : results.map((item) => `${item.origin}:${item.route}`).join(', ')
  };
}

async function auth0PublicProductionCheck(clientId, productionOrigins, env = process.env) {
  return auth0PublicProductionCheckWithRequester({
    clientId,
    domain: auth0Domain(env),
    productionOrigins
  });
}

export function auth0AppShowArgs(clientId) {
  return ['apps', 'show', clientId, '--json', '--no-input', '--no-color'];
}

export function auth0Executable(env = process.env) {
  const configured = envValue('AUTH0_CLI_PATH', '', env);
  if (configured) return configured;
  const localAppData = envValue('LOCALAPPDATA', '', env);
  const windowsInstall = localAppData ? `${localAppData}\\Programs\\Auth0CLI\\auth0.exe` : '';
  if (process.platform === 'win32' && windowsInstall && existsSync(windowsInstall)) return windowsInstall;
  return 'auth0';
}

export function auth0ChildEnv(env = process.env) {
  const childEnv = { ...process.env, ...env };
  const localConfigDir = resolvePath(process.cwd(), '.config', 'auth0');
  const localAuth0Config = resolvePath(localConfigDir, 'config.json');
  if (!childEnv.XDG_CONFIG_HOME && existsSync(localAuth0Config)) {
    childEnv.XDG_CONFIG_HOME = localConfigDir;
  }
  return childEnv;
}

async function safeResolve(resolveFn, host) {
  try {
    return await resolveFn(host);
  } catch {
    return [];
  }
}

function hasDnsSummaryData(summary) {
  return Boolean(summary.addresses.length || summary.cnames.length || summary.nameservers.length);
}

export async function dnsSummaryFromResolvers(host, primary, fallback = null) {
  const summary = {
    addresses: await safeResolve(primary.resolve4, host),
    cnames: await safeResolve(primary.resolveCname, host),
    nameservers: await safeResolve(primary.resolveNs, host)
  };
  if (hasDnsSummaryData(summary) || !fallback) return summary;
  return {
    addresses: await safeResolve(fallback.resolve4, host),
    cnames: await safeResolve(fallback.resolveCname, host),
    nameservers: await safeResolve(fallback.resolveNs, host)
  };
}

function publicDnsResolverFns() {
  const resolver = new Resolver();
  resolver.setServers(fallbackDnsServers);
  return {
    resolve4: resolver.resolve4.bind(resolver),
    resolveCname: resolver.resolveCname.bind(resolver),
    resolveNs: resolver.resolveNs.bind(resolver)
  };
}

async function dnsSummary(host) {
  const { addresses, cnames, nameservers } = await dnsSummaryFromResolvers(host, {
    resolve4,
    resolveCname,
    resolveNs
  }, publicDnsResolverFns());
  return { addresses, cnames, nameservers };
}

async function registryNameservers(host) {
  try {
    const { stdout } = await execFileAsync('dig', ['@a.gtld-servers.net', host, 'NS', '+noall', '+authority'], {
      maxBuffer: 1024 * 1024,
      timeout: 10000,
      killSignal: 'SIGTERM'
    });
    const nameservers = stdout.split(/\r?\n/).map((line) => {
      const match = line.match(/\sIN\s+NS\s+(\S+)/i);
      return match?.[1] || '';
    });
    return normalizeNameservers(nameservers);
  } catch {
    try {
      const { stdout, stderr } = await execFileAsync('nslookup', ['-type=NS', host, 'a.gtld-servers.net'], {
        maxBuffer: 1024 * 1024,
        timeout: 10000,
        killSignal: 'SIGTERM'
      });
      return parseNslookupResponse(`${stdout || ''}\n${stderr || ''}`).nameservers
        .filter((nameserver) => !nameserver.endsWith('.root-servers.net'));
    } catch {
      return [];
    }
  }
}

async function authoritativeDnsReadiness(host, nameserver) {
  try {
    const { stdout } = await execFileAsync('dig', [`@${nameserver}`, host, 'A', '+noall', '+answer', '+comments'], {
      maxBuffer: 1024 * 1024,
      timeout: 10000,
      killSignal: 'SIGTERM'
    });
    const summary = parseDigResponse(stdout);
    return {
      ok: isAuthoritativeDnsReady(summary),
      detail: JSON.stringify({
        status: summary.status,
        answers: summary.answers.length,
        addresses: summary.addresses,
        cnames: summary.cnames
      })
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        const { stdout, stderr } = await execFileAsync('nslookup', ['-type=A', host, nameserver], {
          maxBuffer: 1024 * 1024,
          timeout: 10000,
          killSignal: 'SIGTERM'
        });
        const summary = parseNslookupResponse(`${stdout || ''}\n${stderr || ''}`);
        return {
          ok: isAuthoritativeDnsReady(summary),
          detail: JSON.stringify({
            status: summary.status,
            answers: summary.answers,
            addresses: summary.addresses,
            cnames: summary.cnames
          })
        };
      } catch (fallbackErr) {
        return {
          ok: false,
          detail: fallbackErr.message
        };
      }
    }
    return {
      ok: false,
      detail: err.message
    };
  }
}

async function productionHttpReadiness(origin) {
  try {
    const { response, text } = await requestText(`${origin.replace(/\/$/, '')}/`);
    const summary = {
      status: response.status || 0,
      server: response.headers.get('server') || '',
      cfRay: response.headers.get('cf-ray') || '',
      githubRequestId: response.headers.get('x-github-request-id') || '',
      bodyText: text
    };
    return {
      ok: isProductionHttpReady(summary),
      detail: JSON.stringify({
        status: summary.status,
        server: summary.server || 'unknown',
        cfRay: Boolean(summary.cfRay),
        github: Boolean(summary.githubRequestId) || summary.server.toLowerCase().includes('github'),
        hasRuntime: String(text || '').includes('/assets/js/cloudflare-runtime.js')
      })
    };
  } catch (err) {
    return {
      ok: false,
      detail: err.message
    };
  }
}

async function adminHttpProtection(origin) {
  try {
    const { response, text } = await requestText(`${origin.replace(/\/$/, '')}/admin/`);
    const summary = {
      status: response.status || 0,
      server: response.headers.get('server') || '',
      cfRay: response.headers.get('cf-ray') || '',
      location: response.headers.get('location') || '',
      finalUrl: response.url || '',
      bodyText: text
    };
    return {
      ok: isCloudflareAccessProtected(summary),
      detail: JSON.stringify({
        status: summary.status,
        server: summary.server || 'unknown',
        cfRay: Boolean(summary.cfRay),
        finalHost: safeUrlHostname(summary.finalUrl),
        accessMarker: hasCloudflareAccessMarker(summary)
      })
    };
  } catch (err) {
    return {
      ok: false,
      detail: err.message
    };
  }
}

export async function verifyCutoverReadiness(env = process.env) {
  const accountId = envValue('CLOUDFLARE_ACCOUNT_ID', 'f53190ff9de65971510ed96e5bd89bee', env);
  const pagesProject = envValue('CLOUDFLARE_PAGES_PROJECT', 'kevinten-interactive-preview', env);
  const apiBaseUrl = envValue('API_BASE_URL', 'https://kevinten-api-preview.wshten.workers.dev', env).replace(/\/$/, '');
  const pagesUrl = envValue('PAGES_URL', 'https://kevinten-interactive-preview.pages.dev', env).replace(/\/$/, '');
  const configuredAuth0ClientId = envValue('AUTH0_CLIENT_ID', '', env);
  const productionOrigins = splitList(envValue('PRODUCTION_ORIGINS', 'https://kevinten.com,https://www.kevinten.com', env));
  const productionHosts = productionOrigins.map((origin) => new URL(origin).hostname);
  const expectedCallbacks = productionOrigins.map((origin) => `${origin}/`);
  const requiredAccessDomains = productionHosts.map((host) => `${host}/admin/*`);
  const audit = createCutoverAudit({ apiBaseUrl, pagesUrl, productionOrigins });
  const record = (name, ok, detail = '') => printCheck(name, ok, detail, audit);

  let ready = true;

  const health = await requestJson(`${apiBaseUrl}/health`);
  const healthOk = health.response.ok && health.body?.success === true;
  record('worker health', healthOk, apiBaseUrl);
  ready &&= healthOk;

  for (const origin of productionOrigins) {
    const allowed = await allowedCorsOrigin(`${apiBaseUrl}/api/config`, origin);
    record(`CORS ${origin}`, allowed);
    ready &&= allowed;
  }

  const runtime = (await requestText(`${pagesUrl}/assets/js/cloudflare-runtime.js?v=3`)).text;
  const auth0ClientId = configuredAuth0ClientId || auth0ClientIdFromRuntime(runtime);
  const runtimeOk = productionOrigins.every((origin) => runtime.includes(origin)) && runtime.includes('window.location.origin');
  record('Pages runtime supports preview plus production origins', runtimeOk, pagesUrl);
  ready &&= runtimeOk;

  try {
    const app = await auth0App(auth0ClientId, env);
    const auth0Ok = includesAll(app.callbacks || [], expectedCallbacks)
      && includesAll(app.allowed_logout_urls || [], expectedCallbacks)
      && includesAll(app.allowed_origins || [], productionOrigins)
      && includesAll(app.web_origins || [], productionOrigins);
    record('Auth0 production callbacks/origins', auth0Ok, auth0ClientId);
    ready &&= auth0Ok;
  } catch (err) {
    try {
      const publicCheck = await auth0PublicProductionCheck(auth0ClientId, productionOrigins, env);
      record(
        'Auth0 production callbacks/origins',
        publicCheck.ok,
        `${publicCheck.ok ? 'public authorize/logout checks passed' : `public authorize/logout failed: ${publicCheck.detail}`}; CLI unavailable: ${err.message}`
      );
      ready &&= publicCheck.ok;
    } catch (fallbackErr) {
      record('Auth0 production callbacks/origins', false, `${err.message}; public fallback failed: ${fallbackErr.message}`);
      ready = false;
    }
  }

  const qrResults = await verifyRewardQrs();
  for (const result of qrResults) {
    record(`${result.name} reward QR`, result.ok, result.reason);
    ready &&= result.ok;
  }

  try {
    const domains = await cloudflareGet(`/accounts/${accountId}/pages/projects/${pagesProject}/domains`, env);
    const domainRecords = domains || [];
    const pagesDomainsOk = hasActivePagesDomains(domainRecords, productionHosts);
    record('Cloudflare Pages custom domains active', pagesDomainsOk, describePagesDomains(domainRecords, productionHosts).join(', '));
    ready &&= pagesDomainsOk;
  } catch (err) {
    record('Cloudflare Pages custom domains readable', false, err.message);
    ready = false;
  }

  try {
    const zones = await cloudflareGet(`/zones?name=kevinten.com`, env);
    const zone = Array.isArray(zones) ? zones.find((item) => item.name === 'kevinten.com') : null;
    const zoneOk = Boolean(zone);
    record('Cloudflare zone exists for kevinten.com', zoneOk, zone ? `${zone.id} (${zone.status || 'unknown'})` : 'not found');
    ready &&= zoneOk;

    const zoneActive = zone?.status === 'active';
    record('Cloudflare zone status active', zoneActive, zone?.status || 'unknown');
    ready &&= zoneActive;

    if (zone?.id) {
      const zoneDnsRecords = await cloudflareGet(`/zones/${zone.id}/dns_records?per_page=100`, env);
      const zoneDnsOk = hasExpectedPagesDnsRecords(zoneDnsRecords, productionHosts);
      record('Cloudflare DNS records point to Pages', zoneDnsOk, describeExpectedPagesDnsRecords(zoneDnsRecords, productionHosts).join(', '));
      ready &&= zoneDnsOk;
    }
  } catch (err) {
    record('Cloudflare zone/DNS readable', false, err.message);
    ready = false;
  }

  const registryNs = await registryNameservers('kevinten.com');
  const registryNsOk = includesAll(registryNs, expectedCloudflareNameservers);
  record('registry delegation uses Cloudflare nameservers', registryNsOk, registryNs.join(', ') || 'none');
  ready &&= registryNsOk;

  for (const nameserver of expectedCloudflareNameservers) {
    for (const host of productionHosts) {
      const result = await authoritativeDnsReadiness(host, nameserver);
      record(`Cloudflare authoritative DNS ${nameserver} ${host} active`, result.ok, result.detail);
      ready &&= result.ok;
    }
  }

  for (const host of productionHosts) {
    const dns = await dnsSummary(host);
    const isApex = host === 'kevinten.com';
    const nsOk = !isApex || hasCloudflareNameservers(dns.nameservers);
    const githubOk = !hasGithubPagesAddress(dns.addresses) && !dns.cnames.includes('kevinten10.github.io');
    record(`DNS ${host} not on GitHub Pages`, githubOk, JSON.stringify({ addresses: dns.addresses, cnames: dns.cnames }));
    ready &&= githubOk;
    if (isApex) {
      record('recursive DNS kevinten.com uses Cloudflare nameservers', nsOk, dns.nameservers.join(', ') || 'none');
      ready &&= nsOk;
    }
  }

  for (const origin of productionOrigins) {
    const result = await productionHttpReadiness(origin);
    record(`production HTTP ${origin} serves Cloudflare Pages`, result.ok, result.detail);
    ready &&= result.ok;
  }

  for (const origin of productionOrigins) {
    const result = await adminHttpProtection(origin);
    record(`production admin ${origin}/admin/ protected by Cloudflare Access`, result.ok, result.detail);
    ready &&= result.ok;
  }

  let accessDomains = [];
  try {
    const apps = await cloudflareGet(`/accounts/${accountId}/access/apps`, env);
    accessDomains = (apps || []).map((item) => item.domain).filter(Boolean);
  } catch (err) {
    record('Cloudflare Access API readable', false, err.message);
    ready = false;
  }
  if (accessDomains.length) {
    const accessOk = requiredAccessDomains.every((domain) => accessDomains.includes(domain));
    record('Cloudflare Access protects production admin paths', accessOk, accessDomains.join(', '));
    ready &&= accessOk;
  }

  const auditPath = envValue('CUTOVER_AUDIT_OUT', '', env);
  if (auditPath) {
    await writeCutoverAuditFile(auditPath, audit, ready);
  }

  return ready;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const ready = await verifyCutoverReadiness();
    if (!ready) process.exitCode = 1;
  } catch (err) {
    console.error(`not ready cutover readiness check failed: ${err.message}`);
    process.exitCode = 1;
  }
}
