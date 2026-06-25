import { spawnSync } from 'node:child_process';

const names = {
  pages: process.env.CLOUDFLARE_PAGES_PROJECT || 'kevinten-interactive-preview',
  d1: process.env.CLOUDFLARE_D1_NAME || 'kevinten_site_preview',
  kv: process.env.CLOUDFLARE_KV_NAME || 'kevinten_site_preview_kv',
  r2: process.env.CLOUDFLARE_R2_BUCKET || 'kevinten-site-preview-assets',
  queue: process.env.CLOUDFLARE_QUEUE_NAME || 'kevinten-site-preview-events'
};

function run(args, allowFail = true) {
  console.log(`\n$ npx wrangler ${args.join(' ')}`);
  const result = spawnSync('npx', ['wrangler', ...args], { stdio: 'inherit', shell: true });
  if (result.status !== 0 && !allowFail) process.exit(result.status || 1);
  return result.status === 0;
}

if (!run(['whoami'])) {
  console.log('Cloudflare CLI is not logged in. Run: npx wrangler login');
  process.exit(0);
}

run(['d1', 'create', names.d1]);
run(['kv:namespace', 'create', 'SITE_KV', '--preview']);
run(['r2', 'bucket', 'create', names.r2]);
run(['queues', 'create', names.queue]);
run(['pages', 'project', 'create', names.pages, '--production-branch', 'preview']);

console.log('\nProvisioning attempted. Copy generated D1/KV IDs into worker/wrangler.toml before deploy.');
