# Comprehensive Explore Audit - 2026-06-28

## Scope

Repository: `/Users/kevinten/projects/agents/projects/websites/kevin/kevinten10.github.io`

Branch: `codex/cloudflare-interactive-preview`

Goal file: `docs/goals/comprehensive-explore-optimize.md`

## Current Evidence

- `npm run verify`: passed. TypeScript passed, Vitest passed with 22 files and 111 tests, `scripts/prepare-pages-preview.mjs` built `dist/pages`, and `npm run verify:audits` passed for 4 maintenance JSON artifacts.
- `npm audit --json`: passed with 0 vulnerabilities after upgrading the dev Vitest/Vite chain to Vitest `4.1.9`.
- `PREVIEW_AUDIT_OUT=docs/maintenance/2026-06-28-preview-smoke.json npm run verify:preview`: passed against `https://kevinten-interactive-preview.pages.dev` at 2026-06-28T16:11:12Z; latest smoke page `/preview-smoke-1782663041294`. The JSON audit recorded 15 checks, 15 passed, 0 failed, and `homeIncludesAuth0: true`.
- `npm run verify:qrs`: not ready. WeChat decodes to `https://u.wechat.com/ELhLlxAvOByQm1K65g7b72U`, a contact/follow QR. Alipay decodes to an Alipay QR and still needs one real phone scan.
- `AUTH0_CLI_TIMEOUT_MS=10000 CUTOVER_AUDIT_OUT=docs/maintenance/2026-06-28-cutover-readiness.json node scripts/verify-cutover-readiness.mjs`: rerun at 2026-06-28T16:08:03Z and still not ready. Worker health, production CORS, Pages runtime, Cloudflare zone existence, registry delegation, Alipay QR decode, apex/www non-GitHub address checks, and Access app coverage passed. The generated JSON audit has 24 checks: 10 passed and 14 not ready. Auth0 verification uses the public preview runtime client ID but reports an expired Auth0 CLI refresh token, WeChat QR failed, Pages custom domains and Cloudflare DNS records cannot be read with the active credential, Cloudflare zone status is `initializing`, Cloudflare authoritative nameservers return `NOERROR` with zero answers for both production hosts, recursive DNS returns no usable nameserver answers, and production HTTP/admin checks fail TLS handshakes instead of serving Cloudflare Pages and Cloudflare Access.
- Auth0 follow-up diagnostic: a direct verifier run using the public preview runtime client ID reached the Auth0 CLI and reported `Auth token expired and --no-input is set; run 'auth0 login' to re-authenticate`, so the remaining Auth0 blocker is local CLI re-login rather than missing client-id discovery.
- Worker dry-run/startup: `npx wrangler deploy --config worker/wrangler.toml --dry-run --outfile output/wrangler/kevinten-api-preview.bundle.mjs` passed with upload size `131.05 KiB` and gzip size `30.12 KiB`; `npx wrangler check startup --workerBundle output/wrangler/kevinten-api-preview.bundle.mjs --outfile output/wrangler/worker-startup.cpuprofile` passed with about `11.85ms` local startup duration. Summary is recorded in `docs/maintenance/2026-06-28-worker-startup.json`.
- Registry DNS: `.com` authoritative servers return `chip.ns.cloudflare.com` and `faye.ns.cloudflare.com` for `kevinten.com`.
- Recursive DNS from the local environment no longer returns GitHub Pages answers in the latest cutover audit, but it also does not yet return usable Cloudflare/Pages answers for the production hosts.
- Preview browser QA: desktop and mobile screenshots saved under `output/playwright/`; mobile horizontal overflow check returned false; console had 0 errors and 0 warnings.

## Completed This Pass

