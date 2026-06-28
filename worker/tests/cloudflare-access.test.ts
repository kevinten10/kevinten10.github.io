import { describe, expect, it } from 'vitest';
import {
  buildAccessApplicationPayload,
  buildAccessPolicyPayload,
  buildCloudflareHeaders,
  readAccessConfig,
  wranglerConfigCandidates
} from '../../scripts/cloudflare-access-provision.mjs';

describe('Cloudflare Access provisioning helpers', () => {
  it('requires Cloudflare API credentials when no Wrangler OAuth token exists', () => {
    expect(() => readAccessConfig({}, {
      readWranglerOAuthToken: () => ''
    })).toThrow('Cloudflare API credentials are required');
  });

  it('builds a self-hosted admin application payload scoped to /admin/*', () => {
    const config = readAccessConfig({
      CLOUDFLARE_API_TOKEN: 'token',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_ACCESS_ADMIN_DOMAIN: 'preview.example.pages.dev',
      CLOUDFLARE_ACCESS_ADMIN_PATH: '/admin/*',
      CLOUDFLARE_ACCESS_APP_NAME: 'KevinTen Admin Preview',
      ADMIN_EMAILS: 'kevin@example.com'
    }, {
      readWranglerOAuthToken: () => ''
    });

    expect(buildAccessApplicationPayload(config)).toMatchObject({
      name: 'KevinTen Admin Preview',
      domain: 'preview.example.pages.dev/admin/*',
      type: 'self_hosted',
      session_duration: '24h',
      auto_redirect_to_identity: false
    });
  });

  it('builds an allow policy from admin email addresses', () => {
    const config = readAccessConfig({
      CLOUDFLARE_API_TOKEN: 'token',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_ACCESS_ADMIN_DOMAIN: 'preview.example.pages.dev',
      ADMIN_EMAILS: 'Kevin@Example.com, admin@example.com'
    }, {
      readWranglerOAuthToken: () => ''
    });

    expect(buildAccessPolicyPayload(config)).toEqual({
      name: 'KevinTen Admin Allow',
      decision: 'allow',
      include: [
        { email: { email: 'kevin@example.com' } },
        { email: { email: 'admin@example.com' } }
      ]
    });
  });

  it('uses preview defaults and Wrangler OAuth as a best-effort fallback', () => {
    const config = readAccessConfig({}, {
      readWranglerOAuthToken: () => 'oauth-token'
    });

    expect(config.accountId).toBe('f53190ff9de65971510ed96e5bd89bee');
    expect(config.adminDomain).toBe('kevinten-interactive-preview.pages.dev');
    expect(config.adminEmails).toEqual(['wshten@gmail.com']);
    expect(config.cloudflareAuth).toEqual({
      source: 'wrangler-oauth',
      token: 'oauth-token'
    });
  });

  it('checks the macOS Wrangler OAuth config path', () => {
    expect(wranglerConfigCandidates({
      HOME: '/Users/tester'
    })).toContain('/Users/tester/Library/Preferences/.wrangler/config/default.toml');
  });

  it('accepts Cloudflare Access specific admin emails', () => {
    const config = readAccessConfig({
      CLOUDFLARE_API_TOKEN: 'token',
      CLOUDFLARE_ACCESS_ADMIN_EMAILS: 'Admin@Example.com'
    }, {
      readWranglerOAuthToken: () => ''
    });

    expect(config.adminEmails).toEqual(['admin@example.com']);
  });

  it('builds Cloudflare auth headers without leaking credential values into names', () => {
    expect(buildCloudflareHeaders({
      source: 'api-token',
      token: 'api-token'
    })).toEqual({
      authorization: 'Bearer api-token'
    });

    expect(buildCloudflareHeaders({
      source: 'global-key',
      email: 'admin@example.com',
      key: 'global-key'
    })).toEqual({
      'x-auth-email': 'admin@example.com',
      'x-auth-key': 'global-key'
    });
  });
});
