export function resolveAuth0Command(
  env?: Record<string, string | undefined>,
  exists?: (candidate: string) => boolean
): string;

export function shouldAttemptMachineLogin(env?: Record<string, string | undefined>): boolean;

export function buildMachineLoginArgs(env?: Record<string, string | undefined>): string[];

export function buildAuth0Config(env?: Record<string, string | undefined>): {
  audience: string;
  callback: string;
  logout: string;
  origin: string;
};

export function extractAuth0ClientId(stdout: string): string;

export function buildCloudflareRuntimeEnv(
  env?: Record<string, string | undefined>,
  clientId?: string
): {
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_AUDIENCE: string;
  AUTH0_CALLBACK_URL: string;
  AUTH0_LOGOUT_URL: string;
  AUTH0_ALLOWED_ORIGIN: string;
};

export function formatEnvFile(values: Record<string, string | undefined>): string;

export function provisionAuth0(env?: Record<string, string | undefined>): Promise<boolean>;
