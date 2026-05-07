# Vercel Supabase Interactive Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the static site interactive layer from Cloudbase to Vercel Functions plus Supabase, adding visitor comments, analytics, recorded rewards, owner admin, and Stripe-ready payment closure.

**Architecture:** Vercel hosts the existing static files and same-origin `/api/*` Functions. Supabase stores all interactive data and handles owner magic-link Auth. Browser JavaScript renders public approved data and submits writes through Vercel API routes that validate, moderate, rate-limit, and use the Supabase service role server-side.

**Tech Stack:** Vanilla HTML/CSS/ES6 IIFEs, Vercel Node Functions, Supabase Postgres/Auth, Node built-in tests, Stripe webhook support.

---

## Scope And Phasing

The approved spec covers several related subsystems. Implement them as one project because they share the same schema, visitor identity helper, API conventions, admin auth, and Vercel deployment. Commit after each task.

Phase 1 produces usable software without payment webhooks: Vercel setup, Supabase schema, comments, analytics, recorded rewards, and admin moderation.

Phase 2 adds Stripe Checkout and webhook verification using the provider-neutral rewards model created in Phase 1.

## File Structure

- Create `package.json`: local scripts and runtime dependencies for Vercel Functions.
- Create `vercel.json`: static hosting and function configuration.
- Create `.env.example`: documented environment variables without secrets.
- Create `supabase/migrations/202605080001_interactive_features.sql`: schema, indexes, RLS, public views, helper functions.
- Create `api/_lib/http.js`: shared HTTP response, request parsing, method guards.
- Create `api/_lib/supabase.js`: service-role Supabase client and public env access.
- Create `api/_lib/security.js`: visitor id normalization, IP hashing, admin token verification.
- Create `api/_lib/moderation.js`: comment and reward moderation decisions.
- Create `api/comments.js`: `GET` approved comments and `POST` new comments.
- Create `api/track.js`: analytics ingestion.
- Create `api/public-stats.js`: public counters.
- Create `api/rewards.js`: recorded rewards read/write.
- Create `api/rewards/checkout.js`: Stripe Checkout creation for Phase 2.
- Create `api/webhooks/stripe.js`: Stripe webhook verification for Phase 2.
- Create `api/admin/summary.js`: owner dashboard overview.
- Create `api/admin/analytics.js`: owner analytics summary.
- Create `api/admin/comments/[id].js`: comment moderation.
- Create `api/admin/rewards/[id].js`: reward moderation.
- Create `assets/js/visitor-profile.js`: local guest identity helper.
- Modify `assets/js/comments.js`: replace Cloudbase implementation with Vercel API client.
- Modify `assets/js/analytics.js`: replace Cloudbase tracking with Vercel API tracking.
- Create `assets/js/rewards.js`: reward form and thanks wall client.
- Create `assets/js/admin.js`: owner admin page behavior.
- Modify `assets/css/comments.css`: add fields/status states needed by the new comment form.
- Create `assets/css/rewards.css`: reward and thanks wall styling.
- Create `assets/css/admin.css`: compact owner dashboard styling.
- Modify `assets/js/i18n.js`: add reward, stats, and admin-facing public strings.
- Modify `index.html`: remove Cloudbase SDK, add reward section, stats widgets, and new scripts/styles.
- Create `admin/index.html`: static owner admin UI.
- Modify `sw.js`: bump cache version and cached asset list.
- Create `tests/api/moderation.test.js`: deterministic moderation helper tests.
- Create `tests/api/security.test.js`: deterministic security helper tests.
- Create `docs/interactive-features-ops.md`: setup and verification notes.

---

### Task 1: Project Runtime And Environment Contract

**Files:**
- Create: `package.json`
- Create: `vercel.json`
- Create: `.env.example`
- Create: `docs/interactive-features-ops.md`

- [ ] **Step 1: Create `package.json`**

Write this file:

```json
{
  "name": "kevinten10-github-io",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "dev": "vercel dev",
    "test": "node --test tests/api/*.test.js",
    "verify:static": "python -m http.server 8000"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.43.0",
    "stripe": "^15.12.0"
  },
  "devDependencies": {
    "vercel": "^37.0.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Create `vercel.json`**

Write this file:

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs20.x",
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store"
        }
      ]
    }
  ]
}
```

- [ ] **Step 3: Create `.env.example`**

Write this file:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-for-vercel-only
ADMIN_EMAILS=owner@example.com
SITE_ORIGIN=http://localhost:3000
IP_HASH_SALT=replace-with-random-secret
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
STRIPE_REWARD_PRICE_ID=price_replace_me
```

- [ ] **Step 4: Create ops notes**

Create `docs/interactive-features-ops.md` with:

```markdown
# Interactive Features Ops

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Fill Supabase and Stripe values locally.
3. Run `npm install`.
4. Run `npm test`.
5. Run `npx vercel dev`.

## Supabase Setup

Run `supabase/migrations/202605080001_interactive_features.sql` in the Supabase SQL editor or through the Supabase CLI.

Add the owner email to `admin_users`:

```sql
insert into public.admin_users (email, role)
values ('owner@example.com', 'owner')
on conflict (email) do update set role = excluded.role;
```

## Vercel Setup

Add the variables from `.env.example` in Vercel Project Settings. Do not commit `.env.local`.

## Manual Verification

