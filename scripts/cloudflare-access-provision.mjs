import { pathToFileURL } from 'node:url';

const API_BASE = 'https://api.cloudflare.com/client/v4';

function required(env, key) {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function splitEmails(value) {
  return value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function joinDomainAndPath(domain, appPath) {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const cleanPath = appPath.startsWith('/') ? appPath : `/${appPath}`;
  return `${cleanDomain}${cleanPath}`;
}

export function readAccessConfig(env = process.env) {
  const token = required(env, 'CLOUDFLARE_API_TOKEN');
  const accountId = required(env, 'CLOUDFLARE_ACCOUNT_ID');
  const adminDomain = required(env, 'CLOUDFLARE_ACCESS_ADMIN_DOMAIN');
  const adminEmails = splitEmails(required(env, 'ADMIN_EMAILS'));
  if (adminEmails.length === 0) throw new Error('ADMIN_EMAILS is required');

  return {
    token,
    accountId,
    adminDomain,
    adminPath: env.CLOUDFLARE_ACCESS_ADMIN_PATH?.trim() || '/admin/*',
    appName: env.CLOUDFLARE_ACCESS_APP_NAME?.trim() || 'KevinTen Admin Preview',
    policyName: env.CLOUDFLARE_ACCESS_POLICY_NAME?.trim() || 'KevinTen Admin Allow',
    sessionDuration: env.CLOUDFLARE_ACCESS_SESSION_DURATION?.trim() || '24h',
    adminEmails
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
      authorization: `Bearer ${config.token}`,
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    const message = payload.errors?.map((item) => item.message).join('; ') || response.statusText;
    throw new Error(`Cloudflare API ${method} ${path} failed: ${message}`);
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
