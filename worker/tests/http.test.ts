import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { corsHeaders, fail, ok } from '../src/lib/http';

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
    expect(corsHeaders('https://example.com')).toMatchObject({
      'Access-Control-Allow-Origin': 'https://example.com',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, Stripe-Signature',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      Vary: 'Origin'
    });
  });
});
