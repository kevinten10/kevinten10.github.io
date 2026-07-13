# Cloudflare Production Implementation Report

Last verified: 2026-07-13.

## Live Surfaces

| Surface | URL | Current evidence |
| --- | --- | --- |
| Production | `https://kevinten.com/` | HTTP 200 from Cloudflare Pages |
| Production alias | `https://www.kevinten.com/` | HTTP 200 from Cloudflare Pages |
| Stable Pages origin | `https://kevinten-interactive-preview.pages.dev/` | HTTP 200 and current runtime config |
| Verified release | `https://ff7bf067.kevinten-interactive-preview.pages.dev/` | Production deployment `ff7bf067-435a-4db4-8270-938386efb7b2`, source `e49b3ed` |
| Worker API | `https://kevinten-api-preview.wshten.workers.dev/` | `/health` returns `success: true` |
| Admin | `/admin/` on all production hosts | Redirects to Cloudflare Access |

The Pages project and Worker retain their historical `preview` names, but they now serve production. The Pages production branch is also named `preview`.

## Implemented Architecture

- Static HTML/CSS/JavaScript frontend on Cloudflare Pages.
- Hono and TypeScript API on Cloudflare Workers.
- D1 tables for users, profiles, comments, reactions, rewards, page views, statistics, and admin events.
- KV-backed rate limiting, JWKS caching, public statistics caching, and site configuration.
- R2 binding for managed assets and Queues for asynchronous event processing.
- Auth0 visitor login with anonymous fallback; verified Auth0 JWT authorization for protected Worker routes.
- Cloudflare Access in front of the static admin shell, with independent Worker admin authorization.
- Anonymous and signed-in comments, reactions, public statistics, support records, and an admin moderation surface.
- Alipay QR support plus Stripe Embedded Checkout in sandbox mode.
- Stripe webhook signature, payment status, amount, currency, and reward-reference verification before a reward is marked paid.
- Generated 143-item article index and preservation of legacy article URLs.
- Personal promo video and selected project artwork; the redundant standalone media showcase was removed.

## Current Verification

The following gates passed on 2026-07-13:

```powershell
npm run verify:all
npm run verify:preview   # with PAGES_URL=https://kevinten.com
npm run verify:qrs
npm run verify:cutover
npm audit --json
npm --prefix next-portfolio audit --json
npm --prefix video audit --json
```

Results:

- Worker typecheck passed.
- All 22 Vitest files passed; the suite includes auth, CORS, comments, reactions, rewards, Stripe, queues, schema, provisioning, cutover, and frontend security coverage.
- Pages build passed and the generated article index remained current at 143 articles.
- Next.js candidate lint and production build passed.
- Root, Next.js, and video workspaces reported zero npm vulnerabilities.
- Production smoke passed all 15 checks: Worker health, anonymous auth state, protected profile/admin APIs, page views, comments, reactions, rewards, public stats, runtime config, admin shell, and a legacy article.
- Cutover verification passed DNS delegation, authoritative and recursive DNS, Pages domains, Cloudflare zone and records, CORS, Auth0 public authorize/logout routes, production HTTP, and Access protection.
- Desktop and mobile checks found no horizontal overflow or console errors; the retained promo-video control opens the expected MP4.

`npm run verify:cutover` discovers the public Auth0 client ID from the deployed runtime when `AUTH0_CLIENT_ID` is not exported. The Auth0 CLI may still be logged out locally; the verifier then uses public authorize/logout checks without exposing credentials.

## Payments And QR Policy

- Alipay is the only enabled real QR method. The QR decodes as an Alipay URL; a phone scan remains the final human confirmation of the recipient account.
- WeChat is intentionally disabled until a verified collect-money QR is supplied. The previous contact/follow QR is not rendered as a payment option.
- Stripe remains sandbox-only. Live mode requires a separate business, KYC, pricing, and refund-policy decision.

## Operations

```powershell
# Broad local gate
npm run verify:all

# Production readiness and smoke gates
npm run verify:cutover
$env:PAGES_URL='https://kevinten.com'; npm run verify:preview

# Deploy the static production branch
npm run deploy:pages

# Deploy Worker changes only when worker source or bindings change
npm run deploy:worker
```

The Pages deployment command requires Auth0 configuration and stops before upload when the public client ID is missing. Environment-specific runtime config is excluded from Service Worker caching.

## Rollback And Intentional Limits

- GitHub Pages remains the rollback source on `master`; routine Cloudflare deployments do not modify registrar nameservers, `CNAME`, or GitHub Pages settings.
- The Next.js app is a source-only migration candidate and does not replace the static production entry point.
- R2 is provisioned but uploads/attachments are not exposed to visitors yet.
- Auth0 CLI login is optional for public production verification but required for future Auth0 configuration mutations.
- Worker deployment-version listing requires a token with the corresponding Workers read permission; API health and behavior are verified independently.
