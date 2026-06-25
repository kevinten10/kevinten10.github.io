import { describe, expect, it } from 'vitest';
import { computeStripeSignature, verifyStripeSignature } from '../src/lib/stripe';

describe('stripe signatures', () => {
  it('verifies a valid signature', async () => {
    const timestamp = '12345';
    const payload = '{"type":"checkout.session.completed"}';
    const secret = 'whsec_test';
    const sig = await computeStripeSignature(secret, timestamp, payload);
    await expect(verifyStripeSignature(`t=${timestamp},v1=${sig}`, payload, secret)).resolves.toBe(true);
    await expect(verifyStripeSignature(`t=${timestamp},v1=bad`, payload, secret)).resolves.toBe(false);
  });
});
