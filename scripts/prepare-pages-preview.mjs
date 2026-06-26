import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist', 'pages');
const includeDirs = ['2018', '2019', 'admin', 'archives', 'assets', 'categories', 'css', 'fonts', 'images', 'img', 'js', 'page', 'tags', 'video'];
const includeFiles = ['.nojekyll', 'articles.html', 'index.html', 'robots.txt', 'sitemap.xml', 'sw.js'];

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

const runtime = {
  apiBaseUrl: process.env.API_BASE_URL || '',
  auth0: {
    domain: process.env.AUTH0_DOMAIN || '',
    clientId: process.env.AUTH0_CLIENT_ID || '',
    audience: process.env.AUTH0_AUDIENCE || '',
    redirectUri: process.env.AUTH0_CALLBACK_URL || '',
    logoutUri: process.env.AUTH0_LOGOUT_URL || ''
  }
};
await fs.writeFile(
  path.join(out, 'assets', 'js', 'cloudflare-runtime.js'),
  `window.CloudflareSiteConfig = ${JSON.stringify(runtime, null, 2)};\n`
);
await fs.rm(path.join(out, 'CNAME'), { force: true });
console.log(`Prepared Cloudflare Pages preview at ${out}`);
