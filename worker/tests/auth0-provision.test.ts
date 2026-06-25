import { describe, expect, it } from 'vitest';
import {
  buildAuth0Config,
  buildCloudflareRuntimeEnv,
  buildMachineLoginArgs,
  extractAuth0ClientId,
  formatEnvFile,
  resolveAuth0Command,
  shouldAttemptMachineLogin
} from '../../scripts/auth0-provision.mjs';

describe('Auth0 provisioning helpers', () => {
  it('defaults Auth0 callbacks to the Cloudflare preview URL', () => {
    expect(buildAuth0Config({})).toEqual({
      audience: 'https://kevinten-preview/api',
      callback: 'https://kevinten-interactive-preview.pages.dev/',
      logout: 'https://kevinten-interactive-preview.pages.dev/',
      origin: 'https://kevinten-interactive-preview.pages.dev'
    });
  });

  it('prefers an explicit Auth0 CLI path from the environment', () => {
    expect(resolveAuth0Command({
      AUTH0_CLI: 'D:/tools/auth0.exe'
    }, () => false)).toBe('D:/tools/auth0.exe');
  });

  it('falls back to the known Windows install path when it exists', () => {
    expect(resolveAuth0Command({}, (candidate) => {
      return candidate.endsWith('Auth0CLI/auth0.exe') || candidate.endsWith('Auth0CLI\\auth0.exe');
    })).toContain('Auth0CLI');
  });

  it('builds machine login args only when all machine credentials are present', () => {
    expect(shouldAttemptMachineLogin({
      AUTH0_DOMAIN: 'tenant.auth0.com',
      AUTH0_CLIENT_ID: 'client-id',
      AUTH0_CLIENT_SECRET: 'client-secret'
    })).toBe(true);
    expect(shouldAttemptMachineLogin({
      AUTH0_DOMAIN: 'tenant.auth0.com',
      AUTH0_CLIENT_ID: 'client-id'
    })).toBe(false);

    expect(buildMachineLoginArgs({
      AUTH0_DOMAIN: 'tenant.auth0.com',
      AUTH0_CLIENT_ID: 'client-id',
      AUTH0_CLIENT_SECRET: 'client-secret'
    })).toEqual([
      'login',
      '--domain',
      'tenant.auth0.com',
      '--client-id',
      'client-id',
      '--client-secret',
      'client-secret'
    ]);
  });

  it('extracts a SPA client id from Auth0 CLI JSON output', () => {
    expect(extractAuth0ClientId('{"client_id":"abc123","name":"KevinTen"}')).toBe('abc123');
    expect(extractAuth0ClientId('[{"client_id":"first"},{"client_id":"second"}]')).toBe('first');
    expect(extractAuth0ClientId('not json')).toBe('');
  });

  it('builds non-secret Cloudflare runtime env values after Auth0 provisioning', () => {
    expect(buildCloudflareRuntimeEnv({
      AUTH0_DOMAIN: 'tenant.auth0.com',
      AUTH0_AUDIENCE: 'https://kevinten-preview/api',
      AUTH0_CALLBACK_URL: 'https://preview.pages.dev/',
      AUTH0_LOGOUT_URL: 'https://preview.pages.dev/',
      AUTH0_ALLOWED_ORIGIN: 'https://preview.pages.dev'
    }, 'client-id')).toEqual({
      AUTH0_DOMAIN: 'tenant.auth0.com',
      AUTH0_CLIENT_ID: 'client-id',
      AUTH0_AUDIENCE: 'https://kevinten-preview/api',
      AUTH0_CALLBACK_URL: 'https://preview.pages.dev/',
      AUTH0_LOGOUT_URL: 'https://preview.pages.dev/',
      AUTH0_ALLOWED_ORIGIN: 'https://preview.pages.dev'
    });
  });

  it('formats generated env files without secret values', () => {
    const text = formatEnvFile({
      AUTH0_DOMAIN: 'tenant.auth0.com',
      AUTH0_CLIENT_ID: 'client-id',
      AUTH0_AUDIENCE: 'https://kevinten-preview/api'
    });

    expect(text).toContain('AUTH0_DOMAIN=tenant.auth0.com');
    expect(text).toContain('AUTH0_CLIENT_ID=client-id');
    expect(text).not.toContain('AUTH0_CLIENT_SECRET');
  });
});
