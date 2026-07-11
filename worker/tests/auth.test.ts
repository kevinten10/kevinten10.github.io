import { describe, expect, it } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { verifyAuth0Token } from '../src/lib/auth';
import type { Env } from '../src/types';
import { MemoryKV } from './helpers';

async function buildEnvAndToken(options: {
  audience?: string;
  email?: string;
  adminEmails?: string;
  emailVerified?: boolean;
  jwkAlg?: string;
  issuer?: string;
}) {
  const issuer = options.issuer || 'https://kevinten-test.auth0.com/';
  const audience = options.audience || 'https://kevinten-preview/api';
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = 'test-key';
  publicJwk.alg = options.jwkAlg || 'RS256';
  publicJwk.use = 'sig';

  const kv = new MemoryKV();
  await kv.put('jwks:kevinten-test.auth0.com', JSON.stringify({ keys: [publicJwk] }));

  const env = {
    AUTH0_DOMAIN: 'kevinten-test.auth0.com',
    AUTH0_AUDIENCE: 'https://kevinten-preview/api',
    ADMIN_EMAILS: options.adminEmails || '',
    SITE_KV: kv
  } as unknown as Env;

  const token = await new SignJWT({
    sub: 'auth0|visitor-1',
    email: options.email,
    email_verified: options.emailVerified ?? true,
    name: 'Visitor One',
    picture: 'https://example.com/avatar.png'
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime('5m')
    .sign(privateKey);

  return { env, token };
}

describe('Auth0 token verification', () => {
  it('verifies issuer, audience, signature, and maps admin email role', async () => {
    const { env, token } = await buildEnvAndToken({
      email: 'Admin@Example.com',
      adminEmails: 'admin@example.com'
    });

    const user = await verifyAuth0Token(token, env);

    expect(user).toMatchObject({
      sub: 'auth0|visitor-1',
      email: 'admin@example.com',
      name: 'Visitor One',
      picture: 'https://example.com/avatar.png',
      role: 'admin'
    });
  });

  it('rejects a token with the wrong audience', async () => {
    const { env, token } = await buildEnvAndToken({
      audience: 'https://wrong-api'
    });

    await expect(verifyAuth0Token(token, env)).rejects.toThrow();
  });

  it('does not grant admin role to an unverified matching email claim', async () => {
    const { env, token } = await buildEnvAndToken({
      email: 'admin@example.com',
      adminEmails: 'admin@example.com',
      emailVerified: false
    });

    const user = await verifyAuth0Token(token, env);

    expect(user.role).toBe('visitor');
  });

  it('rejects tokens from the wrong issuer', async () => {
    const { env, token } = await buildEnvAndToken({
      issuer: 'https://wrong-tenant.auth0.com/'
    });

    await expect(verifyAuth0Token(token, env)).rejects.toThrow();
  });

  it('rejects cached JWKS keys that are not RS256 signing keys', async () => {
    const { env, token } = await buildEnvAndToken({
      jwkAlg: 'HS256'
    });

    await expect(verifyAuth0Token(token, env)).rejects.toThrow('JWT signing key not found');
  });
});
