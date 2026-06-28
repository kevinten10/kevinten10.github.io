export type RewardQrItem = {
  name: string;
  file: string;
  provider: string;
};

export type RewardQrResult = RewardQrItem & {
  decoded: string;
  ok: boolean;
  reason: string;
};

export function classifyRewardQr(provider: string, value: string): {
  ok: boolean;
  reason: string;
};

export function decodeQrFile(file: string): Promise<string>;

export function verifyRewardQrs(items?: RewardQrItem[]): Promise<RewardQrResult[]>;

export function printRewardQrResults(results: RewardQrResult[]): void;
