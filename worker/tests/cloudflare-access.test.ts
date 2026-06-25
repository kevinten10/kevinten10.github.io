import { describe, expect, it } from 'vitest';
import {
  buildAccessApplicationPayload,
  buildAccessPolicyPayload,
  readAccessConfig
} from '../../scripts/cloudflare-access-provision.mjs';

describe('Cloudflare Access provisioning helpers', () => {
  it('requires an API token, account id, admin host, and allowed admin emails', () => {
    expect(() => readAccessConfig({})).toThrow('CLOUDFLARE_API_TOKEN is required');
    expect(() => readAccessConfig({ CLOUDFLARE_API_TOKEN: 'token' })).toThrow('CLOUDFLARE_ACCOUNT_ID is required');
    expect(() => readAccessConfig({
      CLOUDFLARE_API_TOKEN: 'token',
      CLOUDFLARE_ACCOUNT_ID: 'account'
    })).toThrow('CLOUDFLARE_ACCESS_ADMIN_DOMAIN is required');
    expect(() => readAccessConfig({
      CLOUDFLARE_API_TOKEN: 'token',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_ACCESS_ADMIN_DOMAIN: 'admin.example.com'
    })).toThrow('ADMIN_EMAILS is required');
  });

  it('builds a self-hosted admin application payload scoped to /admin/*', () => {
    const config = readAccessConfig({
      CLOUDFLARE_API_TOKEN: 'token',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_ACCESS_ADMIN_DOMAIN: 'preview.example.pages.dev',
      CLOUDFLARE_ACCESS_ADMIN_PATH: '/admin/*',
      CLOUDFLARE_ACCESS_APP_NAME: 'KevinTen Admin Preview',
      ADMIN_EMAILS: 'kevin@example.com'
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
});
