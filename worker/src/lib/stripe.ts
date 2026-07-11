function parseSignatureHeader(value: string): { timestamp: string; signatures: string[] } {
  const parts = value.split(',').map((item) => item.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) || '';
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  return { timestamp, signatures };
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length || !/^[0-9a-f]+$/i.test(a) || !/^[0-9a-f]+$/i.test(b)) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function computeStripeSignature(secret: string, timestamp: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  return toHex(signed);
}

export async function verifyStripeSignature(
  header: string,
  payload: string,
  secret: string,
  options: { nowMs?: number; toleranceSeconds?: number } = {}
): Promise<boolean> {
  if (!header || !secret) return false;
  const { timestamp, signatures } = parseSignatureHeader(header);
  if (!timestamp || signatures.length === 0) return false;
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1000);
  const toleranceSeconds = options.toleranceSeconds ?? 300;
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) return false;
  const expected = await computeStripeSignature(secret, timestamp, payload);
  return signatures.some((signature) => timingSafeEqualHex(signature, expected));
}
