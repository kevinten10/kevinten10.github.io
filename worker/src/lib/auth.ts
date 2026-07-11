import { decodeProtectedHeader, importJWK, jwtVerify, type JWTPayload, type JWK } from 'jose';
import type { Context, Next } from 'hono';
import type { AuthUser, Env, Variables } from '../types';
import { newId, nowIso } from './ids';
import { fail } from './http';

type Jwks = { keys: JWK[] };

function issuer(env: Env): string {
  if (!env.AUTH0_DOMAIN) return '';
  return `https://${env.AUTH0_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '')}/`;
}

function adminEmails(env: Env): string[] {
  return (env.ADMIN_EMAILS || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
}

async function loadJwks(env: Env): Promise<Jwks> {
  const cacheKey = `jwks:${env.AUTH0_DOMAIN}`;
  const cached = await env.SITE_KV.get(cacheKey, 'json') as Jwks | null;
  if (cached?.keys?.length) return cached;

  const response = await fetch(`${issuer(env)}.well-known/jwks.json`);
  if (!response.ok) throw new Error('Unable to load Auth0 JWKS');
  const jwks = await response.json() as Jwks;
  await env.SITE_KV.put(cacheKey, JSON.stringify(jwks), { expirationTtl: 3600 });
  return jwks;
}

export async function verifyAuth0Token(token: string, env: Env): Promise<AuthUser> {
  if (!env.AUTH0_DOMAIN || !env.AUTH0_AUDIENCE) throw new Error('Auth0 environment is not configured');
  const header = decodeProtectedHeader(token);
  if (header.alg !== 'RS256') throw new Error('Unsupported JWT algorithm');
  const jwks = await loadJwks(env);
  const jwk = jwks.keys.find((key) => key.kid === header.kid);
  if (!jwk || jwk.kty !== 'RSA' || (jwk.use && jwk.use !== 'sig') || (jwk.alg && jwk.alg !== 'RS256')) {
    throw new Error('JWT signing key not found');
  }
  const key = await importJWK(jwk, 'RS256');
  const verified = await jwtVerify(token, key, {
    issuer: issuer(env),
    audience: env.AUTH0_AUDIENCE,
    algorithms: ['RS256']
  });
  const payload = verified.payload as JWTPayload & { email?: string; email_verified?: boolean; name?: string; picture?: string };
  const email = payload.email?.toLowerCase();
  const role = email && payload.email_verified === true && adminEmails(env).includes(email) ? 'admin' : 'visitor';
  return {
    sub: String(payload.sub || ''),
    email,
    name: payload.name,
    picture: payload.picture,
    role
  };
}

export async function upsertUser(env: Env, authUser: AuthUser): Promise<AuthUser> {
  const existing = await env.DB.prepare('select * from users where provider_subject = ?').bind(authUser.sub).first<Record<string, string>>();
  const userId = existing?.id || newId('usr');
  const role = authUser.role;
  if (existing) {
    await env.DB.prepare('update users set email = ?, display_name = ?, avatar_url = ?, role = ?, updated_at = ? where id = ?')
      .bind(authUser.email || null, authUser.name || null, authUser.picture || null, role, nowIso(), userId)
      .run();
  } else {
    await env.DB.prepare('insert into users (id, auth_provider, provider_subject, email, display_name, avatar_url, role) values (?, ?, ?, ?, ?, ?, ?)')
      .bind(userId, 'auth0', authUser.sub, authUser.email || null, authUser.name || null, authUser.picture || null, role)
      .run();
  }
  return { ...authUser, userId };
}

export async function optionalAuth(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next): Promise<void | Response> {
  const header = c.req.header('Authorization') || '';
  if (header.startsWith('Bearer ')) {
    try {
      const authUser = await verifyAuth0Token(header.slice(7), c.env);
      c.set('authUser', await upsertUser(c.env, authUser));
    } catch (err) {
      return fail(c, 401, 'Invalid authorization token');
    }
  }
  await next();
}

export async function requireAuth(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next): Promise<void | Response> {
  const authUser = c.get('authUser');
  if (!authUser) return fail(c, 401, 'Authentication required');
  await next();
}

export async function requireAdmin(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next): Promise<void | Response> {
  const authUser = c.get('authUser');
  if (authUser?.role === 'admin') {
    await next();
    return;
  }
  return fail(c, 403, 'Admin access required');
}
