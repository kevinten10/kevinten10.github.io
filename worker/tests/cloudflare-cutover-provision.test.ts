import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  accessAppNameForDomain,
  accessPolicyNameForDomain,
  ensurePagesDomains,
  ensureZone,
  isCutoverProvisionComplete,
  provisionCutover,
  readCutoverProvisionConfig,
  splitDomains
} from '../../scripts/cloudflare-cutover-provision.mjs';

function response(result: unknown, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 403,
    statusText: ok ? 'OK' : 'Forbidden',
    json: () => Promise.resolve(ok ? { success: true, result } : { success: false, errors: result })
  } as Response);
}

describe('Cloudflare production cutover provisioning helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes production domain inputs from URLs and comma lists', () => {
    expect(splitDomains('https://kevinten.com/, https://www.kevinten.com/admin/*,www.kevinten.com')).toEqual([
      'kevinten.com',
      'www.kevinten.com'
    ]);
  });

  it('uses project defaults with the Wrangler OAuth fallback', () => {
    const config = readCutoverProvisionConfig({}, {
      readWranglerOAuthToken: () => 'oauth-token'
    });

    expect(config.accountId).toBe('f53190ff9de65971510ed96e5bd89bee');
    expect(config.pagesProject).toBe('kevinten-interactive-preview');
    expect(config.zoneName).toBe('kevinten.com');
    expect(config.productionDomains).toEqual(['kevinten.com', 'www.kevinten.com']);
    expect(config.adminEmails).toEqual(['wshten@gmail.com']);
    expect(config.cloudflareAuth).toEqual({
      source: 'wrangler-oauth',
      token: 'oauth-token'
    });
  });

  it('names production Access apps and policies predictably', () => {
    expect(accessAppNameForDomain('kevinten.com')).toBe('KevinTen Admin Production');
    expect(accessPolicyNameForDomain('kevinten.com')).toBe('KevinTen Admin Production Allow');
    expect(accessAppNameForDomain('www.kevinten.com')).toBe('KevinTen Admin Production (www.kevinten.com)');
    expect(accessPolicyNameForDomain('www.kevinten.com')).toBe('KevinTen Admin Production Allow (www.kevinten.com)');
  });

  it('adds missing Pages custom domains without duplicating existing records', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      if (init?.method === 'GET') {
        return response([{ id: 'domain-1', name: 'kevinten.com', status: 'active' }]);
      }
      return response({ id: 'domain-2', name: 'www.kevinten.com', status: 'initializing' });
    });

    const records = await ensurePagesDomains({
      cloudflareAuth: { source: 'api-token', token: 'token' },
      accountId: 'account',
      pagesProject: 'project',
      zoneName: 'kevinten.com',
      productionDomains: ['kevinten.com', 'www.kevinten.com'],
      adminPath: '/admin/*',
      sessionDuration: '24h',
      adminEmails: ['admin@example.com']
    });

    expect(records.map((record) => record.name)).toEqual(['kevinten.com', 'www.kevinten.com']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.cloudflare.com/client/v4/accounts/account/pages/projects/project/domains');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ name: 'www.kevinten.com' })
    });
  });

  it('creates the apex Cloudflare zone when it is missing', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      if (init?.method === 'GET') return response([]);
      return response({
        id: 'zone-id',
        name: 'kevinten.com',
        status: 'pending',
        name_servers: ['ada.ns.cloudflare.com', 'bob.ns.cloudflare.com']
      });
    });

    const result = await ensureZone({
      cloudflareAuth: { source: 'api-token', token: 'token' },
      accountId: 'account',
      pagesProject: 'project',
      zoneName: 'kevinten.com',
      productionDomains: ['kevinten.com'],
      adminPath: '/admin/*',
      sessionDuration: '24h',
      adminEmails: ['admin@example.com']
    });

    expect(result.created).toBe(true);
    expect(result.zone.id).toBe('zone-id');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({
        name: 'kevinten.com',
        account: { id: 'account' },
        type: 'full',
        jump_start: true
      })
    });
  });

  it('summarizes partial Cloudflare permission failures without hiding successful checks', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/pages/projects/project/domains')) {
        return response([{ id: 'domain-1', name: 'kevinten.com', status: 'initializing' }]);
      }
      if (url.includes('/zones?')) {
        return response([{ message: 'requires com.cloudflare.api.account.zone.create' }], false);
      }
      if (url.includes('/access/apps')) {
        return response([{ message: 'Authentication error' }], false);
      }
      throw new Error(`Unexpected request ${init?.method || 'GET'} ${url}`);
    });

    const summary = await provisionCutover({
      CLOUDFLARE_API_TOKEN: 'token',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_PAGES_PROJECT: 'project',
      CLOUDFLARE_ZONE_NAME: 'kevinten.com',
      PRODUCTION_DOMAINS: 'kevinten.com',
      ADMIN_EMAILS: 'admin@example.com'
    }, {
      readWranglerOAuthToken: () => ''
    });

    expect(summary.pagesDomains).toMatchObject({ ok: true });
    expect(summary.zone).toMatchObject({
      ok: false,
      error: 'requires com.cloudflare.api.account.zone.create'
    });
    expect(summary.access).toMatchObject({
      ok: false,
      error: 'Cloudflare API GET /accounts/account/access/apps failed with api-token: Authentication error'
    });
    expect(isCutoverProvisionComplete(summary)).toBe(false);
  });

  it('requires Pages domains, zone, and Access to all succeed before reporting completion', () => {
    expect(isCutoverProvisionComplete({
      pagesDomains: { ok: true },
      zone: { ok: true },
      access: { ok: true }
    })).toBe(true);
    expect(isCutoverProvisionComplete({
      pagesDomains: { ok: true },
      zone: { ok: false },
      access: { ok: true }
    })).toBe(false);
  });
});
