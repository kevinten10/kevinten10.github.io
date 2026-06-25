import { spawnSync } from 'node:child_process';

const workerUrl = process.env.WORKER_API_URL || 'http://localhost:8787';
const endpoint = `${workerUrl.replace(/\/$/, '')}/api/webhooks/stripe`;

function run(args, allowFail = true) {
  console.log(`\n$ stripe ${args.join(' ')}`);
  const result = spawnSync('stripe', args, { stdio: 'inherit', shell: true });
  if (result.status !== 0 && !allowFail) process.exit(result.status || 1);
  return result.status === 0;
}

if (!run(['config', '--list'])) {
  console.log('Stripe CLI is not logged in. Run: stripe login, then rerun npm run provision:stripe');
  process.exit(0);
}

run(['webhook_endpoints', 'create', '--url', endpoint, '--enabled-events', 'checkout.session.completed']);
run(['trigger', 'checkout.session.completed']);
console.log('\nStripe provisioning/test attempted. Store the webhook signing secret in Cloudflare Worker secrets.');
