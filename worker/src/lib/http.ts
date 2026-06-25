import type { Context } from 'hono';

export function ok<T>(c: Context, data: T, status = 200): Response {
  return c.json({ success: true, data }, status as never);
}

export function fail(c: Context, status: number, error: string): Response {
  return c.json({ success: false, error }, status as never);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Stripe-Signature',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Vary': 'Origin'
  };
}
