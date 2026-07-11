import type { Context } from 'hono';
import type { Env } from '../types';

const previewHost = 'kevinten-interactive-preview.pages.dev';

export function ok<T>(c: Context, data: T, status = 200): Response {
  return c.json({ success: true, data }, status as never);
}

export function fail(c: Context, status: number, error: string): Response {
  return c.json({ success: false, error }, status as never);
}

function configuredOrigins(env?: Env): string[] {
  return [env?.SITE_ORIGIN, ...(env?.ALLOWED_ORIGINS || '').split(',')]
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item));
}

function allowedOrigin(origin: string | null, env?: Env): string {
  if (!origin) return '*';
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    const isPreview = host === previewHost || host.endsWith(`.${previewHost}`);
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    if ((url.protocol === 'https:' && isPreview) || (url.protocol === 'http:' && isLocal)) return origin;
    if (configuredOrigins(env).includes(origin)) return origin;
  } catch (err) {
    return '';
  }
  return '';
}

export function corsHeaders(origin: string | null, env?: Env): Record<string, string> {
  const allowed = allowedOrigin(origin, env);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Stripe-Signature',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Vary': 'Origin'
  };
  if (allowed) headers['Access-Control-Allow-Origin'] = allowed;
  return headers;
}
