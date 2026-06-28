# Cloudflare Preview Implementation Report

## Preview URLs

- Cloudflare Pages stable preview: https://kevinten-interactive-preview.pages.dev
- Latest Cloudflare Pages deployment: https://9c8adc61.kevinten-interactive-preview.pages.dev
- Worker API preview: https://kevinten-api-preview.wshten.workers.dev

## Cloudflare Resources

- Account: `Wshten@gmail.com's Account`
- Account ID: `f53190ff9de65971510ed96e5bd89bee`
- Pages project: `kevinten-interactive-preview`
- Worker: `kevinten-api-preview`
- D1 database: `kevinten_site_preview`
- D1 database ID: `ad0a9263-ea1c-40ab-85e3-902f38e29ccd`
- KV namespace: `worker-SITE_KV`
- KV namespace ID: `35e9b55b48ce4e5ab3e024e9ee45652e`
- KV preview namespace ID: `ed35ac6db9ea45d4a50b4e6bd1b48fec`
- R2 bucket: `kevinten-site-preview-assets`
- Queue: `kevintenpreviewevents`
- Zero Trust team name: `long-haze-d0eb`
- Cloudflare Access app: `KevinTen Admin Preview` (`73acba4b-bbc9-445a-8d09-28ef4db5de60`)
- Cloudflare Access policy: `KevinTen Admin Allow` (`e91be843-1b5f-448d-a438-12f4d1aac7f8`)
- Production Cloudflare zone: `kevinten.com` (`014623dcba379877a65c37c5b823cd40`, currently `initializing`)
- Production Cloudflare nameservers: `chip.ns.cloudflare.com`, `faye.ns.cloudflare.com`
- Production Cloudflare Access apps: `KevinTen Admin Production`, `KevinTen Admin Production (www.kevinten.com)`
- Current Worker version after stats/cutover hardening: `03da8776-fbc9-4430-a76a-71453ea942a2`

## Implemented

- Added a Cloudflare Worker backend using Hono and TypeScript.
- Added D1 schema for users, visitor profiles, comments, reactions, rewards, page views, daily stats, page stats, and admin events.
- Added Worker API routes for auth, users, comments, replies, reactions, rewards, stats, admin moderation, and Stripe webhook.
- Added Auth0 JWT verification code with JWKS caching through KV.
- Hardened Auth0 admin mapping to require a verified email claim and RS256 signing keys.
- Added anonymous fallback for comments and rewards.
- Added KV rate limiting, JWKS caching, public stats caching, least-privilege CORS, and public site config storage.
- Added R2 binding for future QR/avatar/attachment storage.
- Added Queues support for asynchronous stats/comment/reward events, with direct D1 stats fallback for view counts and admin audit records for moderation/notification jobs.
- Replaced Cloudbase homepage comments/analytics scripts with Worker-backed modules.
- Added Auth0 login controls, public stats, rewards section, and admin preview page.
- Hardened the admin UI to render moderation content with DOM text APIs, expanded moderation actions, and prevented service-worker caching of protected API responses.
- Kept the environment-specific runtime config out of Service Worker caches, bumped the Service Worker to v45, and versioned the runtime script reference as `/assets/js/cloudflare-runtime.js?v=2`.
- Added public stats fallback reads from raw `page_views` when asynchronous Queue aggregation lags behind, and fixed direct/queued visitor count increments to update `uv`.
- Restricted CORS to configured preview origins instead of reflecting arbitrary request origins.
- Hardened Stripe webhook processing to require paid Checkout sessions and match existing reward amount/currency before marking rewards verified.
- Added Cloudflare/Auth0/Stripe automation scripts.
- Added preview defaults for Auth0 callback/logout/origin URLs and Cloudflare Access provisioning.
- Added default Cloudflare Pages preview runtime values for the Worker URL and Auth0 SPA client so `npm run deploy:pages` is safe for the current preview project without exporting environment variables.
- Added production cutover provisioning and readiness gates for Pages custom domains, Cloudflare zone status, Cloudflare DNS records, Access production admin paths through both HTTP and API evidence, reward QR codes, Auth0 production origins, Worker production CORS, and production HTTP responses.
- Set preview Worker `ADMIN_EMAILS` to `wshten@gmail.com` so authenticated admin tokens can be recognized after Auth0 is connected.
- Added Cloudflare ops documentation and Cloudflare-specific spec/plan.
- Deployed Worker and Pages preview without modifying `CNAME` or the GitHub Pages production site.

