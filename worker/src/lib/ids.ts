export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function cleanText(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export function normalizeVisitorKey(value: unknown): string {
  const text = cleanText(value, 96);
  return /^[a-zA-Z0-9_-]{8,96}$/.test(text) ? text : '';
}