- Open `/` and confirm no console errors.
- Submit a normal comment and confirm it appears.
- Submit a comment with two links and confirm it enters pending review.
- Submit a reward message and approve it from `/admin/`.
- Confirm `/api/public-stats?page=/` returns aggregate counters.
- Confirm one legacy article page still loads.
```

- [ ] **Step 5: Verify package metadata parses**

Run:

```powershell
node -e "const p=require('./package.json'); console.log(p.scripts.test)"
```

Expected output:

```text
node --test tests/api/*.test.js
```

- [ ] **Step 6: Commit runtime setup**

Run:

```powershell
git add package.json vercel.json .env.example docs/interactive-features-ops.md
git commit -m "chore: add vercel supabase runtime setup"
```

---

### Task 2: Supabase Schema, Views, And Policies

**Files:**
- Create: `supabase/migrations/202605080001_interactive_features.sql`

- [ ] **Step 1: Create migration directory and SQL file**

Write `supabase/migrations/202605080001_interactive_features.sql`:

```sql
create extension if not exists pgcrypto;

create table if not exists public.visitor_profiles (
  id uuid primary key default gen_random_uuid(),
  visitor_key text not null unique,
  nickname text not null,
  email text,
  email_hash text,
  website text,
  status text not null default 'active' check (status in ('active', 'muted', 'blocked')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  page_path text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  visitor_id uuid references public.visitor_profiles(id) on delete set null,
  visitor_key text not null,
  author_name text not null,
  author_website text,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden', 'spam')),
  moderation_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references public.visitor_profiles(id) on delete set null,
  visitor_key text not null,
  display_name text not null,
  message text,
  amount numeric(12,2),
  currency text not null default 'CNY',
  provider text not null default 'manual_qr',
  provider_order_id text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'verified', 'hidden', 'failed')),
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  page_path text not null,
  session_id text not null,
  visitor_key text,
  referrer text,
  referrer_domain text,
  browser_family text,
  device_family text,
  ip_hash text,
  created_at timestamptz not null default now(),
  view_date date generated always as ((created_at at time zone 'utc')::date) stored
);

create table if not exists public.daily_stats (
  stat_date date not null,
  page_path text not null,
  pv integer not null default 0,
  uv integer not null default 0,
  comments_count integer not null default 0,
  rewards_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (stat_date, page_path)
);

create table if not exists public.page_stats (
  page_path text primary key,
  pv integer not null default 0,
  uv integer not null default 0,
  comments_count integer not null default 0,
  rewards_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  email text primary key,
  role text not null default 'owner' check (role in ('owner', 'moderator')),
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('comment', 'reward')),
  target_id uuid not null,
  action text not null,
  actor_email text,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists comments_page_status_created_idx
  on public.comments (page_path, status, created_at desc);

create index if not exists comments_parent_idx
  on public.comments (parent_id);

create index if not exists rewards_status_created_idx
  on public.rewards (status, created_at desc);

create index if not exists page_views_page_date_idx
  on public.page_views (page_path, view_date);

create or replace view public.public_comments as
select
  id,
  page_path,
  parent_id,
  author_name,
  author_website,
  content,
  created_at
from public.comments
where status = 'approved';

create or replace view public.public_rewards as
select
  id,
  display_name,
  message,
  amount,
  currency,
  provider,
  status,
  verified_at,
  created_at
from public.rewards
where status in ('approved', 'verified');

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists comments_touch_updated_at on public.comments;
create trigger comments_touch_updated_at
before update on public.comments
for each row execute function public.touch_updated_at();

drop trigger if exists rewards_touch_updated_at on public.rewards;
create trigger rewards_touch_updated_at
before update on public.rewards
for each row execute function public.touch_updated_at();

drop trigger if exists visitor_profiles_touch_seen on public.visitor_profiles;
create trigger visitor_profiles_touch_seen
before update on public.visitor_profiles
for each row execute function public.touch_updated_at();

alter table public.visitor_profiles enable row level security;
alter table public.comments enable row level security;
alter table public.rewards enable row level security;
alter table public.page_views enable row level security;
alter table public.daily_stats enable row level security;
alter table public.page_stats enable row level security;
alter table public.admin_users enable row level security;
alter table public.moderation_events enable row level security;

create policy "public can read approved comments"
on public.comments for select
using (status = 'approved');

create policy "public can read approved rewards"
on public.rewards for select
using (status in ('approved', 'verified'));

create policy "public can read page stats"
on public.page_stats for select
using (true);

create policy "public can read daily stats"
on public.daily_stats for select
using (true);
```

- [ ] **Step 2: Validate migration has expected tables**

Run:

```powershell
Select-String -Path supabase/migrations/202605080001_interactive_features.sql -Pattern "create table if not exists public.comments","create table if not exists public.rewards","create policy"
```

Expected: output includes the comments table, rewards table, and policy lines.

- [ ] **Step 3: Commit schema**

Run:

```powershell
git add supabase/migrations/202605080001_interactive_features.sql
git commit -m "feat: add supabase interactive schema"
```

---

### Task 3: Shared API Utilities With Tests

**Files:**
- Create: `api/_lib/http.js`
- Create: `api/_lib/security.js`
- Create: `api/_lib/moderation.js`
- Create: `api/_lib/supabase.js`
- Create: `tests/api/security.test.js`
- Create: `tests/api/moderation.test.js`

- [ ] **Step 1: Write failing security tests**

Create `tests/api/security.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeVisitorKey, hashIp, getBearerToken } = require('../../api/_lib/security');

test('normalizeVisitorKey keeps safe keys', () => {
  assert.equal(normalizeVisitorKey('visitor_abc-123'), 'visitor_abc-123');
});

test('normalizeVisitorKey rejects unsafe keys', () => {
  assert.equal(normalizeVisitorKey('../bad'), '');
});

test('hashIp is deterministic and salted', () => {
  const first = hashIp('127.0.0.1', 'salt-a');
  const second = hashIp('127.0.0.1', 'salt-a');
  const third = hashIp('127.0.0.1', 'salt-b');
  assert.equal(first, second);
  assert.notEqual(first, third);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test('getBearerToken parses Authorization header', () => {
  assert.equal(getBearerToken({ authorization: 'Bearer abc.def' }), 'abc.def');
  assert.equal(getBearerToken({ authorization: 'Basic nope' }), '');
});
```

- [ ] **Step 2: Write failing moderation tests**

Create `tests/api/moderation.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { moderateComment, moderateReward } = require('../../api/_lib/moderation');

test('moderateComment approves normal comments', () => {
  assert.deepEqual(moderateComment({ content: 'Great article. Thanks for sharing.', recentCount: 0 }), {
    status: 'approved',
    reason: ''
  });
});

test('moderateComment sends link-heavy comments to pending', () => {
  assert.deepEqual(moderateComment({ content: 'see https://a.test and https://b.test', recentCount: 0 }), {
    status: 'pending',
    reason: 'too_many_links'
  });
});

test('moderateComment sends rapid repeats to pending', () => {
  assert.deepEqual(moderateComment({ content: 'hello', recentCount: 3 }), {
    status: 'pending',
    reason: 'rate_limited'
  });
});

test('moderateReward starts manual reward entries as pending', () => {
  assert.deepEqual(moderateReward({ message: 'Thanks!', amount: 18 }), {
    status: 'pending',
    reason: 'manual_review'
  });
});
```

- [ ] **Step 3: Run tests and verify they fail**

Run:

```powershell
npm test
```

Expected: FAIL with module-not-found errors for `api/_lib/security` or `api/_lib/moderation`.

- [ ] **Step 4: Implement `api/_lib/security.js`**

Write:

```js
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

function normalizeVisitorKey(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().slice(0, 80);
  return /^[a-zA-Z0-9_-]{8,80}$/.test(trimmed) ? trimmed : '';
}

function hashIp(ip, salt) {
  return crypto.createHash('sha256').update(`${salt || 'dev'}:${ip || 'unknown'}`).digest('hex');
}

function getBearerToken(headers) {
  const value = headers.authorization || headers.Authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

async function requireAdmin(req) {
  const token = getBearerToken(req.headers || {});
  if (!token) {
    const err = new Error('Missing admin token');
    err.statusCode = 401;
    throw err;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user || !data.user.email) {
    const err = new Error('Invalid admin token');
    err.statusCode = 401;
    throw err;
  }

  const email = data.user.email.toLowerCase();
  const configured = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (configured.includes(email)) {
    return { email, role: 'owner' };
  }

  const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: admin, error: adminError } = await adminClient
    .from('admin_users')
    .select('email, role')
    .eq('email', email)
    .maybeSingle();

  if (adminError || !admin) {
    const err = new Error('Admin access denied');
    err.statusCode = 403;
    throw err;
  }

  return { email: admin.email, role: admin.role };
}

module.exports = {
  normalizeVisitorKey,
  hashIp,
  getBearerToken,
  requireAdmin
};
```

- [ ] **Step 5: Implement `api/_lib/moderation.js`**

Write:

```js
const BLOCKED_PATTERNS = [
  /casino/i,
  /viagra/i,
  /loan\s*offer/i
];

function countLinks(text) {
  return (String(text || '').match(/https?:\/\//g) || []).length;
}

function moderateComment(input) {
  const content = String(input.content || '').trim();
  const recentCount = Number(input.recentCount || 0);

  if (recentCount >= 3) return { status: 'pending', reason: 'rate_limited' };
  if (content.length < 2) return { status: 'pending', reason: 'too_short' };
  if (content.length > 1000) return { status: 'pending', reason: 'too_long' };
  if (countLinks(content) > 1) return { status: 'pending', reason: 'too_many_links' };
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(content))) {
    return { status: 'pending', reason: 'blocked_pattern' };
  }

  return { status: 'approved', reason: '' };
}

function moderateReward(input) {
  const message = String(input.message || '').trim();
  if (message.length > 300) return { status: 'pending', reason: 'message_too_long' };
  return { status: 'pending', reason: 'manual_review' };
}

module.exports = {
  countLinks,
  moderateComment,
  moderateReward
};
```

- [ ] **Step 6: Implement `api/_lib/http.js`**

Write:

```js
function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { success: false, error: message });
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function requireMethod(req, res, allowed) {
  if (allowed.includes(req.method)) return true;
  res.setHeader('Allow', allowed.join(', '));
  sendError(res, 405, 'Method not allowed');
  return false;
}

module.exports = {
  sendJson,
  sendError,
  readJson,
  requireMethod
};
```

- [ ] **Step 7: Implement `api/_lib/supabase.js`**

Write:

```js
const { createClient } = require('@supabase/supabase-js');

let cachedAdminClient;

function getSupabaseAdmin() {
  if (cachedAdminClient) return cachedAdminClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase service environment variables are missing');
  }

  cachedAdminClient = createClient(url, key, {
    auth: { persistSession: false }
  });
  return cachedAdminClient;
}

module.exports = {
  getSupabaseAdmin
};
```

- [ ] **Step 8: Run tests and verify they pass**

Run:

```powershell
npm test
```

Expected: PASS for `security.test.js` and `moderation.test.js`.

- [ ] **Step 9: Commit shared utilities**

Run:

```powershell
git add api/_lib tests/api
git commit -m "feat: add shared api utilities"
```

---

### Task 4: Visitor Profile Browser Helper

**Files:**
- Create: `assets/js/visitor-profile.js`
- Modify: `index.html`
- Modify: `sw.js`

- [ ] **Step 1: Create visitor helper**

Write `assets/js/visitor-profile.js`:

```js
/**
 * Visitor Profile Module - lightweight guest identity for comments and rewards.
 * @version 1.0.0
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'kevinten-visitor-profile';

  function generateId() {
    if (window.crypto && window.crypto.randomUUID) {
      return 'visitor_' + window.crypto.randomUUID().replace(/-/g, '');
    }
    return 'visitor_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function read() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!parsed.visitorId) parsed.visitorId = generateId();
      return parsed;
    } catch (err) {
      return { visitorId: generateId() };
    }
  }

  function save(profile) {
    var current = read();
    var next = {
      visitorId: current.visitorId || generateId(),
      nickname: String(profile.nickname || current.nickname || '').trim().slice(0, 40),
      email: String(profile.email || current.email || '').trim().slice(0, 120),
      website: String(profile.website || current.website || '').trim().slice(0, 200)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function get() {
    var profile = read();
    if (!profile.visitorId) return save(profile);
    return profile;
  }

  window.VisitorProfile = {
    get: get,
    save: save
  };
})();
```

- [ ] **Step 2: Add script to `index.html` before comments/rewards scripts**

In the Scripts block near the end of `index.html`, add:

```html
    <script src="/assets/js/visitor-profile.js?v=1" defer></script>
```

Place it before `comments.js`.

- [ ] **Step 3: Update service worker cache**

In `sw.js`, change:

```js
const SW_VERSION = '34';
```

to:

```js
const SW_VERSION = '35';
```

Add this asset to `PRECACHE_ASSETS` before `comments.js`:

```js
  '/assets/js/visitor-profile.js?v=1',
```

- [ ] **Step 4: Verify helper syntax**

Run:

```powershell
node --check assets/js/visitor-profile.js
```

Expected: no output and exit code 0.

- [ ] **Step 5: Commit visitor helper**

Run:

```powershell
git add assets/js/visitor-profile.js index.html sw.js
git commit -m "feat: add visitor profile helper"
```

---

### Task 5: Comments API And Frontend Replacement

**Files:**
- Create: `api/comments.js`
- Modify: `assets/js/comments.js`
- Modify: `assets/css/comments.css`
- Modify: `index.html`
- Modify: `sw.js`

- [ ] **Step 1: Create `api/comments.js`**

Write:

```js
const { sendJson, sendError, readJson, requireMethod } = require('./_lib/http');
const { getSupabaseAdmin } = require('./_lib/supabase');
const { normalizeVisitorKey, hashIp } = require('./_lib/security');
const { moderateComment } = require('./_lib/moderation');

function cleanText(value, max) {
  return String(value || '').trim().slice(0, max);
}

async function ensureVisitor(db, input) {
  const visitorKey = normalizeVisitorKey(input.visitorId);
  if (!visitorKey) return null;

  const nickname = cleanText(input.nickname, 40) || 'Visitor';
  const website = cleanText(input.website, 200);
  const email = cleanText(input.email, 120);

  const { data, error } = await db
    .from('visitor_profiles')
    .upsert({
      visitor_key: visitorKey,
      nickname,
      website: website || null,
      email: email || null,
      last_seen_at: new Date().toISOString()
    }, { onConflict: 'visitor_key' })
    .select('id, visitor_key, nickname, website')
    .single();

  if (error) throw error;
  return data;
}

async function getRecentCount(db, visitorKey) {
  const since = new Date(Date.now() - 30 * 1000).toISOString();
  const { count, error } = await db
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('visitor_key', visitorKey)
    .gte('created_at', since);
  if (error) throw error;
  return count || 0;
}

module.exports = async function handler(req, res) {
  const db = getSupabaseAdmin();

  if (req.method === 'GET') {
    const page = cleanText(req.query.page || '/', 300) || '/';
    const { data, error } = await db
      .from('public_comments')
      .select('id, page_path, parent_id, author_name, author_website, content, created_at')
      .eq('page_path', page)
      .order('created_at', { ascending: true });

    if (error) return sendError(res, 500, 'Failed to load comments');
    return sendJson(res, 200, { success: true, data: data || [] });
  }

  if (!requireMethod(req, res, ['GET', 'POST'])) return;

  try {
    const body = await readJson(req);
    const pagePath = cleanText(body.pagePath || body.pageId || '/', 300) || '/';
    const content = cleanText(body.content, 1000);
    const parentId = body.parentId ? cleanText(body.parentId, 80) : null;
    const visitor = await ensureVisitor(db, body);

    if (!visitor || !content) return sendError(res, 400, 'Missing visitor or content');

    const recentCount = await getRecentCount(db, visitor.visitor_key);
    const decision = moderateComment({ content, recentCount });
    const ipHash = hashIp(req.headers['x-forwarded-for'] || req.socket.remoteAddress, process.env.IP_HASH_SALT);

    const { data, error } = await db
      .from('comments')
      .insert({
        page_path: pagePath,
        parent_id: parentId,
        visitor_id: visitor.id,
        visitor_key: visitor.visitor_key,
        author_name: visitor.nickname,
        author_website: visitor.website || null,
        content,
        status: decision.status,
        moderation_reason: decision.reason || null,
        metadata: { ipHash }
      })
      .select('id, status, moderation_reason')
      .single();

    if (error) throw error;
    return sendJson(res, 201, { success: true, data });
  } catch (err) {
    return sendError(res, err.statusCode || 500, 'Failed to submit comment');
  }
};
```

- [ ] **Step 2: Replace `assets/js/comments.js`**

Replace the Cloudbase implementation with:

```js
/**
 * Comments Module - Vercel API + Supabase backed commenting system.
 * @version 2.0.0
 */
