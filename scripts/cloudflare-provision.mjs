import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function readCloudflareProvisionConfig(env = process.env) {
  return {
    pages: env.CLOUDFLARE_PAGES_PROJECT || 'kevinten-interactive-preview',
    d1: env.CLOUDFLARE_D1_NAME || 'kevinten_site_preview',
    kv: env.CLOUDFLARE_KV_BINDING || 'SITE_KV',
    r2: env.CLOUDFLARE_R2_BUCKET || 'kevinten-site-preview-assets',
    queue: env.CLOUDFLARE_QUEUE_NAME || 'kevintenpreviewevents'
  };
}

export function buildProvisionCommands(config) {
  return [
    ['d1', 'create', config.d1],
    ['kv', 'namespace', 'create', config.kv, '--preview'],
    ['r2', 'bucket', 'create', config.r2],
    ['queues', 'create', config.queue],
    ['pages', 'project', 'create', config.pages, '--production-branch', 'preview']
  ];
}

export function resolveWranglerCommand(root = process.cwd(), exists = existsSync) {
  const localWrangler = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js').replace(/\\/g, '/');
  if (exists(localWrangler)) {
    return {
      command: process.execPath,
      prefixArgs: [localWrangler]
    };
  }
  return {
    command: 'npx',
    prefixArgs: ['wrangler']
  };
}

function formatCommand(command, args) {
  const name = command === process.execPath ? 'node' : command;
  return `${name} ${args.join(' ')}`;
}

function run(wrangler, args, allowFail = true) {
  const commandArgs = [...wrangler.prefixArgs, ...args];
  console.log(`\n$ ${formatCommand(wrangler.command, commandArgs)}`);
  const result = spawnSync(wrangler.command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32' && wrangler.command === 'npx'
  });
  if (result.status !== 0 && !allowFail) process.exit(result.status || 1);
  return result.status === 0;
}

export function provisionCloudflare(env = process.env, root = process.cwd()) {
  const config = readCloudflareProvisionConfig(env);
  const wrangler = resolveWranglerCommand(root);

  if (!run(wrangler, ['whoami'])) {
    console.log('Cloudflare CLI is not logged in. Run: npx wrangler login');
    return false;
  }

  for (const command of buildProvisionCommands(config)) {
    run(wrangler, command);
  }

  console.log('\nProvisioning attempted. Copy generated D1/KV IDs into worker/wrangler.toml before deploy.');
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  provisionCloudflare();
}
