export type CloudflareProvisionConfig = {
  pages: string;
  d1: string;
  kv: string;
  r2: string;
  queue: string;
};

export function readCloudflareProvisionConfig(env?: Record<string, string | undefined>): CloudflareProvisionConfig;

export function buildProvisionCommands(config: CloudflareProvisionConfig): string[][];

export function resolveWranglerCommand(
  root?: string,
  exists?: (candidate: string) => boolean
): {
  command: string;
  prefixArgs: string[];
};

export function provisionCloudflare(env?: Record<string, string | undefined>, root?: string): boolean;