(function() {
  'use strict';

  var CONFIG = {
    pagePath: window.location.pathname || '/',
    maxLength: 1000
  };

  var state = {
    comments: [],
    submitting: false
  };

  function text(key, fallback) {
    if (typeof I18n !== 'undefined' && I18n.get) return I18n.get(key) || fallback;
    return fallback;
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
  }

  function renderMarkdown(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function init() {
    var container = document.getElementById('comments-container');
    if (!container) return;
    renderForm(container);
    bind(container);
    loadComments();
  }

  function renderForm(container) {
    var profile = window.VisitorProfile ? window.VisitorProfile.get() : {};
    var wrapper = container.querySelector('.comments-form-wrapper') || document.createElement('div');
    wrapper.className = 'comments-form-wrapper';
    wrapper.innerHTML =
      '<div class="comments-form">' +
        '<div class="comments-identity-row">' +
          '<input class="comments-name" maxlength="40" placeholder="' + escapeHtml(text('comments.name.placeholder', '昵称')) + '" value="' + escapeHtml(profile.nickname || '') + '">' +
          '<input class="comments-email" maxlength="120" placeholder="' + escapeHtml(text('comments.email.placeholder', '邮箱（可选）')) + '" value="' + escapeHtml(profile.email || '') + '">' +
          '<input class="comments-website" maxlength="200" placeholder="' + escapeHtml(text('comments.website.placeholder', '网站（可选）')) + '" value="' + escapeHtml(profile.website || '') + '">' +
        '</div>' +
        '<textarea class="comments-input" maxlength="' + CONFIG.maxLength + '" placeholder="' + escapeHtml(text('comments.placeholder', '写下你的留言...')) + '"></textarea>' +
        '<div class="comments-form-footer">' +
          '<span class="comments-hint">' + escapeHtml(text('comments.hint.markdown', '支持 Markdown 语法')) + '</span>' +
          '<button class="comments-submit btn btn-primary">' + escapeHtml(text('comments.submit', '提交留言')) + '</button>' +
        '</div>' +
        '<p class="comments-status" aria-live="polite"></p>' +
      '</div>';
    if (!wrapper.parentNode) container.insertBefore(wrapper, container.firstChild);
  }

  function bind(container) {
    container.addEventListener('click', function(event) {
      if (event.target.classList.contains('comments-submit')) submit(container);
    });
  }

  function getProfile(container) {
    var profile = {
      nickname: container.querySelector('.comments-name').value,
      email: container.querySelector('.comments-email').value,
      website: container.querySelector('.comments-website').value
    };
    return window.VisitorProfile ? window.VisitorProfile.save(profile) : profile;
  }

  function setStatus(container, message) {
    var status = container.querySelector('.comments-status');
    if (status) status.textContent = message || '';
  }

  function submit(container) {
    if (state.submitting) return;
    var input = container.querySelector('.comments-input');
    var profile = getProfile(container);
    var content = input.value.trim();
    if (!profile.nickname) return setStatus(container, text('comments.error.name', '请先填写昵称'));
    if (!content) return setStatus(container, text('comments.error.empty', '请先写点内容'));

    state.submitting = true;
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: profile.visitorId,
        nickname: profile.nickname,
        email: profile.email,
        website: profile.website,
        pagePath: CONFIG.pagePath,
        content: content
      })
    }).then(function(res) {
      return res.json();
    }).then(function(result) {
      if (!result.success) throw new Error(result.error || 'failed');
      input.value = '';
      setStatus(container, result.data.status === 'approved' ? text('comments.status.approved', '已发布') : text('comments.status.pending', '已提交，待审核'));
      return loadComments();
    }).catch(function() {
      setStatus(container, text('comments.error.submit', '提交失败'));
    }).finally(function() {
      state.submitting = false;
    });
  }

  function loadComments() {
    var list = document.getElementById('comments-list');
    if (!list) return Promise.resolve();
    list.innerHTML = '<p class="comments-loading">' + escapeHtml(text('comments.loading', '加载中...')) + '</p>';
    return fetch('/api/comments?page=' + encodeURIComponent(CONFIG.pagePath))
      .then(function(res) { return res.json(); })
      .then(function(result) {
        state.comments = result.data || [];
        renderComments(list);
      })
      .catch(function() {
        list.innerHTML = '<p class="comments-error">' + escapeHtml(text('comments.error.load', '加载失败，请稍后重试')) + '</p>';
      });
  }

  function renderComments(list) {
    if (!state.comments.length) {
      list.innerHTML = '<p class="comments-empty">' + escapeHtml(text('comments.empty', '暂无留言，来写第一条吧！')) + '</p>';
      return;
    }
    list.innerHTML = state.comments.map(function(comment) {
      return '<article class="comment-item">' +
        '<div class="comment-header"><span class="comment-author">' + escapeHtml(comment.author_name) + '</span><span class="comment-date">' + escapeHtml(new Date(comment.created_at).toLocaleString()) + '</span></div>' +
        '<div class="comment-body">' + renderMarkdown(comment.content || '') + '</div>' +
      '</article>';
    }).join('');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.Comments = { init: init, loadComments: loadComments };
})();
```

- [ ] **Step 3: Add comment identity CSS**

Append to `assets/css/comments.css`:

```css
.comments-identity-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2, 0.5rem);
  margin-bottom: var(--space-3, 0.75rem);
}