## Verification

Commands run:

```powershell
npm run verify
npm run provision:cloudflare
npx wrangler d1 migrations apply kevinten_site_preview --config worker/wrangler.toml --remote
npm run deploy:worker
$env:API_BASE_URL='https://kevinten-api-preview.wshten.workers.dev'; npm run deploy:pages
npm run deploy:pages
npm run provision:auth0
$env:WORKER_API_URL='https://kevinten-api-preview.wshten.workers.dev'; npm run provision:stripe
stripe trigger checkout.session.completed
stripe events list --limit 1 --type checkout.session.completed
$env:PAGES_URL='https://9c8adc61.kevinten-interactive-preview.pages.dev'; $env:PREVIEW_AUDIT_OUT='docs/maintenance/2026-06-28-preview-smoke.json'; npm run verify:preview
npm run provision:access
npm run provision:cutover
npm run verify:qrs
npm run verify:cutover
```

Results:

- TypeScript typecheck: passed.
- Vitest: 22 files, 108 tests passed after the stats, payments, QR, DNS, authoritative DNS, Windows `nslookup` fallback, cutover audit, preview audit, maintenance audit verification, production HTTP, Access HTTP, and cutover hardening pass.
- Pages preview build: passed.
- `npm audit --json`: passed with 0 vulnerabilities after upgrading the dev Vitest/Vite chain to Vitest `4.1.9`.
- Maintenance audit verification: `npm run verify:audits` passed for 4 JSON artifacts: completion audit, cutover readiness, preview smoke, and Worker startup.
- D1 migrations: applied `0001_initial.sql` and `0002_reaction_actor_keys.sql` successfully.
- Worker deploy: succeeded with D1, KV, R2, Queue producer, and Queue consumer bindings; current version is `03da8776-fbc9-4430-a76a-71453ea942a2`.
- Worker dry-run bundle check passed with Wrangler `4.104.0`: upload size `131.05 KiB`, gzip size `30.12 KiB`, bundle saved to `output/wrangler/kevinten-api-preview.bundle.mjs`.
- Worker startup profile passed from the dry-run bundle: `output/wrangler/worker-startup.cpuprofile` recorded 3 nodes, 3 samples, and about `11.85ms` local startup duration. `wrangler check startup --config worker/wrangler.toml` did not read the TOML entry point in this environment, so the repeatable path is dry-run bundle first, then `--workerBundle`.
- Pages preview deploy: succeeded at `https://9c8adc61.kevinten-interactive-preview.pages.dev`; stable preview is `https://kevinten-interactive-preview.pages.dev`.
- Queue list: `kevintenpreviewevents` shows 1 producer and 1 consumer.
- Queue processing records pending comment/reward moderation tasks and approved/verified notification tasks in `admin_events`.
- Removed the stray empty preview queue `kevinten-site-preview-events` after the old provision script import side effect created it during a failing test.
- Cloudflare provisioning script: uses the local Wrangler package when available, defaults to `kevintenpreviewevents`, and no longer executes commands when imported by tests.
- Worker compatibility date is still `2024-06-20`; keep this as a deliberate future compatibility task rather than changing it incidentally during production cutover.
- Worker health endpoint: returned `{ success: true, data: { status: "ok" } }`.
- Public site config endpoint: returned default KV-backed config from `/api/config`.
- Public stats endpoint: returned success with smoke page `pv: 1` and `uv: 1`.
- Public stats endpoint now falls back to raw `page_views` if Queue aggregation has not caught up yet.
- Anonymous comment POST: succeeded and wrote an approved smoke-test comment.
- Anonymous comments GET: returned the smoke-test comment.
- Stripe webhook signature verification: direct signed test payload returned success; local tests now reject stale signatures and unpaid Checkout sessions.
- Stripe CLI trigger: `checkout.session.completed` succeeded; latest event had `pending_webhooks: 0`.
- Preview smoke script: `PREVIEW_AUDIT_OUT=docs/maintenance/2026-06-28-preview-smoke.json npm run verify:preview` passed for worker health, anonymous auth state, profile/admin protection, stats, comments, reactions, reward records, runtime config, admin shell, and legacy article preservation.
- Preview smoke script passed against `https://9c8adc61.kevinten-interactive-preview.pages.dev`; the generated runtime used `https://kevinten-api-preview.wshten.workers.dev`, a redacted Auth0 SPA client ID from the local provisioning output, and production-ready allowed origins.
- Preview smoke script passed again on June 28, 2026 against `https://kevinten-interactive-preview.pages.dev` at 2026-06-28T15:32:14Z with latest smoke page `/preview-smoke-1782660698508`; the JSON audit recorded 15 checks, 15 passed, 0 failed, and `homeIncludesAuth0: true`.
- CORS check: an arbitrary origin did not receive `Access-Control-Allow-Origin`; the stable preview origin did.
- Browser smoke check: the in-app browser loaded the preview homepage, rendered public stats and comment data from the Worker-backed modules, and reported no site console errors. Browser-plugin telemetry timeouts were ignored as unrelated to the site.
- Browser QA on June 28, 2026 captured desktop and mobile screenshots under `output/playwright/`, confirmed zero console errors/warnings, found no mobile horizontal overflow, and confirmed login, rewards, comments, public stats, and admin shell elements render in the preview.
- `npm run verify:preview` writes preview-only smoke records; do not run it against production data without adjusting the script.
- Admin shell check: `https://kevinten-interactive-preview.pages.dev/admin/` now redirects unauthenticated visitors to Cloudflare Access.
- Legacy page check: `https://kevinten-interactive-preview.pages.dev/2018/08/03/hello-world/` returned 200.
- Auth0 SPA/API provisioning is complete for tenant `dev-8abkwbejxgjbcz1l.us.auth0.com`. The SPA client ID is intentionally not copied into this report; it allows the stable preview URL and the known hash deployment URLs for callback, logout, and web origins.
- Cloudflare Zero Trust Free was activated after explicit confirmation of the overage billing terms.
- Cloudflare Access API token was created through the Cloudflare dashboard and stored in the Windows user environment variable `CLOUDFLARE_API_TOKEN`.
- Cloudflare Access application and allow policy were created for `kevinten-interactive-preview.pages.dev/admin/*`; unauthenticated requests now redirect to `long-haze-d0eb.cloudflareaccess.com`.
- Cloudflare Access gates the static admin shell. Worker `/api/admin/*` authorization is enforced by Auth0 admin JWTs, not raw Access email headers.
- Aliyun registrar nameservers for `kevinten.com` were changed on June 28, 2026 from `dns13.hichina.com` / `dns14.hichina.com` to `chip.ns.cloudflare.com` / `faye.ns.cloudflare.com`.
- The `.com` registry authoritative servers return the Cloudflare nameservers, while local recursive DNS may continue returning the old HiChina nameservers until cache expiry.
- Cloudflare Dashboard DNS records for the production zone were previously created: `kevinten.com` and `www.kevinten.com` both CNAME to `kevinten-interactive-preview.pages.dev` with proxy enabled. The current automation credential cannot re-read `/zones/:id/dns_records`, so this remains a dashboard-observed state until a zone DNS read-scoped token is available.
- Cloudflare zone activation is still pending (`initializing`), so Cloudflare authoritative nameservers currently return `REFUSED` for both `kevinten.com` and `www.kevinten.com`; Pages custom domains may remain `pending` until Cloudflare completes activation.
- `npm run verify:cutover` now times out Auth0 CLI checks via `AUTH0_CLI_TIMEOUT_MS` instead of hanging, then continues through QR, Pages custom domains, Cloudflare zone status, Cloudflare DNS records, registry delegation, Cloudflare authoritative DNS, recursive DNS, production HTTP, production admin HTTP Access protection, and Access API checks. Pages custom-domain API read failures are reported as not ready without preventing later DNS/HTTP diagnostics. The verifier checks `.com` registry delegation separately from recursive DNS and direct Cloudflare nameserver answers so registrar state, Cloudflare zone activation, and resolver-cache state are not conflated, uses `nslookup` fallbacks on Windows when `dig` is unavailable, rejects production HTTP that is still served by GitHub Pages instead of Cloudflare Pages, rejects production admin paths that are not protected by Cloudflare Access, and preserves final response headers when falling back from `fetch` to `curl`. The QR, Stripe, and cutover scripts also use Windows-safe `pathToFileURL` CLI entry checks so direct `npm run ...` commands actually execute on Windows. Set `CUTOVER_AUDIT_OUT=docs/maintenance/2026-06-28-cutover-readiness.json` to also write a machine-readable readiness snapshot.

