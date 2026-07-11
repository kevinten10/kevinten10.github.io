import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist', 'pages');
const requireAuth0 = process.argv.includes('--require-auth0');
const includeDirs = ['2018', '2019', 'admin', 'archives', 'assets', 'categories', 'css', 'fonts', 'images', 'img', 'js', 'page', 'tags'];
const includeFiles = [
  '.nojekyll',
  'articles.html',
  'index.html',
  'robots.txt',
  'sitemap.xml',
  'sw.js',
  'video/kevinten-ai-native-promo.mp4',
  'video/kevinten-ai-native-promo-poster.jpg'
];
const DEFAULT_API_BASE_URL = 'https://kevinten-api-preview.wshten.workers.dev';
const DEFAULT_AUTH0_DOMAIN = 'dev-8abkwbejxgjbcz1l.us.auth0.com';
const DEFAULT_AUTH0_AUDIENCE = 'https://kevinten-preview/api';
const DEFAULT_PAGES_ORIGIN = 'https://kevinten-interactive-preview.pages.dev';
const DEFAULT_AUTH0_ALLOWED_ORIGINS = [
  DEFAULT_PAGES_ORIGIN,
  'https://kevinten.com',
  'https://www.kevinten.com'
];

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function originFromUrl(value) {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

async function readEnvFile(file) {
  try {
    const text = await fs.readFile(file, 'utf8');
    return Object.fromEntries(text.split(/\r?\n/).map((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      return match ? [match[1], match[2]] : null;
    }).filter(Boolean));
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

async function copyRecursive(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    for (const entry of await fs.readdir(src)) {
      await copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
}

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
for (const dir of includeDirs) {
  try {
    await copyRecursive(path.join(root, dir), path.join(out, dir));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}
for (const file of includeFiles) {
  await copyRecursive(path.join(root, file), path.join(out, file));
}

const generatedEnv = await readEnvFile(path.join(root, 'dist', 'auth0-preview.env'));
const runtimeValue = (key, fallback = '') => process.env[key] || generatedEnv[key] || fallback;
const runtime = {
  apiBaseUrl: runtimeValue('API_BASE_URL', DEFAULT_API_BASE_URL),
  auth0: {
    domain: runtimeValue('AUTH0_DOMAIN', DEFAULT_AUTH0_DOMAIN),
    clientId: runtimeValue('AUTH0_CLIENT_ID'),
    audience: runtimeValue('AUTH0_AUDIENCE', DEFAULT_AUTH0_AUDIENCE),
    redirectUri: runtimeValue('AUTH0_CALLBACK_URL', `${DEFAULT_PAGES_ORIGIN}/`),
    logoutUri: runtimeValue('AUTH0_LOGOUT_URL', `${DEFAULT_PAGES_ORIGIN}/`),
    allowedOrigins: Array.from(new Set([
      ...DEFAULT_AUTH0_ALLOWED_ORIGINS,
      ...splitList(runtimeValue('AUTH0_ALLOWED_ORIGINS')),
      runtimeValue('AUTH0_ALLOWED_ORIGIN'),
      originFromUrl(runtimeValue('AUTH0_CALLBACK_URL')),
      originFromUrl(runtimeValue('AUTH0_LOGOUT_URL'))
    ].filter(Boolean)))
  },
  stripe: {
    publishableKey: runtimeValue('STRIPE_PUBLISHABLE_KEY')
  }
};
if (requireAuth0 && !runtime.auth0.clientId) {
  throw new Error(
    'AUTH0_CLIENT_ID is required for Pages deployment. Set it in the environment or dist/auth0-preview.env.'
  );
}
await fs.writeFile(
  path.join(out, 'assets', 'js', 'cloudflare-runtime.js'),
  `(function() {
  var config = ${JSON.stringify(runtime, null, 2)};
  var auth0 = config.auth0 || {};
  var origins = Array.isArray(auth0.allowedOrigins) ? auth0.allowedOrigins : [];
  if (origins.indexOf(window.location.origin) !== -1) {
    auth0.redirectUri = window.location.origin + '/';
    auth0.logoutUri = window.location.origin + '/';
  }
  window.CloudflareSiteConfig = config;
})();\n`
);
await fs.rm(path.join(out, 'CNAME'), { force: true });
console.log(`Prepared Cloudflare Pages preview at ${out}`);
