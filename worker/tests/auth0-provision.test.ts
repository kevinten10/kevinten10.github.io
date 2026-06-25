import { describe, expect, it } from 'vitest';
import {
  buildMachineLoginArgs,
  resolveAuth0Command,
  shouldAttemptMachineLogin
} from '../../scripts/auth0-provision.mjs';

describe('Auth0 provisioning helpers', () => {
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
});
