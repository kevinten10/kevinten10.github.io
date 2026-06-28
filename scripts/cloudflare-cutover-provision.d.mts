export type CutoverProvisionConfig = {
  cloudflareAuth: unknown;
  accountId: string;
  pagesProject: string;
  zoneName: string;
  productionDomains: string[];
  adminPath: string;
  sessionDuration: string;
  adminEmails: string[];
};

export function splitDomains(value?: string): string[];

export function accessAppNameForDomain(domain: string): string;

export function accessPolicyNameForDomain(domain: string): string;

export function readCutoverProvisionConfig(
  env?: Record<string, string | undefined>,
  options?: {
    readWranglerOAuthToken?: (env?: Record<string, string | undefined>) => string;
  }
): CutoverProvisionConfig;

export function ensurePagesDomains(config: CutoverProvisionConfig): Promise<Array<Record<string, unknown>>>;

export function ensureZone(config: CutoverProvisionConfig): Promise<{
  created: boolean;
  zone: Record<string, unknown>;
}>;

export function ensureProductionAccess(config: CutoverProvisionConfig): Promise<Array<Record<string, unknown>>>;

export function provisionCutover(
  env?: Record<string, string | undefined>,
  options?: {
    readWranglerOAuthToken?: (env?: Record<string, string | undefined>) => string;
  }
): Promise<Record<string, unknown>>;

export function isCutoverProvisionComplete(summary: Record<string, unknown>): boolean;
