import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const requiredEvent = 'checkout.session.completed';

function envValue(env, key) {
  return env[key]?.trim() || '';
}

export function buildStripeConfig(env = process.env) {
  const workerUrl = envValue(env, 'WORKER_API_URL');
  if (!workerUrl) throw new Error('WORKER_API_URL is required, for example: https://kevinten-api-preview.wshten.workers.dev');

  const mode = envValue(env, 'STRIPE_MODE') || 'test';
  if (mode !== 'test') {
    throw new Error('This project keeps Stripe in sandbox/test mode only. Leave STRIPE_MODE empty or set STRIPE_MODE="test".');
  }

  return {
    mode,
    projectName: envValue(env, 'STRIPE_PROJECT_NAME'),
    endpoint: `${workerUrl.replace(/\/$/, '')}/api/webhooks/stripe`,
    description: envValue(env, 'STRIPE_WEBHOOK_DESCRIPTION') || `KevinTen Cloudflare ${mode} webhook`,
    secretOut: envValue(env, 'STRIPE_WEBHOOK_SECRET_OUT'),
    triggerSmoke: envValue(env, 'STRIPE_TRIGGER_SMOKE') === '1'
  };
}

export function stripeGlobalArgs(config) {
  return config.projectName ? ['--project-name', config.projectName] : [];
}

export function stripeModeArgs(config) {
  return [];
}

function formatCommand(args) {
  return `stripe ${args.join(' ')}`;
}

function runStripe(args, { capture = false, allowFail = false } = {}) {
  console.log(`\n$ ${formatCommand(args)}`);
  const result = spawnSync('stripe', args, {
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8'
  });
  if (result.status !== 0 && !allowFail) process.exit(result.status || 1);
  return {
    ok: result.status === 0,
    stdout: result.stdout || ''
  };
}

function parseJson(stdout, label) {
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`Stripe ${label} did not return valid JSON`);
  }
}

export function findMatchingEndpoint(listResponse, endpoint) {
  const endpoints = Array.isArray(listResponse?.data) ? listResponse.data : [];
  return endpoints.find((item) => {
    return item?.url === endpoint
      && Array.isArray(item?.enabled_events)
      && item.enabled_events.includes(requiredEvent);
  }) || null;
}

function summarizeEndpoint(endpoint) {
  return {
    id: endpoint.id,
    url: endpoint.url,
    livemode: endpoint.livemode,
    enabled_events: endpoint.enabled_events
  };
}

function writeSecretIfRequested(config, endpoint) {
  if (!config.secretOut || !endpoint.secret) return false;
  writeFileSync(config.secretOut, `${endpoint.secret}\n`, { mode: 0o600 });
  console.log(`Stripe webhook signing secret written to ${config.secretOut}.`);
  return true;
}

export function buildListArgs(config) {
  return [
    ...stripeGlobalArgs(config),
    'webhook_endpoints',
    'list',
    '--limit',
    '100',
    ...stripeModeArgs(config)
  ];
}

export function buildCreateArgs(config) {
  return [
    ...stripeGlobalArgs(config),
    'webhook_endpoints',
    'create',
    '--url',
    config.endpoint,
    '--enabled-events',
    requiredEvent,
    '--description',
    config.description,
    '--confirm',
    ...stripeModeArgs(config)
  ];
}

export function buildTriggerArgs(config) {
  return [
    ...stripeGlobalArgs(config),
    'trigger',
    requiredEvent
  ];
}

export function provisionStripe(env = process.env) {
  const config = buildStripeConfig(env);

  const listResult = runStripe(buildListArgs(config), { capture: true });
  const listResponse = parseJson(listResult.stdout, 'webhook endpoint list');
  const existing = findMatchingEndpoint(listResponse, config.endpoint);

  if (existing) {
    console.log(JSON.stringify({ reused: true, webhook: summarizeEndpoint(existing) }, null, 2));
    if (config.secretOut) {
      console.log('Existing Stripe webhook secrets cannot be retrieved. Create a new endpoint or copy the signing secret from the Stripe Dashboard.');
    }
  } else {
    const createResult = runStripe(buildCreateArgs(config), { capture: true });
    const created = parseJson(createResult.stdout, 'webhook endpoint create');
    writeSecretIfRequested(config, created);
    console.log(JSON.stringify({ created: true, webhook: summarizeEndpoint(created) }, null, 2));
  }

  if (config.triggerSmoke) {
    runStripe(buildTriggerArgs(config));
  }

  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    provisionStripe();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
