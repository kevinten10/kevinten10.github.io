import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const DEFAULT_ACCOUNT_ID = 'f53190ff9de65971510ed96e5bd89bee';
const DEFAULT_ADMIN_DOMAIN = 'kevinten-interactive-preview.pages.dev';
const DEFAULT_ADMIN_EMAILS = 'wshten@gmail.com';

function splitEmails(value) {
  return String(value || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function joinDomainAndPath(domain, appPath) {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const cleanPath = appPath.startsWith('/') ? appPath : `/${appPath}`;
  return `${cleanDomain}${cleanPath}`;
}

function envValue(env, key) {
  return env[key]?.trim() || '';
}

export function wranglerConfigCandidates(env = process.env) {
  const candidates = [];
  if (env.WRANGLER_CONFIG_PATH?.trim()) candidates.push(env.WRANGLER_CONFIG_PATH.trim());
  if (env.HOME) candidates.push(joinConfigPath(env.HOME, 'Library', 'Preferences', '.wrangler', 'config', 'default.toml'));
  if (env.XDG_CONFIG_HOME) candidates.push(joinConfigPath(env.XDG_CONFIG_HOME, '.wrangler', 'config', 'default.toml'));
  if (env.HOME) candidates.push(joinConfigPath(env.HOME, '.config', '.wrangler', 'config', 'default.toml'));
  if (env.HOME) candidates.push(joinConfigPath(env.HOME, '.wrangler', 'config', 'default.toml'));
  if (env.APPDATA) candidates.push(path.join(env.APPDATA, 'xdg.config', '.wrangler', 'config', 'default.toml'));
  if (env.USERPROFILE) candidates.push(path.join(env.USERPROFILE, '.wrangler', 'config', 'default.toml'));
  if (env.USERPROFILE) candidates.push(path.join(env.USERPROFILE, '.config', '.wrangler', 'config', 'default.toml'));
  return candidates;
}

function joinConfigPath(base, ...segments) {
  if (base.includes('/') && !base.includes('\\')) return path.posix.join(base, ...segments);
  return path.join(base, ...segments);
}

export function readWranglerOAuthToken(env = process.env) {
  for (const candidate of wranglerConfigCandidates(env)) {
    if (!candidate || !existsSync(candidate)) continue;
    const text = readFileSync(candidate, 'utf8');
    const token = text.match(/^\s*oauth_token\s*=\s*"([^"]+)"/m)?.[1] || '';
    if (token) return token;
  }
  return '';
}

function readCloudflareAuth(env, options = {}) {
  const apiToken = envValue(env, 'CLOUDFLARE_API_TOKEN');
  if (apiToken) return { source: 'api-token', token: apiToken };

  const email = envValue(env, 'CF_API_EMAIL') || envValue(env, 'CLOUDFLARE_EMAIL');
  const key = envValue(env, 'CF_API_KEY') || envValue(env, 'CLOUDFLARE_API_KEY');
  if (email && key) return { source: 'global-key', email, key };

  const readToken = options.readWranglerOAuthToken || readWranglerOAuthToken;
  const wranglerToken = readToken(env);
  if (wranglerToken) return { source: 'wrangler-oauth', token: wranglerToken };

  throw new Error('Cloudflare API credentials are required: set CLOUDFLARE_API_TOKEN, set CF_API_EMAIL/CF_API_KEY, or run wrangler login');
}

export function readAccessConfig(env = process.env, options = {}) {
  const cloudflareAuth = readCloudflareAuth(env, options);
  const accountId = envValue(env, 'CLOUDFLARE_ACCOUNT_ID') || DEFAULT_ACCOUNT_ID;
  const adminDomain = envValue(env, 'CLOUDFLARE_ACCESS_ADMIN_DOMAIN') || DEFAULT_ADMIN_DOMAIN;
  const adminEmails = splitEmails(envValue(env, 'ADMIN_EMAILS') || envValue(env, 'CLOUDFLARE_ACCESS_ADMIN_EMAILS') || DEFAULT_ADMIN_EMAILS);

  return {
    cloudflareAuth,
    accountId,
    adminDomain,
    adminPath: env.CLOUDFLARE_ACCESS_ADMIN_PATH?.trim() || '/admin/*',
    appName: env.CLOUDFLARE_ACCESS_APP_NAME?.trim() || 'KevinTen Admin Preview',
    policyName: env.CLOUDFLARE_ACCESS_POLICY_NAME?.trim() || 'KevinTen Admin Allow',
    sessionDuration: env.CLOUDFLARE_ACCESS_SESSION_DURATION?.trim() || '24h',
    adminEmails
  };
}

export function buildCloudflareHeaders(cloudflareAuth) {
  if (cloudflareAuth.source === 'global-key') {
    return {
      'x-auth-email': cloudflareAuth.email,
      'x-auth-key': cloudflareAuth.key
    };
  }
  return {
    authorization: `Bearer ${cloudflareAuth.token}`
  };
}

export function buildAccessApplicationPayload(config) {
  return {
    name: config.appName,
    domain: joinDomainAndPath(config.adminDomain, config.adminPath),
    type: 'self_hosted',
    session_duration: config.sessionDuration,
    auto_redirect_to_identity: false
  };
}

export function buildAccessPolicyPayload(config) {
  return {
    name: config.policyName,
    decision: 'allow',
    include: config.adminEmails.map((email) => ({ email: { email } }))
  };
}

async function cloudflareRequest(config, method, path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...buildCloudflareHeaders(config.cloudflareAuth),
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    const message = payload.errors?.map((item) => item.message).join('; ') || response.statusText;
    throw new Error(`Cloudflare API ${method} ${path} failed with ${config.cloudflareAuth.source}: ${message}`);
  }
  return payload.result;
}

async function findAccessApplication(config) {
  const apps = await cloudflareRequest(config, 'GET', `/accounts/${config.accountId}/access/apps`);
  return (apps || []).find((app) => app.name === config.appName);
}

async function upsertAccessApplication(config) {
  const body = buildAccessApplicationPayload(config);
  const existing = await findAccessApplication(config);
  if (existing?.id) {
    return cloudflareRequest(config, 'PUT', `/accounts/${config.accountId}/access/apps/${existing.id}`, body);
  }
  return cloudflareRequest(config, 'POST', `/accounts/${config.accountId}/access/apps`, body);
}

async function upsertAccessPolicy(config, appId) {
  const body = buildAccessPolicyPayload(config);
  const policies = await cloudflareRequest(config, 'GET', `/accounts/${config.accountId}/access/apps/${appId}/policies`);
  const existing = (policies || []).find((policy) => policy.name === config.policyName);
  if (existing?.id) {
    return cloudflareRequest(config, 'PUT', `/accounts/${config.accountId}/access/apps/${appId}/policies/${existing.id}`, body);
  }
  return cloudflareRequest(config, 'POST', `/accounts/${config.accountId}/access/apps/${appId}/policies`, body);
}

export async function provisionAccess(config) {
  const app = await upsertAccessApplication(config);
  const policy = await upsertAccessPolicy(config, app.id);
  return { app, policy };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = readAccessConfig();
    const result = await provisionAccess(config);
    console.log(JSON.stringify({
      application: {
        id: result.app.id,
        name: result.app.name,
        domain: result.app.domain
      },
      policy: {
        id: result.policy.id,
        name: result.policy.name
      }
    }, null, 2));
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