## Automation Blockers

- Auth0 browser login and provisioning are complete. Runtime config now uses `https://kevinten-interactive-preview.pages.dev/` as the default redirect URL, and the latest preview deploy includes Auth0 login settings.
- Cloudflare Queue creation succeeded with the shorter queue name `kevintenpreviewevents`. The originally requested `kevinten-site-preview-events` name failed Cloudflare validation with `The specified queue settings are invalid`.
- Cloudflare Access is active for the preview admin path. The created token has Access read/edit permissions and should be kept local; do not commit or print it.
- `AUTH0_CLI_TIMEOUT_MS=5000 CUTOVER_AUDIT_OUT=docs/maintenance/2026-06-28-cutover-readiness.json npm run verify:cutover` was rerun at 2026-06-28T15:29:20Z and still reports production not ready with 24 checks: 10 passed and 14 not ready. Auth0 verification requires `AUTH0_CLIENT_ID` from local config instead of a committed SPA client ID; a follow-up no-file run using the public preview runtime client ID reached the Auth0 CLI but reported `Config.json file is missing`, so local Auth0 CLI login/config restoration is the remaining Auth0 automation blocker. The WeChat QR is not a collect-money QR, Pages custom domains and Cloudflare DNS records cannot be read with the active credential, Cloudflare zone status is `initializing`, `.com` registry delegation is correct, Cloudflare authoritative nameservers return `NOERROR` with zero answers for both production hosts, recursive DNS currently returns no usable production answers, and `https://kevinten.com/` plus `https://www.kevinten.com/` fail TLS handshakes instead of serving Cloudflare Pages and Cloudflare Access.
- `npm run verify:qrs` currently fails the WeChat QR gate because `img/weixin.jpg` decodes to `https://u.wechat.com/ELhLlxAvOByQm1K65g7b72U`, a contact/follow QR rather than a collect-money QR. `img/alipay.jpg` decodes to an Alipay QR and still needs one real phone scan before cutover.

