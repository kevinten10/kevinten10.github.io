import { describe, expect, it } from 'vitest';
import { computeStripeSignature, verifyStripeSignature } from '../src/lib/stripe';

describe('stripe signatures', () => {
  it('verifies a valid signature', async () => {
    const nowMs = 1_782_432_000_000;
    const timestamp = String(Math.floor(nowMs / 1000));
    const payload = '{"type":"checkout.session.completed"}';
    const secret = 'whsec_test';
    const sig = await computeStripeSignature(secret, timestamp, payload);
    await expect(verifyStripeSignature(`t=${timestamp},v1=${sig}`, payload, secret, { nowMs })).resolves.toBe(true);
    await expect(verifyStripeSignature(`t=${timestamp},v1=bad`, payload, secret, { nowMs })).resolves.toBe(false);
  });

  it('rejects replayed signatures outside the allowed tolerance', async () => {
    const nowMs = 1_782_432_000_000;
    const timestamp = String(Math.floor(nowMs / 1000) - 301);
    const payload = '{"type":"checkout.session.completed"}';
    const secret = 'whsec_test';
    const sig = await computeStripeSignature(secret, timestamp, payload);

    await expect(verifyStripeSignature(`t=${timestamp},v1=${sig}`, payload, secret, { nowMs })).resolves.toBe(false);
  });
});
