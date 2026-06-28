import { pathToFileURL } from 'node:url';
import {
  buildCloudflareHeaders,
  provisionAccess,
  readAccessConfig
} from './cloudflare-access-provision.mjs';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const DEFAULT_ACCOUNT_ID = 'f53190ff9de65971510ed96e5bd89bee';
const DEFAULT_PAGES_PROJECT = 'kevinten-interactive-preview';
const DEFAULT_ZONE_NAME = 'kevinten.com';
const DEFAULT_PRODUCTION_DOMAINS = 'kevinten.com,www.kevinten.com';

function envValue(env, key, fallback = '') {
  return env[key]?.trim() || fallback;
}

export function splitDomains(value = DEFAULT_PRODUCTION_DOMAINS) {
  const domains = String(value || '').split(',').map((item) => {
    return item.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  }).filter(Boolean);
  return Array.from(new Set(domains));
}

export function accessAppNameForDomain(domain) {
  return domain === DEFAULT_ZONE_NAME ? 'KevinTen Admin Production' : `KevinTen Admin Production (${domain})`;
}

export function accessPolicyNameForDomain(domain) {
  return domain === DEFAULT_ZONE_NAME ? 'KevinTen Admin Production Allow' : `KevinTen Admin Production Allow (${domain})`;
}

export function readCutoverProvisionConfig(env = process.env, options = {}) {
  const accessConfig = readAccessConfig(env, options);
  return {
    cloudflareAuth: accessConfig.cloudflareAuth,
    accountId: envValue(env, 'CLOUDFLARE_ACCOUNT_ID', DEFAULT_ACCOUNT_ID),
    pagesProject: envValue(env, 'CLOUDFLARE_PAGES_PROJECT', DEFAULT_PAGES_PROJECT),
    zoneName: envValue(env, 'CLOUDFLARE_ZONE_NAME', DEFAULT_ZONE_NAME),
    productionDomains: splitDomains(envValue(env, 'PRODUCTION_DOMAINS', DEFAULT_PRODUCTION_DOMAINS)),
    adminPath: envValue(env, 'CLOUDFLARE_ACCESS_ADMIN_PATH', '/admin/*'),
    sessionDuration: envValue(env, 'CLOUDFLARE_ACCESS_SESSION_DURATION', '24h'),
    adminEmails: accessConfig.adminEmails
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
    const error = new Error(message);
    error.status = response.status;
    error.errors = payload.errors || [];
    throw error;
  }
  return payload.result;
}

export async function ensurePagesDomains(config) {
  const path = `/accounts/${config.accountId}/pages/projects/${config.pagesProject}/domains`;
  const existing = await cloudflareRequest(config, 'GET', path);
  const records = Array.isArray(existing) ? [...existing] : [];
  const known = new Set(records.map((item) => item.name));
  for (const domain of config.productionDomains) {
    if (known.has(domain)) continue;
    records.push(await cloudflareRequest(config, 'POST', path, { name: domain }));
  }
  return records.filter((item) => config.productionDomains.includes(item.name));
}

export async function ensureZone(config) {
  const zones = await cloudflareRequest(config, 'GET', `/zones?name=${encodeURIComponent(config.zoneName)}`);
  const existing = Array.isArray(zones) ? zones.find((zone) => zone.name === config.zoneName) : null;
  if (existing) return { created: false, zone: existing };
  const zone = await cloudflareRequest(config, 'POST', '/zones', {
    name: config.zoneName,
    account: { id: config.accountId },
    type: 'full',
    jump_start: true
  });
  return { created: true, zone };
}

export async function ensureProductionAccess(config) {
  const results = [];
  for (const domain of config.productionDomains) {
    const result = await provisionAccess({
      cloudflareAuth: config.cloudflareAuth,
      accountId: config.accountId,
      adminDomain: domain,
      adminPath: config.adminPath,
      appName: accessAppNameForDomain(domain),
      policyName: accessPolicyNameForDomain(domain),
      sessionDuration: config.sessionDuration,
      adminEmails: config.adminEmails
    });
    results.push({
      domain,
      app: {
        id: result.app.id,
        name: result.app.name,
        domain: result.app.domain
      },
      policy: {
        id: result.policy.id,
        name: result.policy.name
      }
    });
  }
  return results;
}

function errorSummary(err) {
  return {
    ok: false,
    error: err.message,
    errors: err.errors || undefined
  };
}

export async function provisionCutover(env = process.env, options = {}) {
  const config = readCutoverProvisionConfig(env, options);
  const summary = {
    accountId: config.accountId,
    pagesProject: config.pagesProject,
    zoneName: config.zoneName,
    productionDomains: config.productionDomains,
    pagesDomains: null,
    zone: null,
    access: null
  };

  try {
    const records = await ensurePagesDomains(config);
    summary.pagesDomains = {
      ok: true,
      records: records.map((item) => ({
        id: item.id || item.domain_id,
        name: item.name,
        status: item.status,
        verification: item.verification_data,
        validation: item.validation_data
      }))
    };
  } catch (err) {
    summary.pagesDomains = errorSummary(err);
  }

  try {
    const result = await ensureZone(config);
    summary.zone = {
      ok: true,
      created: result.created,
      id: result.zone.id,
      name: result.zone.name,
      status: result.zone.status,
      nameServers: result.zone.name_servers || []
    };
  } catch (err) {
    summary.zone = errorSummary(err);
  }

  try {
    summary.access = {
      ok: true,
      records: await ensureProductionAccess(config)
    };
  } catch (err) {
    summary.access = errorSummary(err);
  }

  return summary;
}

export function isCutoverProvisionComplete(summary) {
  return Boolean(summary.pagesDomains?.ok && summary.zone?.ok && summary.access?.ok);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const summary = await provisionCutover();
  console.log(JSON.stringify(summary, null, 2));
  if (!isCutoverProvisionComplete(summary)) process.exitCode = 1;
}
