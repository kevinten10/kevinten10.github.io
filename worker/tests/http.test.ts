import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { corsHeaders, fail, ok } from '../src/lib/http';
import type { Env } from '../src/types';

describe('API response helpers', () => {
  it('wraps success responses in the shared envelope', async () => {
    const app = new Hono();
    app.get('/ok', (c) => ok(c, { answer: 42 }, 201));

    const response = await app.request('/ok');

    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { answer: 42 }
    });
    expect(response.status).toBe(201);
  });

  it('wraps error responses in the shared envelope', async () => {
    const app = new Hono();
    app.get('/fail', (c) => fail(c, 429, 'Too many requests'));

    const response = await app.request('/fail');

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Too many requests'
    });
    expect(response.status).toBe(429);
  });

  it('sets CORS headers for API clients and Stripe webhooks', () => {
    expect(corsHeaders('https://kevinten-interactive-preview.pages.dev', {} as Env)).toMatchObject({
      'Access-Control-Allow-Origin': 'https://kevinten-interactive-preview.pages.dev',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, Stripe-Signature',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      Vary: 'Origin'
    });
  });

  it('allows configured production custom domains for API clients', () => {
    const env = {
      ALLOWED_ORIGINS: 'https://kevinten.com,https://www.kevinten.com'
    } as Env;

    expect(corsHeaders('https://kevinten.com', env)['Access-Control-Allow-Origin']).toBe('https://kevinten.com');
    expect(corsHeaders('https://www.kevinten.com', env)['Access-Control-Allow-Origin']).toBe('https://www.kevinten.com');
  });

  it('does not reflect arbitrary CORS origins', () => {
    expect(corsHeaders('https://evil.example', {} as Env)['Access-Control-Allow-Origin']).toBeUndefined();
  });
});
