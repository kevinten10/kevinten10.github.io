# Repository Working Guide

## Current Architecture

This repository contains KevinTen's production personal website and its supporting workspaces.

- The production site is the root vanilla HTML/CSS/JavaScript application served by Cloudflare Pages at `kevinten.com`.
- `worker/` is the Hono-based Cloudflare Worker API for authentication, comments, reactions, rewards, statistics, and admin operations.
- `next-portfolio/` is an isolated Next.js 16 migration candidate. Follow its `AGENTS.md`; do not treat it as the production entry point.
- `video/` contains both production promo assets and reproducible media-production sources.
- GitHub Pages on `master` is retained as a rollback path, not the active custom-domain host.

Current deployment evidence is recorded in `docs/maintenance/2026-07-11-current-status.md`. Older dated audits are historical snapshots and may describe blockers that have since been resolved.

## Important Paths

| Path | Purpose |
| --- | --- |
| `index.html`, `articles.html`, `assets/` | Production static site |
| `2018/`, `2019/`, `archives/`, `categories/`, `tags/` | Legacy blog URLs that must remain stable |
| `worker/`, `scripts/` | Cloudflare API, deployment, provisioning, and verification |
| `admin/` | Static admin shell protected by Cloudflare Access |
| `next-portfolio/` | Next.js migration candidate |
| `video/` | Promo assets and media-production workspace |
| `docs/maintenance/screenshots/` | Curated UI audit evidence |

Generated output such as `dist/`, `node_modules/`, `.next/`, Playwright output, video frames, and intermediate media must remain ignored.

## Development and Verification

Use Node.js 20 or newer.

```bash
npm ci

# Production static site
python3 -m http.server 8000

# Worker development
npm run dev:worker

# Core typecheck, Worker tests, Pages build, and audit validation
npm run verify

# Next.js candidate lint and production build
npm run verify:next

# Both workspaces
npm run verify:all

# Video capture script syntax
npm --prefix video test
```

After `npm run build:pages`, only the production promo MP4 and poster should exist under `dist/pages/video/`. Do not publish the entire video-production workspace.

## Deployment

These commands mutate external Cloudflare resources and must only be run when deployment is explicitly intended:

```bash
npm run deploy:pages
npm run deploy:worker
```

Provisioning commands modify Cloudflare, Auth0, or Stripe configuration. Inspect their required account and environment context before running them.

The active Cloudflare Pages project is `kevinten-interactive-preview`; the name is historical even though it now serves production. The Worker is `kevinten-api-preview`. Do not rename production resources as incidental cleanup.

## Safety and Repository Hygiene

- Never print, copy, or commit `.env`, `.env.local`, `.dev.vars`, access tokens, private keys, cookies, or webhook secrets.
- Only commit placeholder values in `.env.example` files.
- Inspect `git status --short` before staging because this repository contains large media and QA assets.
- Keep source changes, curated screenshots, and generated output separate.
- Preserve historical blog URLs and the repository `CNAME` unless a dedicated migration plan says otherwise.
- Do not enable WeChat rewards until a verified collect-money QR is available. Stripe remains sandbox-only.

## Code Conventions

- Production frontend: modern browser JavaScript, semantic HTML, two-space indentation, and existing CSS tokens/components.
- Worker: TypeScript with tests under `worker/tests/`.
- Next.js candidate: follow `next-portfolio/AGENTS.md` and the installed Next.js documentation referenced there.
- Update asset version query strings and the service-worker cache version when production CSS or JavaScript behavior changes.