.comments-name,
.comments-email,
.comments-website {
  width: 100%;
  padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
  background: var(--color-bg-secondary, #0A0A0A);
  border: 1px solid var(--color-border, #3F3F46);
  border-radius: var(--radius-md, 0.5rem);
  color: var(--color-text, #FAFAFA);
  font: inherit;
}

.comments-status {
  min-height: 1.25rem;
  margin: var(--space-2, 0.5rem) 0 0;
  color: var(--color-text-muted, #71717A);
  font-size: var(--text-sm, 0.875rem);
}

@media (max-width: 720px) {
  .comments-identity-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Remove Cloudbase SDK from `index.html`**

Delete this block:

```html
    <!-- Cloudbase SDK -->
    <script src="https://imgcache.qq.com/qcloud/cloudbase-js-sdk/1.7.1/cloudbase.full.js"></script>
```

- [ ] **Step 5: Bump comments asset versions**

In `index.html`, change:

```html
    <script src="/assets/js/comments.js?v=1" defer></script>
```

to:

```html
    <script src="/assets/js/comments.js?v=2" defer></script>
```

In `sw.js`, change `SW_VERSION` from `35` to `36`, and update:

```js
  '/assets/js/comments.js?v=1',
```

to:

```js
  '/assets/js/comments.js?v=2',
```

- [ ] **Step 6: Verify syntax**

Run:

```powershell
node --check api/comments.js
node --check assets/js/comments.js
npm test
```

Expected: all checks pass.

- [ ] **Step 7: Commit comments migration**

Run:

```powershell
git add api/comments.js assets/js/comments.js assets/css/comments.css index.html sw.js
git commit -m "feat: migrate comments to vercel api"
```

---

### Task 6: Analytics API, Tracker, And Public Counters

**Files:**
- Create: `api/track.js`
- Create: `api/public-stats.js`
- Modify: `assets/js/analytics.js`
- Modify: `index.html`
- Modify: `sw.js`

- [ ] **Step 1: Create `api/track.js`**

Write:

```js
const { sendJson, sendError, readJson, requireMethod } = require('./_lib/http');
const { getSupabaseAdmin } = require('./_lib/supabase');
const { hashIp, normalizeVisitorKey } = require('./_lib/security');

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

function domainFromReferrer(referrer) {
  try {
    return referrer ? new URL(referrer).hostname.slice(0, 200) : '';
  } catch (err) {
    return '';
  }
}

function browserFamily(ua) {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  return 'Other';
}

function deviceFamily(ua) {
  if (/Mobile|Android|iPhone/i.test(ua)) return 'Mobile';
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['POST'])) return;

  try {
    const body = await readJson(req);
    if (body.doNotTrack) return sendJson(res, 200, { success: true, tracked: false });

    const pagePath = clean(body.pagePath || body.page || '/', 300) || '/';
    const sessionId = clean(body.sessionId, 120);
    if (!sessionId) return sendError(res, 400, 'Missing session id');

    const userAgent = clean(body.userAgent || req.headers['user-agent'], 500);
    const referrer = clean(body.referrer, 500);
    const visitorKey = normalizeVisitorKey(body.visitorId);
    const ipHash = hashIp(req.headers['x-forwarded-for'] || req.socket.remoteAddress, process.env.IP_HASH_SALT);
    const db = getSupabaseAdmin();

    await db.from('page_views').insert({
      page_path: pagePath,
      session_id: sessionId,
      visitor_key: visitorKey || null,
      referrer,
      referrer_domain: domainFromReferrer(referrer),
      browser_family: browserFamily(userAgent),
      device_family: deviceFamily(userAgent),
      ip_hash: ipHash
    });

    await db.rpc('increment_page_stats', { target_page: pagePath }).throwOnError();
    return sendJson(res, 200, { success: true, tracked: true });
  } catch (err) {
    return sendError(res, 500, 'Failed to track view');
  }
};
```

- [ ] **Step 2: Extend migration with stats increment function**

Append to `supabase/migrations/202605080001_interactive_features.sql`:

```sql
create or replace function public.increment_page_stats(target_page text)
returns void
language plpgsql
security definer
as $$
declare
  today date := (now() at time zone 'utc')::date;
begin
  insert into public.page_stats (page_path, pv, uv, updated_at)
  values (target_page, 1, 1, now())
  on conflict (page_path)
  do update set pv = public.page_stats.pv + 1, updated_at = now();

  insert into public.daily_stats (stat_date, page_path, pv, uv, updated_at)
  values (today, target_page, 1, 1, now())
  on conflict (stat_date, page_path)
  do update set pv = public.daily_stats.pv + 1, updated_at = now();
end;
$$;
```

- [ ] **Step 3: Create `api/public-stats.js`**

Write:

```js
const { sendJson, sendError, requireMethod } = require('./_lib/http');
const { getSupabaseAdmin } = require('./_lib/supabase');

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['GET'])) return;

  try {
    const pagePath = clean(req.query.page || '/', 300) || '/';
    const db = getSupabaseAdmin();
    const { data: pageStats } = await db.from('page_stats').select('*').eq('page_path', pagePath).maybeSingle();
    const { count: totalComments } = await db.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'approved');
    const { count: supporterCount } = await db.from('rewards').select('id', { count: 'exact', head: true }).in('status', ['approved', 'verified']);
    const { data: recentRewards } = await db
      .from('public_rewards')
      .select('display_name, message, amount, currency, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return sendJson(res, 200, {
      success: true,
      data: {
        page: pageStats || { page_path: pagePath, pv: 0, uv: 0 },
        totalComments: totalComments || 0,
        supporterCount: supporterCount || 0,
        recentRewards: recentRewards || []
      }
    });
  } catch (err) {
    return sendError(res, 500, 'Failed to load public stats');
  }
};
```

- [ ] **Step 4: Replace `assets/js/analytics.js`**

Write:

```js
/**
 * Analytics Module - lightweight Vercel API page view tracking.
 * @version 3.0.0
 */
(function() {
  'use strict';

  var SESSION_KEY = 'kevinten-session';

  function sessionId() {
    try {
      var current = localStorage.getItem(SESSION_KEY);
      if (current) return current;
      current = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
      localStorage.setItem(SESSION_KEY, current);
      return current;
    } catch (err) {
      return String(Date.now()) + Math.random();
    }
  }

  function track() {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    var profile = window.VisitorProfile ? window.VisitorProfile.get() : {};
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePath: window.location.pathname || '/',
        referrer: document.referrer || '',
        userAgent: navigator.userAgent || '',
        sessionId: sessionId(),
        visitorId: profile.visitorId || '',
        doNotTrack: false
      })
    }).catch(function() {});
  }

  function loadPublicStats() {
    var nodes = document.querySelectorAll('[data-public-stat]');
    if (!nodes.length) return;
    fetch('/api/public-stats?page=' + encodeURIComponent(window.location.pathname || '/'))
      .then(function(res) { return res.json(); })
      .then(function(result) {
        if (!result.success) return;
        nodes.forEach(function(node) {
          var key = node.getAttribute('data-public-stat');
          if (key === 'pageViews') node.textContent = result.data.page.pv || 0;
          if (key === 'comments') node.textContent = result.data.totalComments || 0;
          if (key === 'supporters') node.textContent = result.data.supporterCount || 0;
        });
      }).catch(function() {});
  }

  function init() {
    setTimeout(track, 1500);
    setTimeout(loadPublicStats, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
```

- [ ] **Step 5: Add public stats markup to footer**

In `index.html`, inside `.footer-content` before `.footer-links`, add:

```html
            <div class="footer-public-stats" aria-label="Site stats">
                <span><strong data-public-stat="pageViews">-</strong> page views</span>
                <span><strong data-public-stat="comments">-</strong> comments</span>
                <span><strong data-public-stat="supporters">-</strong> supporters</span>
            </div>
```

- [ ] **Step 6: Add CSS for footer stats**

Append to `assets/css/main.css`:

```css
.footer-public-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3, 0.75rem);
  margin: var(--space-4, 1rem) 0;
  color: var(--color-text-muted, #71717A);
  font-size: var(--text-sm, 0.875rem);
}

.footer-public-stats strong {
  color: var(--color-text, #FAFAFA);
  font-weight: 700;
}
```

- [ ] **Step 7: Bump cached analytics assets**

In `index.html`, change:

```html
    <script src="/assets/js/analytics.js?v=2" defer></script>
```

to:

```html
    <script src="/assets/js/analytics.js?v=3" defer></script>
```

In `sw.js`, change `SW_VERSION` from `36` to `37`, update analytics asset to `/assets/js/analytics.js?v=3`, and update main CSS asset version if the link version is changed.

- [ ] **Step 8: Verify syntax**

Run:

```powershell
node --check api/track.js
node --check api/public-stats.js
node --check assets/js/analytics.js
npm test
```

Expected: all checks pass.

- [ ] **Step 9: Commit analytics**

Run:

```powershell
git add api/track.js api/public-stats.js assets/js/analytics.js assets/css/main.css index.html sw.js supabase/migrations/202605080001_interactive_features.sql
git commit -m "feat: add supabase analytics tracking"
```

---

### Task 7: Recorded Rewards And Thanks Wall

**Files:**
- Create: `api/rewards.js`
- Create: `assets/js/rewards.js`
- Create: `assets/css/rewards.css`
- Modify: `index.html`
- Modify: `assets/js/i18n.js`
- Modify: `sw.js`

- [ ] **Step 1: Create `api/rewards.js`**

Write:

```js
const { sendJson, sendError, readJson, requireMethod } = require('./_lib/http');
const { getSupabaseAdmin } = require('./_lib/supabase');
const { normalizeVisitorKey } = require('./_lib/security');
const { moderateReward } = require('./_lib/moderation');

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  const db = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('public_rewards')
      .select('display_name, message, amount, currency, status, verified_at, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return sendError(res, 500, 'Failed to load rewards');
    return sendJson(res, 200, { success: true, data: data || [] });
  }

  if (!requireMethod(req, res, ['GET', 'POST'])) return;

  try {
    const body = await readJson(req);
    const visitorKey = normalizeVisitorKey(body.visitorId);
    const displayName = clean(body.displayName || body.nickname, 40);
    const message = clean(body.message, 300);
    const currency = clean(body.currency || 'CNY', 8).toUpperCase();
    const amount = body.amount === '' || body.amount == null ? null : Number(body.amount);

    if (!visitorKey || !displayName) return sendError(res, 400, 'Missing visitor or display name');
    if (amount != null && (!Number.isFinite(amount) || amount < 0)) return sendError(res, 400, 'Invalid amount');

    const decision = moderateReward({ message, amount });
    const { data, error } = await db
      .from('rewards')
      .insert({
        visitor_key: visitorKey,
        display_name: displayName,
        message: message || null,
        amount,
        currency,
        provider: 'manual_qr',
        status: decision.status,
        metadata: { moderationReason: decision.reason }
      })
      .select('id, status')
      .single();

    if (error) throw error;
    return sendJson(res, 201, { success: true, data });
  } catch (err) {
    return sendError(res, 500, 'Failed to submit reward');
  }
};
```

- [ ] **Step 2: Create `assets/js/rewards.js`**

Write:

```js
/**
 * Rewards Module - QR reward messages and thanks wall.
 * @version 1.0.0
 */
(function() {
  'use strict';

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
  }

  function init() {
    var section = document.getElementById('rewards');
    if (!section) return;
    bind(section);
    loadRewards(section);
  }

  function bind(section) {
    var submit = section.querySelector('.rewards-submit');
    if (!submit) return;
    submit.addEventListener('click', function() {
      var profile = window.VisitorProfile ? window.VisitorProfile.save({
        nickname: section.querySelector('.rewards-name').value
      }) : {};
      var payload = {
        visitorId: profile.visitorId,
        displayName: profile.nickname,
        amount: section.querySelector('.rewards-amount').value,
        currency: section.querySelector('.rewards-currency').value || 'CNY',
        message: section.querySelector('.rewards-message').value
      };
      postReward(section, payload);
    });
  }

  function setStatus(section, message) {
    var node = section.querySelector('.rewards-status');
    if (node) node.textContent = message || '';
  }

  function postReward(section, payload) {
    if (!payload.displayName) return setStatus(section, '请先填写昵称');
    fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res) {
      return res.json();
    }).then(function(result) {
      if (!result.success) throw new Error(result.error || 'failed');
      section.querySelector('.rewards-message').value = '';
      setStatus(section, '已提交，审核后会出现在鸣谢墙');
      loadRewards(section);
    }).catch(function() {
      setStatus(section, '提交失败，请稍后再试');
    });
  }

  function loadRewards(section) {
    var list = section.querySelector('.rewards-list');
    if (!list) return;
    fetch('/api/rewards')
      .then(function(res) { return res.json(); })
      .then(function(result) {
        var rewards = result.data || [];
        if (!rewards.length) {
          list.innerHTML = '<p class="rewards-empty">还没有公开鸣谢。</p>';
          return;
        }
        list.innerHTML = rewards.map(function(item) {
          return '<article class="reward-item">' +
            '<div class="reward-meta"><strong>' + escapeHtml(item.display_name) + '</strong><span>' + escapeHtml(new Date(item.created_at).toLocaleDateString()) + '</span></div>' +
            (item.message ? '<p>' + escapeHtml(item.message) + '</p>' : '') +
            (item.status === 'verified' ? '<span class="reward-verified">Verified</span>' : '') +
          '</article>';
        }).join('');
      }).catch(function() {
        list.innerHTML = '<p class="rewards-empty">鸣谢墙暂时不可用。</p>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
```

- [ ] **Step 3: Create `assets/css/rewards.css`**

Write:

```css
.rewards-section {
  padding: var(--space-8, 2rem) 0;
}

.rewards-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: var(--space-6, 1.5rem);
  align-items: start;
}

.reward-qr-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3, 0.75rem);
}

.reward-qr {
  border: 1px solid var(--color-border, #3F3F46);
  border-radius: var(--radius-lg, 0.75rem);
  padding: var(--space-3, 0.75rem);
  background: var(--color-bg-card, #18181B);
  text-align: center;
}

.reward-qr img {
  width: 100%;
  max-width: 180px;
  aspect-ratio: 1;
  object-fit: contain;
}

.rewards-form,
.rewards-list {
  display: grid;
  gap: var(--space-3, 0.75rem);
}

.rewards-form input,
.rewards-form textarea,
.rewards-form select {
  width: 100%;
  padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
  background: var(--color-bg-secondary, #0A0A0A);
  border: 1px solid var(--color-border, #3F3F46);
  border-radius: var(--radius-md, 0.5rem);
  color: var(--color-text, #FAFAFA);
  font: inherit;
}

.reward-item {
  border: 1px solid var(--color-border, #3F3F46);
  border-radius: var(--radius-lg, 0.75rem);
  padding: var(--space-3, 0.75rem);
  background: var(--color-bg-card, #18181B);
}

.reward-meta {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2, 0.5rem);
  color: var(--color-text-muted, #71717A);
}

.reward-verified {
  color: var(--color-success, #22C55E);
  font-size: var(--text-xs, 0.75rem);
}

@media (max-width: 760px) {
  .rewards-grid,
  .reward-qr-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Add reward markup to `index.html`**

Add this section before the comments section:

```html
    <section class="section rewards-section" id="rewards" data-section-idx="12">
        <div class="container">
            <header class="section-header">
                <span class="section-index">12</span>
                <h2 class="section-title" data-i18n="rewards.title">支持与鸣谢</h2>
                <p class="section-description" data-i18n="rewards.desc">如果内容对你有帮助，欢迎留下支持和一句话。</p>
            </header>
            <div class="rewards-grid">
                <div class="reward-qr-grid" aria-label="Reward QR codes">
                    <figure class="reward-qr">
                        <img src="/images/rewards/wechat-qr.png" alt="WeChat reward QR code" loading="lazy">
                        <figcaption>WeChat</figcaption>
                    </figure>
                    <figure class="reward-qr">
                        <img src="/images/rewards/alipay-qr.png" alt="Alipay reward QR code" loading="lazy">
                        <figcaption>Alipay</figcaption>
                    </figure>
                </div>
                <div class="rewards-form">
                    <input class="rewards-name" maxlength="40" placeholder="昵称">
                    <input class="rewards-amount" type="number" min="0" step="0.01" placeholder="金额（可选）">
                    <select class="rewards-currency" aria-label="Currency">
                        <option value="CNY">CNY</option>
                        <option value="USD">USD</option>
                    </select>
                    <textarea class="rewards-message" maxlength="300" placeholder="留言（可选）"></textarea>
                    <button class="rewards-submit btn btn-primary">提交鸣谢</button>
                    <p class="rewards-status" aria-live="polite"></p>
                </div>
            </div>
            <div class="rewards-list" aria-live="polite"></div>
        </div>
    </section>
```

Then change the comments section `data-section-idx` and visible index from `12` to `13`.

- [ ] **Step 5: Add CSS and script tags**

In `index.html` head, add:

```html
    <link rel="stylesheet" href="/assets/css/rewards.css?v=1">
```

Near the bottom scripts after `visitor-profile.js`, add:

```html
    <script src="/assets/js/rewards.js?v=1" defer></script>
```

- [ ] **Step 6: Add reward QR image assets**

Add the actual reward QR images supplied by the site owner as:

```text
images/rewards/wechat-qr.png
images/rewards/alipay-qr.png
```

If the owner has not supplied these images, pause this task and request the two files before deploying the reward section.

- [ ] **Step 7: Bump service worker**

In `sw.js`, change `SW_VERSION` from `37` to `38`, then add:

```js
  '/assets/css/rewards.css?v=1',
  '/assets/js/rewards.js?v=1',
```

- [ ] **Step 8: Verify syntax**

Run:

```powershell
node --check api/rewards.js
node --check assets/js/rewards.js
npm test
```

Expected: all checks pass.

- [ ] **Step 9: Commit rewards**

Run:

```powershell
git add api/rewards.js assets/js/rewards.js assets/css/rewards.css assets/js/i18n.js index.html sw.js images/rewards
git commit -m "feat: add recorded rewards"
```

---

### Task 8: Admin Auth Shell And Protected API Checks

**Files:**
- Create: `admin/index.html`
- Create: `assets/js/admin.js`
- Create: `assets/css/admin.css`
- Create: `api/admin/summary.js`
- Modify: `index.html`
- Modify: `sw.js`

- [ ] **Step 1: Create admin HTML shell**

Write `admin/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>KevinTen Admin</title>
  <link rel="stylesheet" href="/assets/css/theme.css?v=31">
  <link rel="stylesheet" href="/assets/css/admin.css?v=1">
</head>
<body>
  <main class="admin-shell">
    <section class="admin-login" id="admin-login">
      <h1>Admin</h1>
      <input id="admin-email" type="email" placeholder="owner@example.com" autocomplete="email">
      <button id="admin-login-button">Send magic link</button>
      <p id="admin-login-status" aria-live="polite"></p>
    </section>

    <section class="admin-dashboard" id="admin-dashboard" hidden>
      <header class="admin-header">
        <h1>Site Dashboard</h1>
        <button id="admin-logout-button">Sign out</button>
      </header>
      <nav class="admin-tabs" aria-label="Admin sections">
        <button data-admin-tab="overview" class="active">Overview</button>
        <button data-admin-tab="comments">Comments</button>
        <button data-admin-tab="rewards">Rewards</button>
        <button data-admin-tab="analytics">Analytics</button>
      </nav>
      <div id="admin-content" class="admin-content"></div>
    </section>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="/assets/js/public-config.js"></script>
  <script src="/assets/js/admin.js?v=1"></script>
</body>
</html>
```

`assets/js/public-config.js` is generated locally or during deployment and is ignored by git. Commit only `assets/js/public-config.example.js` in Task 11.

- [ ] **Step 2: Create admin CSS**

Write `assets/css/admin.css`:

```css
body {
  margin: 0;
  background: var(--color-bg, #0A0A0A);
  color: var(--color-text, #FAFAFA);
  font-family: 'DM Sans', system-ui, sans-serif;
}

.admin-shell {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.admin-login,
.admin-dashboard {
  border: 1px solid var(--color-border, #3F3F46);
  border-radius: var(--radius-lg, 0.75rem);
  padding: 24px;
  background: var(--color-bg-card, #18181B);
}

.admin-login {
  max-width: 420px;
  margin: 12vh auto 0;
  display: grid;
  gap: 12px;
}

.admin-login input,
.admin-login button,
.admin-header button,
.admin-tabs button,
.admin-action {
  padding: 10px 12px;
  border-radius: var(--radius-md, 0.5rem);
  border: 1px solid var(--color-border, #3F3F46);
  font: inherit;
}

.admin-login button,
.admin-header button,
.admin-tabs button.active,
.admin-action {
  background: var(--color-primary, #2563EB);
  color: white;
  cursor: pointer;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.admin-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 20px 0;
}

.admin-content {
  display: grid;
  gap: 12px;
}

.admin-card {
  border: 1px solid var(--color-border, #3F3F46);
  border-radius: var(--radius-md, 0.5rem);
  padding: 16px;
  background: var(--color-bg-secondary, #0A0A0A);
}
```

- [ ] **Step 3: Create `api/admin/summary.js`**

Write:

```js
const { sendJson, sendError, requireMethod } = require('../_lib/http');
const { getSupabaseAdmin } = require('../_lib/supabase');
const { requireAdmin } = require('../_lib/security');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['GET'])) return;

  try {
    const admin = await requireAdmin(req);
    const db = getSupabaseAdmin();
    const [{ count: pendingComments }, { count: pendingRewards }, { count: approvedComments }, { count: supporters }] = await Promise.all([
      db.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('rewards').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      db.from('rewards').select('id', { count: 'exact', head: true }).in('status', ['approved', 'verified'])
    ]);

    return sendJson(res, 200, {
      success: true,
      data: {
        admin,
        pendingComments: pendingComments || 0,
        pendingRewards: pendingRewards || 0,
        approvedComments: approvedComments || 0,
        supporters: supporters || 0
      }
    });
  } catch (err) {
    return sendError(res, err.statusCode || 500, err.message || 'Failed to load summary');
  }
};
```

- [ ] **Step 4: Create initial `assets/js/admin.js`**

Write:

```js
(function() {
  'use strict';

  var state = { client: null, session: null };

  function $(id) {
    return document.getElementById(id);
  }

  function setLoginStatus(message) {
    $('admin-login-status').textContent = message || '';
  }

  function config() {
    return window.SUPABASE_PUBLIC_CONFIG || {};
  }

  function initClient() {
    var cfg = config();
    if (!window.supabase || !cfg.url || !cfg.anonKey || cfg.url.indexOf('%') === 0) {
      setLoginStatus('Supabase public config is missing.');
      return null;
    }
    state.client = window.supabase.createClient(cfg.url, cfg.anonKey);
    return state.client;
  }

  function authHeader() {
    return state.session ? { Authorization: 'Bearer ' + state.session.access_token } : {};
  }

  function showDashboard(show) {
    $('admin-login').hidden = show;
    $('admin-dashboard').hidden = !show;
  }

  function renderSummary(data) {
    $('admin-content').innerHTML =
      '<div class="admin-card"><strong>Pending comments</strong><p>' + data.pendingComments + '</p></div>' +
      '<div class="admin-card"><strong>Pending rewards</strong><p>' + data.pendingRewards + '</p></div>' +
      '<div class="admin-card"><strong>Approved comments</strong><p>' + data.approvedComments + '</p></div>' +
      '<div class="admin-card"><strong>Supporters</strong><p>' + data.supporters + '</p></div>';
  }

  function loadSummary() {
    fetch('/api/admin/summary', { headers: authHeader() })
      .then(function(res) { return res.json(); })
      .then(function(result) {
        if (!result.success) throw new Error(result.error || 'failed');
        renderSummary(result.data);
      })
      .catch(function(err) {
        $('admin-content').innerHTML = '<div class="admin-card">' + err.message + '</div>';
      });
  }

  function bind() {
    $('admin-login-button').addEventListener('click', function() {
      var client = state.client || initClient();
      if (!client) return;
      client.auth.signInWithOtp({
        email: $('admin-email').value,
        options: { emailRedirectTo: window.location.href }
      }).then(function(result) {
        setLoginStatus(result.error ? result.error.message : 'Magic link sent.');
      });
    });

    $('admin-logout-button').addEventListener('click', function() {
      state.client.auth.signOut().then(function() {
        state.session = null;
        showDashboard(false);
      });
    });
  }

  function init() {
    var client = initClient();
    bind();
    if (!client) return;
    client.auth.getSession().then(function(result) {
      state.session = result.data.session;
      showDashboard(!!state.session);
      if (state.session) loadSummary();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
```

- [ ] **Step 5: Verify syntax**

Run:

```powershell
node --check api/admin/summary.js
node --check assets/js/admin.js
npm test
```

Expected: all checks pass.

- [ ] **Step 6: Commit admin shell**

Run:

```powershell
git add admin/index.html assets/js/admin.js assets/css/admin.css api/admin/summary.js
git commit -m "feat: add owner admin shell"
```

---

### Task 9: Admin Moderation And Analytics Endpoints

**Files:**
- Create: `api/admin/comments/[id].js`
- Create: `api/admin/rewards/[id].js`
- Create: `api/admin/analytics.js`
- Modify: `assets/js/admin.js`

- [ ] **Step 1: Create comment moderation endpoint**

Write `api/admin/comments/[id].js`:

```js
const { sendJson, sendError, readJson, requireMethod } = require('../../_lib/http');
const { getSupabaseAdmin } = require('../../_lib/supabase');
const { requireAdmin } = require('../../_lib/security');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['PATCH'])) return;

  try {
    const admin = await requireAdmin(req);
    const body = await readJson(req);
    const status = String(body.status || '');
    if (!['approved', 'hidden', 'spam'].includes(status)) return sendError(res, 400, 'Invalid status');

    const id = req.query.id;
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('comments')
      .update({ status, moderation_reason: body.reason || null })
      .eq('id', id)
      .select('id, status')
      .single();
    if (error) throw error;

    await db.from('moderation_events').insert({
      target_type: 'comment',
      target_id: id,
      action: status,
      actor_email: admin.email,
      reason: body.reason || null
    });

    return sendJson(res, 200, { success: true, data });
  } catch (err) {
    return sendError(res, err.statusCode || 500, err.message || 'Failed to update comment');
  }
};
```

- [ ] **Step 2: Create reward moderation endpoint**

Write `api/admin/rewards/[id].js`:

```js
const { sendJson, sendError, readJson, requireMethod } = require('../../_lib/http');
const { getSupabaseAdmin } = require('../../_lib/supabase');
const { requireAdmin } = require('../../_lib/security');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['PATCH'])) return;

  try {
    const admin = await requireAdmin(req);
    const body = await readJson(req);
    const status = String(body.status || '');
    if (!['approved', 'hidden', 'verified'].includes(status)) return sendError(res, 400, 'Invalid status');

    const id = req.query.id;
    const db = getSupabaseAdmin();
    const update = { status };
    if (status === 'verified') update.verified_at = new Date().toISOString();

    const { data, error } = await db
      .from('rewards')
      .update(update)
      .eq('id', id)
      .select('id, status')
      .single();
    if (error) throw error;

    await db.from('moderation_events').insert({
      target_type: 'reward',
      target_id: id,
      action: status,
      actor_email: admin.email,
      reason: body.reason || null
    });

    return sendJson(res, 200, { success: true, data });
  } catch (err) {
    return sendError(res, err.statusCode || 500, err.message || 'Failed to update reward');
  }
};
```

- [ ] **Step 3: Create admin analytics endpoint**

Write `api/admin/analytics.js`:

```js
const { sendJson, sendError, requireMethod } = require('../_lib/http');
const { getSupabaseAdmin } = require('../_lib/supabase');
const { requireAdmin } = require('../_lib/security');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['GET'])) return;

  try {
    await requireAdmin(req);
    const db = getSupabaseAdmin();
    const { data: daily } = await db
      .from('daily_stats')
      .select('stat_date, page_path, pv, uv')
      .order('stat_date', { ascending: false })
      .limit(30);

    const { data: pages } = await db
      .from('page_stats')
      .select('page_path, pv, uv, comments_count, rewards_count')
      .order('pv', { ascending: false })
      .limit(20);

    return sendJson(res, 200, { success: true, data: { daily: daily || [], pages: pages || [] } });
  } catch (err) {
    return sendError(res, err.statusCode || 500, err.message || 'Failed to load analytics');
  }
};
```

- [ ] **Step 4: Extend `assets/js/admin.js` tabs**

Add functions:

```js
  function apiGet(path) {
    return fetch(path, { headers: authHeader() }).then(function(res) { return res.json(); });
  }

  function renderAnalytics(data) {
    $('admin-content').innerHTML = '<div class="admin-card"><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
  }

  function bindTabs() {
    document.querySelectorAll('[data-admin-tab]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('[data-admin-tab]').forEach(function(item) { item.classList.remove('active'); });
        btn.classList.add('active');
        if (btn.dataset.adminTab === 'overview') return loadSummary();
        if (btn.dataset.adminTab === 'analytics') {
          return apiGet('/api/admin/analytics').then(function(result) {
            renderAnalytics(result.data || {});
          });
        }
        $('admin-content').innerHTML = '<div class="admin-card">Use Supabase table view for this first release, or add list endpoints in the next task.</div>';
      });
    });
  }
```

Call `bindTabs();` inside `init()` after `bind();`.

- [ ] **Step 5: Verify syntax**

Run:

```powershell
node --check api/admin/comments/[id].js
node --check api/admin/rewards/[id].js
node --check api/admin/analytics.js
node --check assets/js/admin.js
npm test
```

Expected: all checks pass.

- [ ] **Step 6: Commit admin endpoints**

Run:

```powershell
git add api/admin assets/js/admin.js
git commit -m "feat: add admin moderation endpoints"
```

---

### Task 10: Stripe Checkout And Webhook

**Files:**
- Create: `api/rewards/checkout.js`
- Create: `api/webhooks/stripe.js`
- Modify: `docs/interactive-features-ops.md`

- [ ] **Step 1: Create Stripe checkout endpoint**

Write `api/rewards/checkout.js`:

```js
const Stripe = require('stripe');
const { sendJson, sendError, readJson, requireMethod } = require('../_lib/http');
const { getSupabaseAdmin } = require('../_lib/supabase');
const { normalizeVisitorKey } = require('../_lib/security');

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['POST'])) return;

  try {
    const body = await readJson(req);
    const visitorKey = normalizeVisitorKey(body.visitorId);
    const displayName = String(body.displayName || 'Supporter').trim().slice(0, 40);
    if (!visitorKey) return sendError(res, 400, 'Missing visitor');

    const db = getSupabaseAdmin();
    const { data: reward, error } = await db
      .from('rewards')
      .insert({
        visitor_key: visitorKey,
        display_name: displayName,
        message: String(body.message || '').trim().slice(0, 300) || null,
        amount: null,
        currency: 'USD',
        provider: 'stripe',
        status: 'pending'
      })
      .select('id')
      .single();
    if (error) throw error;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = process.env.SITE_ORIGIN || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: process.env.STRIPE_REWARD_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/#rewards`,
      cancel_url: `${origin}/#rewards`,
      metadata: { reward_id: reward.id }
    });

    await db.from('rewards').update({ provider_order_id: session.id }).eq('id', reward.id);
    return sendJson(res, 200, { success: true, data: { url: session.url } });
  } catch (err) {
    return sendError(res, 500, 'Failed to create checkout');
  }
};
```

- [ ] **Step 2: Create Stripe webhook endpoint**

Write `api/webhooks/stripe.js`:

```js
const Stripe = require('stripe');
const { sendJson, sendError, requireMethod } = require('../_lib/http');
const { getSupabaseAdmin } = require('../_lib/supabase');

