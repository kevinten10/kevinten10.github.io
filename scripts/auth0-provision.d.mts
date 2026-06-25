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

export function provisionAuth0(env?: Record<string, string | undefined>): boolean;
