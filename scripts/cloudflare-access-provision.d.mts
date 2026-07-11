export type CloudflareAuth =
  | { source: 'api-token' | 'wrangler-oauth'; token: string }
  | { source: 'global-key'; email: string; key: string };

export type CloudflareAccessConfig = {
  cloudflareAuth: CloudflareAuth;
  accountId: string;
  adminDomain: string;
  adminPath: string;
  appName: string;
  policyName: string;
  sessionDuration: string;
  adminEmails: string[];
};

export function wranglerConfigCandidates(env?: Record<string, string | undefined>): string[];

export function readWranglerOAuthToken(env?: Record<string, string | undefined>): string;

export function readAccessConfig(
  env?: Record<string, string | undefined>,
  options?: {
    readWranglerOAuthToken?: (env?: Record<string, string | undefined>) => string;
  }
): CloudflareAccessConfig;

export function buildCloudflareHeaders(cloudflareAuth: CloudflareAuth): Record<string, string>;

export function buildAccessApplicationPayload(config: CloudflareAccessConfig): {
  name: string;
  domain: string;
  type: 'self_hosted';
  session_duration: string;
  auto_redirect_to_identity: boolean;
};

export function buildAccessPolicyPayload(config: CloudflareAccessConfig): {
  name: string;
  decision: 'allow';
  include: Array<{ email: { email: string } }>;
};

export function provisionAccess(config: CloudflareAccessConfig): Promise<{
  app: Record<string, unknown>;
  policy: Record<string, unknown>;
}>;
