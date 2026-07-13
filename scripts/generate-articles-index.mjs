import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const archivePath = path.join(root, 'archives', 'index.html');
const indexPath = path.join(root, 'assets', 'data', 'articles.json');
const sitemapPath = path.join(root, 'sitemap.xml');
const checkOnly = process.argv.includes('--check');

function normalizeLineEndings(value) {
  return String(value || '').replace(/\r\n/g, '\n');
}

function decodeHtml(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    hellip: '…',
    lt: '<',
    mdash: '—',
    nbsp: ' ',
    ndash: '–',
    quot: '"'
  };

  return String(value || '').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code[0] !== '#') return named[code.toLowerCase()] ?? entity;
    const number = code[1].toLowerCase() === 'x'
      ? Number.parseInt(code.slice(2), 16)
      : Number.parseInt(code.slice(1), 10);
    return Number.isFinite(number) ? String.fromCodePoint(number) : entity;
  });
}

function plainText(html) {
  return decodeHtml(String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function attribute(source, name) {
  const match = source.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
  return decodeHtml(match?.[1] || '');
}

function slugify(value) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'other';
}

function truncate(value, maxLength = 160) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function articleBody(html) {
  return html.match(/<div class="article-entry" itemprop="articleBody">([\s\S]*?)<div class="article_copyright">/i)?.[1] || '';
}

function articleExcerpt(body, title, categoryName, tags) {
  const paragraphs = Array.from(body.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi), (match) => plainText(match[1]));
  const usefulParagraph = paragraphs.find((paragraph) => paragraph.length >= 32 && paragraph !== title);
  if (usefulParagraph) return truncate(usefulParagraph);

  const topics = tags.length > 0 ? tags.slice(0, 3).join('、') : categoryName;
  return `关于${topics}的技术实践与学习记录。`;
}

function readTime(body) {
  const contentLength = plainText(body).length;
  return `${Math.max(1, Math.ceil(contentLength / 500))} min`;
}

function xmlEscape(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function buildArticles() {
  const archive = await fs.readFile(archivePath, 'utf8');
  const declaredTotal = Number(archive.match(/id="yelog_site_posts_number" value="(\d+)"/i)?.[1]);
  const nav = archive.match(/<nav id="title-list-nav">([\s\S]*?)<\/nav>/i)?.[1];
  if (!nav) throw new Error('Unable to find #title-list-nav in archives/index.html.');
  if (!Number.isInteger(declaredTotal)) throw new Error('Unable to read the declared archive article count.');

  const records = [];
  const urls = new Set();
  for (const match of nav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = match[1];
    const body = match[2];
    const url = attribute(attrs, 'href');
    if (!/^\/20\d{2}\/\d{2}\/\d{2}\//.test(url)) continue;
    if (urls.has(url)) throw new Error(`Duplicate article URL in archive: ${url}`);
    urls.add(url);

    const categoryName = attribute(attrs, 'class').split(/\s+/).filter(Boolean)[0] || 'Other';
    const tags = attribute(attrs, 'data-tag').split(',').map((tag) => tag.trim()).filter(Boolean);
    const titleSpan = body.match(/<span class="post-title"[^>]*>([\s\S]*?)<\/span>/i);
    const dateSpan = body.match(/<span class="post-date"[^>]*>([\s\S]*?)<\/span>/i);
    const title = attribute(titleSpan?.[0] || '', 'title') || plainText(titleSpan?.[1]) || decodeURI(url).split('/').filter(Boolean).at(-1);
    const date = (attribute(dateSpan?.[0] || '', 'title') || plainText(dateSpan?.[1])).slice(0, 10).replaceAll('/', '-');
    const localPath = path.join(root, decodeURI(url).replace(/^\//, ''), 'index.html');
    const page = await fs.readFile(localPath, 'utf8');
    const pageBody = articleBody(page);

    records.push({
      title,
      excerpt: articleExcerpt(pageBody, title, categoryName, tags),
      date,
      category: slugify(categoryName),
      categoryName,
      tags,
      url,
      readTime: readTime(pageBody)
    });
  }

  if (records.length !== declaredTotal) {
    throw new Error(`Archive declares ${declaredTotal} articles, found ${records.length}.`);
  }

  return records
    .sort((left, right) => right.date.localeCompare(left.date) || left.title.localeCompare(right.title, 'zh-CN'))
    .map((article, index) => ({ id: index + 1, ...article }));
}

function renderIndex(articles) {
  return `${JSON.stringify({ source: '/archives/index.html', total: articles.length, articles }, null, 2)}\n`;
}

function renderSitemap(articles) {
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/articles', priority: '0.9', changefreq: 'weekly' },
    { url: '/archives/', priority: '0.7', changefreq: 'monthly' },
    { url: '/categories/', priority: '0.6', changefreq: 'monthly' },
    { url: '/tags/', priority: '0.6', changefreq: 'monthly' }
  ];
  const entries = [
    ...staticPages.map((page) => ({ ...page, lastmod: '' })),
    ...articles.map((article) => ({ url: article.url, priority: '0.7', changefreq: 'yearly', lastmod: article.date }))
  ];
  const urls = entries.map((entry) => [
    '  <url>',
    `    <loc>${xmlEscape(`https://kevinten.com${encodeURI(entry.url)}`)}</loc>`,
    entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : '',
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    '  </url>'
  ].filter(Boolean).join('\n')).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const articles = await buildArticles();
const outputs = [
  [indexPath, renderIndex(articles)],
  [sitemapPath, renderSitemap(articles)]
];

if (checkOnly) {
  const stale = [];
  for (const [file, expected] of outputs) {
    const current = await fs.readFile(file, 'utf8').catch(() => '');
    if (normalizeLineEndings(current) !== normalizeLineEndings(expected)) {
      stale.push(path.relative(root, file));
    }
  }
  if (stale.length > 0) {
    throw new Error(`Generated article files are stale: ${stale.join(', ')}. Run npm run generate:articles.`);
  }
  console.log(`Article index is current: ${articles.length} articles.`);
} else {
  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  for (const [file, content] of outputs) await fs.writeFile(file, content);
  console.log(`Generated article index and sitemap for ${articles.length} articles.`);
}