async function rawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (!requireMethod(req, res, ['POST'])) return;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const payload = await rawBody(req);
    const signature = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const rewardId = session.metadata && session.metadata.reward_id;
      if (rewardId) {
        await getSupabaseAdmin()
          .from('rewards')
          .update({
            provider_order_id: session.id,
            amount: session.amount_total ? session.amount_total / 100 : null,
            currency: String(session.currency || 'usd').toUpperCase(),
            status: 'verified',
            verified_at: new Date().toISOString(),
            metadata: { stripeCustomer: session.customer || null }
          })
          .eq('id', rewardId);
      }
    }

    return sendJson(res, 200, { received: true });
  } catch (err) {
    return sendError(res, 400, 'Invalid Stripe webhook');
  }
};
```

- [ ] **Step 3: Update ops notes**

Add to `docs/interactive-features-ops.md`:

```markdown
## Stripe Test

1. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_REWARD_PRICE_ID`.
2. Run `npx vercel dev`.
3. Use Stripe CLI to forward events:
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Complete a Checkout Session.
5. Confirm the matching `rewards` row changes to `verified`.
```

- [ ] **Step 4: Verify syntax**

Run:

```powershell
node --check api/rewards/checkout.js
node --check api/webhooks/stripe.js
npm test
```

Expected: all checks pass.

