import { describe, expect, it } from 'vitest';
import {
  buildCreateArgs,
  buildListArgs,
  buildStripeConfig,
  buildTriggerArgs,
  findMatchingEndpoint
} from '../../scripts/stripe-provision.mjs';

describe('Stripe provisioning helpers', () => {
  it('requires an explicit worker API URL', () => {
    expect(() => buildStripeConfig({})).toThrow('WORKER_API_URL is required');
  });

  it('builds test-mode webhook args without live flags by default', () => {
    const config = buildStripeConfig({
      WORKER_API_URL: 'https://api.example.workers.dev'
    });

    expect(config.endpoint).toBe('https://api.example.workers.dev/api/webhooks/stripe');
    expect(buildListArgs(config)).not.toContain('--live');
    expect(buildCreateArgs(config)).not.toContain('--live');
    expect(buildTriggerArgs(config)).toEqual(['trigger', 'checkout.session.completed']);
  });

  it('refuses live-mode provisioning for this mainland personal setup', () => {
    expect(() => buildStripeConfig({
      WORKER_API_URL: 'https://api.example.workers.dev/',
      STRIPE_MODE: 'live',
      STRIPE_PROJECT_NAME: 'production'
    })).toThrow('sandbox/test mode only');
  });

  it('finds an existing endpoint only when the URL and event match', () => {
    expect(findMatchingEndpoint({
      data: [
        {
          id: 'we_wrong_event',
          url: 'https://api.example.workers.dev/api/webhooks/stripe',
          enabled_events: ['payment_intent.succeeded']
        },
        {
          id: 'we_match',
          url: 'https://api.example.workers.dev/api/webhooks/stripe',
          enabled_events: ['checkout.session.completed']
        }
      ]
    }, 'https://api.example.workers.dev/api/webhooks/stripe')).toMatchObject({
      id: 'we_match'
    });
  });
});
