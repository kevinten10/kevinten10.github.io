export function normalizeHostname(value: string): string;

export function normalizeNameservers(nameservers: string[]): string[];

export function hasCloudflareNameservers(nameservers: string[]): boolean;

export function hasGithubPagesAddress(addresses: string[]): boolean;

export function includesAll(actual: string[], expected: string[]): boolean;

export function hasActivePagesDomains(
  records: Array<{
    name?: string;
    domain?: string;
    status?: string;
  } | string>,
  hosts: string[]
): boolean;

export function describePagesDomains(
  records: Array<{
    name?: string;
    domain?: string;
    status?: string;
  } | string>,
  hosts: string[]
): string[];

export function parseCurlResponseOutput(stdout: string): {
  status: number;
  text: string;
  headersText: string;
  headers: {
    get(name: string): string | null;
  };
};

export type CutoverAudit = {
  schemaVersion: 1;
  startedAt: string;
  completedAt?: string;
  apiBaseUrl: string;
  pagesUrl: string;
  productionOrigins: string[];
  ready?: boolean;
  totalChecks?: number;
  passedChecks?: number;
  failedChecks?: number;
  checks: Array<{
    name: string;
    status: 'ok' | 'not_ready';
    detail?: string;
  }>;
};

export function createCutoverAudit(options?: {
  startedAt?: string;
  apiBaseUrl?: string;
  pagesUrl?: string;
  productionOrigins?: string[];
}): CutoverAudit;

export function recordCutoverCheck(
  audit: CutoverAudit | null | undefined,
  name: string,
  ok: boolean,
  detail?: string
): {
  name: string;
  status: 'ok' | 'not_ready';
  detail?: string;
};

export function finalizeCutoverAudit(
  audit: CutoverAudit,
  ready: boolean,
  completedAt?: string
): CutoverAudit & {
  completedAt: string;
  ready: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
};

export function hasExpectedPagesDnsRecords(
  records: Array<{
    name?: string;
    type?: string;
    content?: string;
    proxied?: boolean;
  }>,
  hosts: string[],
  target?: string
): boolean;

export function describeExpectedPagesDnsRecords(
  records: Array<{
    name?: string;
    type?: string;
    content?: string;
    proxied?: boolean;
  }>,
  hosts: string[],
  target?: string
): string[];

export function parseDigResponse(stdout: string): {
  status: string;
  answers: Array<{
    name: string;
    ttl: number;
    type: string;
    value: string;
  }>;
  addresses: string[];
  cnames: string[];
};

export function parseNslookupResponse(stdout: string): {
  status: string;
  nameservers: string[];
  answers: number;
  addresses: string[];
  cnames: string[];
};

export function auth0AppShowArgs(clientId: string): string[];

export function auth0Executable(env?: Record<string, string | undefined>): string;

export function auth0ChildEnv(env?: Record<string, string | undefined>): Record<string, string | undefined>;

export function isAuthoritativeDnsReady(summary?: {
  status?: string;
  addresses?: string[];
  cnames?: string[];
}): boolean;

export function isProductionHttpReady(summary?: {
  status?: number;
  server?: string;
  cfRay?: string;
  githubRequestId?: string;
  bodyText?: string;
}): boolean;

export function hasCloudflareAccessMarker(summary?: {
  location?: string;
  finalUrl?: string;
  bodyText?: string;
}): boolean;

export function isCloudflareAccessProtected(summary?: {
  status?: number;
  server?: string;
  cfRay?: string;
  location?: string;
  finalUrl?: string;
  bodyText?: string;
}): boolean;

export function verifyCutoverReadiness(env?: Record<string, string | undefined>): Promise<boolean>;
