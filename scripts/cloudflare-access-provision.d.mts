export type CloudflareAccessConfig = {
  token: string;
  accountId: string;
  adminDomain: string;
  adminPath: string;
  appName: string;
  policyName: string;
  sessionDuration: string;
  adminEmails: string[];
};

export function readAccessConfig(env?: Record<string, string | undefined>): CloudflareAccessConfig;

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