- [ ] **Step 5: Commit Stripe hooks**

Run:

```powershell
git add api/rewards/checkout.js api/webhooks/stripe.js docs/interactive-features-ops.md
git commit -m "feat: add stripe reward verification"
```

---

### Task 11: Public Config, I18n, Cache, And HTML Polish

**Files:**
- Create: `assets/js/public-config.example.js`
- Modify: `admin/index.html`
- Modify: `assets/js/i18n.js`
- Modify: `index.html`
- Modify: `sw.js`

- [ ] **Step 1: Create public config example**

Write `assets/js/public-config.example.js`:

```js
window.SUPABASE_PUBLIC_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-public-anon-key'
};
```

- [ ] **Step 2: Confirm admin uses public config file**

Verify `admin/index.html` contains:

```html
  <script src="/assets/js/public-config.js"></script>
```

Do not commit `assets/js/public-config.js`; create it only in local/Vercel deployment setup.

- [ ] **Step 3: Add public config ignore rule**

Add to `.gitignore`:

```gitignore
assets/js/public-config.js
.env.local
```

- [ ] **Step 4: Add i18n keys**

In `assets/js/i18n.js`, add English and Chinese keys for:

```js
'rewards.title'
'rewards.desc'
'comments.name.placeholder'
'comments.email.placeholder'
'comments.website.placeholder'
'comments.error.name'
'comments.error.empty'
'comments.status.approved'
'comments.status.pending'
```