## Stripe

- Stripe CLI is logged in.
- Stripe webhook endpoint was created for `https://kevinten-api-preview.wshten.workers.dev/api/webhooks/stripe`.
- Stripe test trigger succeeded.
- The Worker `STRIPE_WEBHOOK_SECRET` secret was set through Wrangler.
- The report intentionally does not include the webhook signing secret.
- The current Worker only verifies Stripe events that reference an existing reward ID through metadata or `client_reference_id`; a first-class Stripe Checkout creation route remains a production enhancement before a full payment UI launch.

## Production Cutover Guidance

Do not change the repository `CNAME` yet. As of June 28, 2026:

1. `kevinten.com` has been delegated at the registrar to Cloudflare nameservers, and the `.com` registry reflects that delegation.
2. Recursive DNS can still return the old GitHub Pages/HiChina state until cache expiry.
3. Cloudflare zone status is still `initializing`; Pages custom domains remain pending until zone activation and HTTP validation complete.
4. Production Cloudflare Access apps exist for both apex and `www` admin paths.
5. Replace the WeChat image with a real WeChat collect-money QR before relying on public support payments.
6. Keep GitHub Pages intact until Cloudflare serves `https://kevinten.com/` and `https://www.kevinten.com/` successfully with Cloudflare response headers and the generated runtime marker, and rollback has been verified.
