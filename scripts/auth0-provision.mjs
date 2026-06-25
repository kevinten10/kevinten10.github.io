import { spawnSync } from 'node:child_process';

const appName = 'KevinTen Cloudflare Preview';
const apiName = 'KevinTen Preview API';
const audience = process.env.AUTH0_AUDIENCE || 'https://kevinten-preview/api';
const callback = process.env.AUTH0_CALLBACK_URL || 'http://localhost:8788/';
const logout = process.env.AUTH0_LOGOUT_URL || callback;
const origin = process.env.AUTH0_ALLOWED_ORIGIN || new URL(callback).origin;

function run(args, allowFail = true) {
  console.log(`\n$ auth0 ${args.join(' ')}`);
  const result = spawnSync('auth0', args, { stdio: 'inherit', shell: true });
  if (result.status !== 0 && !allowFail) process.exit(result.status || 1);
  return result.status === 0;
}

if (!run(['tenants', 'list'])) {
  console.log('Auth0 CLI is not logged in. Run: auth0 login, then rerun npm run provision:auth0');
  process.exit(0);
}

run(['apps', 'create', '--name', appName, '--type', 'spa', '--callbacks', callback, '--logout-urls', logout, '--origins', origin, '--json']);
run(['apis', 'create', '--name', apiName, '--identifier', audience, '--scopes', 'admin:read,admin:write', '--signing-alg', 'RS256', '--json']);
console.log('\nAuth0 provisioning attempted. Put the SPA client id and tenant domain into Cloudflare Pages env vars.');
