import type { Env } from '../types';
import { cleanText } from './ids';

export type PublicSiteConfig = {
  commentsEnabled: boolean;
  rewardsEnabled: boolean;
  publicStatsEnabled: boolean;
  rewardCurrency: string;
  rewardMessage: string;
};

const SITE_CONFIG_KEY = 'site_config:public';

export const defaultSiteConfig: PublicSiteConfig = {
  commentsEnabled: true,
  rewardsEnabled: true,
  publicStatsEnabled: true,
  rewardCurrency: 'CNY',
  rewardMessage: ''
};

function boolOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeSiteConfig(input: Record<string, unknown> | null | undefined): PublicSiteConfig {
  return {
    commentsEnabled: boolOrDefault(input?.commentsEnabled, defaultSiteConfig.commentsEnabled),
    rewardsEnabled: boolOrDefault(input?.rewardsEnabled, defaultSiteConfig.rewardsEnabled),
    publicStatsEnabled: boolOrDefault(input?.publicStatsEnabled, defaultSiteConfig.publicStatsEnabled),
    rewardCurrency: (cleanText(input?.rewardCurrency || defaultSiteConfig.rewardCurrency, 8).toUpperCase() || 'CNY'),
    rewardMessage: cleanText(input?.rewardMessage || defaultSiteConfig.rewardMessage, 200)
  };
}

export async function getPublicSiteConfig(env: Env): Promise<PublicSiteConfig> {
  const stored = await env.SITE_KV.get(SITE_CONFIG_KEY, 'json') as Record<string, unknown> | null;
  return normalizeSiteConfig(stored);
}

export async function setPublicSiteConfig(env: Env, input: Record<string, unknown>): Promise<PublicSiteConfig> {
  const current = await getPublicSiteConfig(env);
  const next = normalizeSiteConfig({ ...current, ...input });
  await env.SITE_KV.put(SITE_CONFIG_KEY, JSON.stringify(next));
  return next;
}
