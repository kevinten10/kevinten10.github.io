import { describe, expect, it } from 'vitest';
import {
  buildProvisionCommands,
  readCloudflareProvisionConfig,
  resolveWranglerCommand
} from '../../scripts/cloudflare-provision.mjs';

describe('Cloudflare provisioning helpers', () => {
  it('uses preview-safe default resource names', () => {
    const config = readCloudflareProvisionConfig({});

    expect(config).toMatchObject({
      pages: 'kevinten-interactive-preview',
      d1: 'kevinten_site_preview',
      kv: 'SITE_KV',
      r2: 'kevinten-site-preview-assets',
      queue: 'kevintenpreviewevents'
    });
  });

  it('builds the Wrangler resource creation commands in order', () => {
    const commands = buildProvisionCommands(readCloudflareProvisionConfig({}));

    expect(commands).toEqual([
      ['d1', 'create', 'kevinten_site_preview'],
      ['kv', 'namespace', 'create', 'SITE_KV', '--preview'],
      ['r2', 'bucket', 'create', 'kevinten-site-preview-assets'],
      ['queues', 'create', 'kevintenpreviewevents'],
      ['pages', 'project', 'create', 'kevinten-interactive-preview', '--production-branch', 'preview']
    ]);
  });

  it('prefers local Wrangler over npx when it exists', () => {
    expect(resolveWranglerCommand('D:/project/site', (candidate) => {
      return candidate.endsWith('node_modules/wrangler/bin/wrangler.js')
        || candidate.endsWith('node_modules\\wrangler\\bin\\wrangler.js');
    })).toEqual({
      command: process.execPath,
      prefixArgs: ['D:/project/site/node_modules/wrangler/bin/wrangler.js']
    });
  });
});
