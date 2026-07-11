export type StripeProvisionConfig = {
  mode: 'test' | 'live';
  projectName: string;
  endpoint: string;
  description: string;
  secretOut: string;
  triggerSmoke: boolean;
};

export function buildStripeConfig(env?: Record<string, string | undefined>): StripeProvisionConfig;

export function stripeGlobalArgs(config: StripeProvisionConfig): string[];

export function stripeModeArgs(config: StripeProvisionConfig): string[];

export function findMatchingEndpoint(
  listResponse: unknown,
  endpoint: string
): Record<string, unknown> | null;

export function buildListArgs(config: StripeProvisionConfig): string[];

export function buildCreateArgs(config: StripeProvisionConfig): string[];

export function buildTriggerArgs(config: StripeProvisionConfig): string[];

export function provisionStripe(env?: Record<string, string | undefined>): boolean;
