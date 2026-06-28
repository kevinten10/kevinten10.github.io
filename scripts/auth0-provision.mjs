import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const appName = 'KevinTen Cloudflare Preview';
const apiName = 'KevinTen Preview API';
const defaultPreviewOrigin = 'https://kevinten-interactive-preview.pages.dev';

const knownWindowsCli = 'C:\\Users\\PC\\AppData\\Local\\Programs\\Auth0CLI\\auth0.exe';

export function resolveAuth0Command(env = process.env, exists = existsSync) {
  if (env.AUTH0_CLI?.trim()) return env.AUTH0_CLI.trim();
  if (exists(knownWindowsCli)) return knownWindowsCli;
  return 'auth0';
}

export function shouldAttemptMachineLogin(env = process.env) {
  return Boolean(env.AUTH0_DOMAIN?.trim() && env.AUTH0_CLIENT_ID?.trim() && env.AUTH0_CLIENT_SECRET?.trim());
}

export function buildMachineLoginArgs(env = process.env) {
  return [
    'login',
    '--domain',
    env.AUTH0_DOMAIN.trim(),
    '--client-id',
    env.AUTH0_CLIENT_ID.trim(),
    '--client-secret',
    env.AUTH0_CLIENT_SECRET.trim()
  ];
}

function redactArgs(args) {
  return args.map((arg, index) => {
    if (args[index - 1] === '--client-secret') return '<redacted>';
    return arg;
  });
}

function run(command, args, allowFail = true, capture = false) {
  console.log(`\n$ ${path.basename(command)} ${redactArgs(args).join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
    shell: process.platform === 'win32' && command === 'auth0'
  });
  if (result.status !== 0 && !allowFail) process.exit(result.status || 1);
  return capture ? { ok: result.status === 0, stdout: result.stdout || '' } : { ok: result.status === 0, stdout: '' };
}

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function originFromUrl(value) {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

export function buildAuth0Config(env = process.env) {
  const audience = env.AUTH0_AUDIENCE || 'https://kevinten-preview/api';
  const callbacks = uniq(splitList(env.AUTH0_CALLBACK_URLS || env.AUTH0_CALLBACK_URL || `${defaultPreviewOrigin}/`));
  const logouts = uniq(splitList(env.AUTH0_LOGOUT_URLS || env.AUTH0_LOGOUT_URL || callbacks[0]));
  const origins = uniq([
    ...splitList(env.AUTH0_ALLOWED_ORIGINS),
    env.AUTH0_ALLOWED_ORIGIN || '',
    ...callbacks.map(originFromUrl),
    ...logouts.map(originFromUrl)
  ]);
  return {
    audience,
    callback: callbacks[0],
    callbacks,
    logout: logouts[0],
    logouts,
    origin: origins[0],
    origins
  };
}

export function extractAuth0ClientId(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    if (Array.isArray(parsed)) return String(parsed.find((item) => item?.client_id)?.client_id || '');
    return String(parsed?.client_id || parsed?.clientId || '');
  } catch {
    return '';
  }
}

export function buildCloudflareRuntimeEnv(env = process.env, clientId = '') {
  const config = buildAuth0Config(env);
  return {
    AUTH0_DOMAIN: env.AUTH0_DOMAIN || '',
    AUTH0_CLIENT_ID: clientId || env.AUTH0_CLIENT_ID || '',
    AUTH0_AUDIENCE: config.audience,
    AUTH0_CALLBACK_URL: config.callback,
    AUTH0_LOGOUT_URL: config.logout,
    AUTH0_ALLOWED_ORIGIN: config.origin,
    AUTH0_ALLOWED_ORIGINS: config.origins.join(',')
  };
}

export function formatEnvFile(values) {
  return `${Object.entries(values).map(([key, value]) => `${key}=${value || ''}`).join('\n')}\n`;
}

async function writeGeneratedEnv(values, outPath = path.join(process.cwd(), 'dist', 'auth0-preview.env')) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, formatEnvFile(values));
  return outPath;
}

export async function provisionAuth0(env = process.env) {
  const command = resolveAuth0Command(env);
  const config = buildAuth0Config(env);

  if (shouldAttemptMachineLogin(env)) {
    run(command, buildMachineLoginArgs(env));
  }

  if (!run(command, ['tenants', 'list']).ok) {
    console.log(`Auth0 CLI is not logged in. Run: ${path.basename(command)} login, then rerun npm run provision:auth0`);
    return false;
  }

  const appResult = run(command, [
    'apps',
    'create',
    '--name',
    appName,
    '--type',
    'spa',
    '--callbacks',
    config.callbacks.join(','),
    '--logout-urls',
    config.logouts.join(','),
    '--origins',
    config.origins.join(','),
    '--web-origins',
    config.origins.join(','),
    '--json'
  ], true, true);
  run(command, [
    'apis',
    'create',
    '--name',
    apiName,
    '--identifier',
    config.audience,
    '--scopes',
    'admin:read,admin:write',
    '--signing-alg',
    'RS256',
    '--json'
  ]);
  const clientId = extractAuth0ClientId(appResult.stdout);
  const generatedEnv = buildCloudflareRuntimeEnv(env, clientId);
  const outPath = await writeGeneratedEnv(generatedEnv);
  console.log(`\nAuth0 provisioning attempted. Non-secret runtime env written to ${outPath}.`);
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ok = await provisionAuth0();
  if (!ok) process.exitCode = 1;
}