- Added `docs/goals/comprehensive-explore-optimize.md`, which the active goal references.
- Hardened `scripts/verify-cutover-readiness.mjs` so Auth0 CLI hangs become a clear `not ready` result and later readiness checks still run.
- Enhanced `scripts/verify-cutover-readiness.mjs` to report `.com` registry delegation separately from recursive DNS propagation.
- Enhanced `scripts/verify-cutover-readiness.mjs` to reject production HTTP responses that are still served by GitHub Pages instead of Cloudflare Pages.
- Enhanced `scripts/verify-cutover-readiness.mjs` to require active Cloudflare zone status and Cloudflare DNS CNAME records pointing both production hosts at the Pages project through the proxy.
- Enhanced `scripts/verify-cutover-readiness.mjs` so Pages custom-domain API failures are non-fatal and later registry, recursive DNS, production HTTP, and Access diagnostics still run.
- Enhanced `scripts/verify-cutover-readiness.mjs` so curl fallback parsing keeps final response headers, preventing future false negatives when `fetch` fails in proxy or certificate-constrained environments.
- Enhanced `scripts/verify-cutover-readiness.mjs` to verify production `/admin/` protection through unauthenticated HTTP evidence, not only through the Cloudflare Access API.
- Enhanced `scripts/verify-cutover-readiness.mjs` to query Cloudflare authoritative nameservers directly and reject `REFUSED`, GitHub Pages A records, and GitHub Pages CNAMEs before production cutover is considered ready.
- Enhanced `scripts/verify-cutover-readiness.mjs` to fall back to `nslookup` on Windows when `dig` is unavailable for registry and authoritative DNS diagnostics.
- Fixed Windows-safe CLI entrypoint checks in `scripts/verify-cutover-readiness.mjs`, `scripts/verify-reward-qrs.mjs`, and `scripts/stripe-provision.mjs` so direct `npm run ...` commands execute their main routines.
- Hardened Auth0 cutover diagnostics to run app inspection with `--no-input --no-color`, support `AUTH0_CLI_PATH`, and preserve explicit local Auth0 config environment values.
- Upgraded Vitest to `4.1.9`, removing the dev Vite vulnerability chain reported by `npm audit`.
- Enhanced `scripts/verify-cutover-readiness.mjs` to honor the passed `env` object, export structured audit helpers, and write `docs/maintenance/2026-06-28-cutover-readiness.json` when `CUTOVER_AUDIT_OUT` is set.
- Added Worker dry-run/startup evidence in `docs/maintenance/2026-06-28-worker-startup.json` and documented the repeatable dry-run-bundle startup check.
- Enhanced `scripts/verify-preview.mjs` to write `docs/maintenance/2026-06-28-preview-smoke.json` when `PREVIEW_AUDIT_OUT` is set, so preview smoke checks now have machine-readable pass/fail evidence.
- Added `scripts/verify-maintenance-audits.mjs` and `worker/tests/maintenance-audits.test.ts`, then wired `npm run verify` to run `npm run verify:audits` so maintenance JSON evidence is schema-checked and scanned for high-risk credential patterns.
- Added `docs/maintenance/2026-06-28-completion-audit.json` and extended `scripts/verify-maintenance-audits.mjs` to validate completion-audit requirements, status counts, external-blocker classifications, and next actions.
- Updated Cloudflare ops/report docs with current June 28 cutover state and validation blockers.

## External Blockers

- Auth0 verification: committed source no longer contains the real SPA client ID. The preview runtime exposes the public SPA client ID, but the Auth0 CLI refresh token is expired; run `auth0 login` or use machine credentials before relying on automated Auth0 production callback verification.
- WeChat payment QR: `img/weixin.jpg` must be replaced with a real WeChat collect-money QR; do not fake this.
- Cloudflare activation: zone status remains `initializing`; Pages custom domains remain pending until Cloudflare activates the zone and validates HTTP/DNS.
- Cloudflare authoritative DNS: `chip.ns.cloudflare.com` and `faye.ns.cloudflare.com` currently return `NOERROR` with zero answers for `kevinten.com` and `www.kevinten.com`.
- Recursive DNS propagation: local recursive DNS no longer shows GitHub Pages answers in the latest audit, but also does not yet return usable Cloudflare/Pages answers.
- Cloudflare DNS API: active credential cannot read `/zones/:id/dns_records`; use a zone DNS read-scoped API token before relying on automated DNS-record verification.
- Production admin HTTP: `https://kevinten.com/admin/` and `https://www.kevinten.com/admin/` currently fail TLS handshakes before Cloudflare Access markers can be observed.

## Optional Enhancements / Non-Blocking Follow-Up

- Worker compatibility date: `worker/wrangler.toml` still uses `2024-06-20`. Updating it should be handled as a focused compatibility task with full Worker tests and preview verification, not as an incidental DNS cutover change.
- Wrangler startup profiler: `wrangler check startup --config worker/wrangler.toml` did not read the TOML entry point in this local environment; the working repeatable path is `wrangler deploy --dry-run --outfile ...` followed by `wrangler check startup --workerBundle ...`.

## Completion Status

The comprehensive goal is not complete. Local and preview behavior are healthy, but production cutover cannot be considered complete until the blockers above are resolved and `npm run verify:cutover` plus live `kevinten.com` / `www.kevinten.com` HTTP checks pass.