Use existing object style and keep translations concise.

- [ ] **Step 5: Bump all touched cached assets**

In `sw.js`, change `SW_VERSION` from `38` to `39` and make sure `PRECACHE_ASSETS` contains the final versions for:

```js
'/assets/css/comments.css?v=2'
'/assets/css/rewards.css?v=1'
'/assets/css/admin.css?v=1'
'/assets/js/visitor-profile.js?v=1'
'/assets/js/comments.js?v=2'
'/assets/js/analytics.js?v=3'
'/assets/js/rewards.js?v=1'
'/assets/js/admin.js?v=1'
```

Update corresponding script/link versions in `index.html` and `admin/index.html`.

- [ ] **Step 6: Verify HTML references**

Run:

```powershell
rg -n "cloudbase|comments.js\\?v=1|analytics.js\\?v=2" index.html admin assets sw.js
```

Expected: no matches.

- [ ] **Step 7: Commit polish**

Run:

```powershell
git add .gitignore assets/js/public-config.example.js admin/index.html assets/js/i18n.js index.html sw.js
git commit -m "chore: finalize interactive feature wiring"
```

---

### Task 12: End-To-End Verification

**Files:**
- Modify only files required by bugs found during verification.

- [ ] **Step 1: Run static and unit checks**

Run:

```powershell
npm test
node --check assets/js/visitor-profile.js
node --check assets/js/comments.js
node --check assets/js/analytics.js
node --check assets/js/rewards.js
node --check assets/js/admin.js
```

Expected: all checks pass.

- [ ] **Step 2: Run Vercel local dev**

Run:

```powershell
npx vercel dev
```

Expected: local server starts and prints a localhost URL. Keep it running for browser verification.

- [ ] **Step 3: Verify homepage in browser**

Open the Vercel dev URL and check:

- no console errors
- theme toggle works
- mobile navigation still opens and closes
- comments form renders with nickname/email/website fields
- rewards section renders without layout overlap
- footer public counters render with numbers or safe fallback

- [ ] **Step 4: Verify API behavior with curl or PowerShell**

Run these with the dev server port:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/comments?page=/"
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/public-stats?page=/"
```

Expected: JSON responses with `success: true`.

- [ ] **Step 5: Verify representative legacy page**

Open:

```text
http://localhost:3000/2018/08/03/hello-world/
```

Expected: legacy article loads and is not affected by the new homepage-only modules.

- [ ] **Step 6: Commit verification fixes**

If verification required fixes, run:

```powershell
git add <fixed-files>
git commit -m "fix: stabilize interactive feature verification"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review Checklist

- Spec coverage: Tasks cover Vercel migration, Supabase schema/RLS, visitor identity, comments, analytics, rewards, admin, Stripe closure, frontend wiring, service worker cache, and verification.
- Placeholder scan: The plan intentionally includes concrete files, exact code blocks, commands, and expected outputs. The only replaceable values are documented environment variables and actual private QR images/secrets, which must not be committed.
- Type consistency: The shared API utilities use CommonJS, matching `package.json` `type: commonjs`; API files import helpers through stable relative paths; frontend modules use the existing IIFE style.
