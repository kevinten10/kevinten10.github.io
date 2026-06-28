# Cloudflare Preview Ops

This project keeps the existing GitHub Pages production site untouched. Cloudflare resources use preview names only.

Cloudflare Access protects the static `/admin/` shell. Worker `/api/admin/*` routes still require a valid Auth0 bearer token whose verified email maps to `ADMIN_EMAILS`; do not rely on raw `cf-access-authenticated-user-email` headers for API authorization.

## Local Setup

```powershell
npm install
npm run verify
```

`npm run verify` runs TypeScript checks, Worker tests, Pages preview build, and `npm run verify:audits` for maintenance JSON integrity. The tracked maintenance JSON artifacts cover preview smoke, cutover readiness, Worker startup, and the current completion audit.

Create `.dev.vars` for local Worker development:

```dotenv
AUTH0_DOMAIN=
AUTH0_AUDIENCE=https://kevinten-preview/api
ADMIN_EMAILS=wshten@gmail.com
STRIPE_WEBHOOK_SECRET=whsec_test
SITE_ORIGIN=http://localhost:8788
ALLOWED_ORIGINS=https://kevinten-interactive-preview.pages.dev,https://kevinten.com,https://www.kevinten.com
```

## Cloudflare Automation

```powershell
npm run provision:cloudflare
```

If `wrangler` is not logged in:

```powershell
npx wrangler login
npm run provision:cloudflare
```

After D1/KV/Queue creation, copy generated IDs and queue names into `worker/wrangler.toml`.

Cloudflare Access admin protection requires an API token with Access application/policy write permissions or Zero Trust edit permissions. The current Wrangler CLI can deploy Workers/Pages resources but does not expose an Access application creation command.

Provision Cloudflare Access for the preview admin path when a suitably scoped API token is available. The script now has project defaults for account ID, preview admin domain, path, app name, policy name, and admin email, so only the API credential is required in the normal case:

```powershell
$env:CLOUDFLARE_API_TOKEN="token-with-access-apps-policies-write"
npm run provision:access
```

Alternative legacy credential form:

```powershell
$env:CF_API_EMAIL="wshten@gmail.com"
$env:CF_API_KEY="global-api-key"
npm run provision:access
```

If neither form is set, the script tries the local Wrangler OAuth token as a best-effort fallback. In the current local environment Cloudflare returns `Authentication error` for Access API calls with that token, so an Access-scoped API token is still needed for unattended Access provisioning.

If Cloudflare returns `access.api.error.not_enabled`, the API credential is valid but the account has not activated Cloudflare Access / Zero Trust yet. The Zero Trust Free checkout may still ask the account owner to authorize charges for usage that exceeds free limits; confirm that billing risk explicitly before clicking `Activate`, then rerun:

```powershell
$env:CLOUDFLARE_API_TOKEN=[Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN","User")
npm run provision:access
```

Apply D1 schema:

```powershell
npx wrangler d1 migrations apply kevinten_site_preview --config worker/wrangler.toml --remote
```

Deploy Worker:

```powershell
npm run deploy:worker
```

Optional local deploy/startup validation before deploying:

```powershell
npx wrangler deploy --config worker/wrangler.toml --dry-run --outfile output/wrangler/kevinten-api-preview.bundle.mjs
npx wrangler check startup --workerBundle output/wrangler/kevinten-api-preview.bundle.mjs --outfile output/wrangler/worker-startup.cpuprofile
```

`wrangler check startup` is currently an alpha command. In this local environment, `wrangler check startup --config worker/wrangler.toml` did not read the TOML entry point, so use the dry-run bundle path above. Treat `compatibility_date` updates as an explicit runtime-compatibility task; do not change it as part of DNS cutover.

Check public site config after deploy:

```powershell
curl.exe https://kevinten-api-preview.wshten.workers.dev/api/config
```

Deploy Pages preview:

```powershell
npm run deploy:pages
```

`scripts/prepare-pages-preview.mjs` includes public preview defaults for the Worker URL and can read non-secret Auth0 runtime values from environment variables or `dist/auth0-preview.env`. Run `npm run provision:auth0` or set `AUTH0_CLIENT_ID` before deploying when visitor login must be active. Override `API_BASE_URL`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE`, `AUTH0_CALLBACK_URL`, `AUTH0_LOGOUT_URL`, and `AUTH0_ALLOWED_ORIGINS` when deploying a different environment.

The runtime config is intentionally loaded as `/assets/js/cloudflare-runtime.js?v=2` and bypasses Service Worker caching because it differs between preview and future production deployments. The generated runtime can switch Auth0 callback/logout URLs by current origin when `AUTH0_ALLOWED_ORIGINS` includes both preview and production domains.

Verify the deployed preview:

```powershell
$env:PAGES_URL="https://<deployment-id>.kevinten-interactive-preview.pages.dev"
$env:PREVIEW_AUDIT_OUT="docs/maintenance/2026-06-28-preview-smoke.json"
npm run verify:preview
```

`npm run verify:preview` is a smoke test and intentionally writes preview-only page views, comments, reactions, and reward records. Set `PREVIEW_AUDIT_OUT` to also save a structured JSON snapshot with the smoke page, checked URLs, pass/fail counts, and Auth0 runtime-script presence.

## Auth0 Automation

```powershell
$env:AUTH0_DOMAIN="your-tenant.auth0.com"
$env:AUTH0_CLIENT_ID="your-machine-client-id"
$env:AUTH0_CLIENT_SECRET="your-machine-client-secret"
npm run provision:auth0
```

`npm run provision:auth0` will use `AUTH0_CLI` when set, then the known local Windows install path, then `auth0` from `PATH`. When all three machine credentials above are present, it performs `auth0 login --domain ... --client-id ... --client-secret ...` before provisioning. Without an existing Auth0 CLI login or machine credentials, the command exits non-zero and reports the missing Auth0 CLI config.

After a successful Auth0 provisioning run, the script writes non-secret runtime values to `dist/auth0-preview.env`:

```dotenv
AUTH0_DOMAIN=...
AUTH0_CLIENT_ID=...
AUTH0_AUDIENCE=https://kevinten-preview/api
AUTH0_CALLBACK_URL=https://kevinten-interactive-preview.pages.dev/
AUTH0_LOGOUT_URL=https://kevinten-interactive-preview.pages.dev/
AUTH0_ALLOWED_ORIGIN=https://kevinten-interactive-preview.pages.dev
AUTH0_ALLOWED_ORIGINS=https://kevinten-interactive-preview.pages.dev,https://kevinten.com,https://www.kevinten.com
```

Use those values when rebuilding/deploying the Pages preview so `/assets/js/cloudflare-runtime.js` contains the visitor login configuration.

## Stripe Sandbox Automation

Stripe is intentionally kept in sandbox/test mode for this mainland personal setup. Real support payments use WeChat and Alipay QR codes. Do not configure live Stripe mode unless the site later moves to a verified supported-country business entity and this project is deliberately re-scoped.

Preview/sandbox configuration:

```powershell
stripe login
$env:WORKER_API_URL="https://kevinten-api-preview.wshten.workers.dev"
$env:STRIPE_WEBHOOK_SECRET_OUT="$env:TEMP\stripe-preview-webhook-secret.txt"
npm run provision:stripe
```

Store the generated Stripe webhook secret as a Worker secret, then delete the temporary secret file:

```powershell
npx wrangler secret put STRIPE_WEBHOOK_SECRET --config worker/wrangler.toml < $env:TEMP\stripe-preview-webhook-secret.txt
Remove-Item $env:TEMP\stripe-preview-webhook-secret.txt
```

`npm run provision:stripe` rejects `STRIPE_MODE=live`. The Worker also rejects signed Stripe events with `livemode: true`, so accidental live webhook delivery cannot mark rewards verified.

## Reward QR Verification

Real support payments use static QR images in:

- `img/weixin.jpg`
- `img/alipay.jpg`

Run the QR gate before cutover:

```powershell
npm run verify:qrs
```

As of June 28, 2026, `img/weixin.jpg` decodes to a `u.wechat.com` contact/follow URL, not a WeChat collect-money QR. Replace it with a QR saved from WeChat > Services > Money > Receive Money before production cutover. `img/alipay.jpg` decodes as `https://qr.alipay.com/...`; still scan it once on a phone to confirm it opens the Alipay collect-money flow.

## Production Cutover

Do not change DNS for `kevinten.com` again unless current evidence proves the existing Cloudflare delegation is wrong and the owner confirms the change. Current production-ready preparation:

- Worker CORS should include `https://kevinten.com` and `https://www.kevinten.com` in `ALLOWED_ORIGINS`.
- Auth0 callback/logout/origin lists should include `https://kevinten.com/`, `https://www.kevinten.com/`, and the preview Pages origin.
- Pages runtime should be deployed with `AUTH0_ALLOWED_ORIGINS` containing preview plus production origins so login works before and after the domain is bound.
- Real support payments stay on WeChat/Alipay QR codes. Stripe remains sandbox-only.

Final cutover steps:

```powershell
npm run verify
npm run verify:qrs
npm run provision:cutover
$env:PAGES_URL="https://kevinten-interactive-preview.pages.dev"
npm run verify:preview
npm run verify:cutover
```

`npm run provision:cutover` ensures the two Pages custom domains exist, ensures the `kevinten.com` Cloudflare zone exists, and tries to create Cloudflare Access applications for `kevinten.com/admin/*` and `www.kevinten.com/admin/*`. It needs a Cloudflare API token with Pages custom domain, zone create/edit, and Access/Zero Trust application/policy write permissions. The local Wrangler OAuth token can deploy Workers and Pages, but currently cannot read Cloudflare Access apps through the public API.

Then wait for `kevinten.com` and `www.kevinten.com` certificates to become active before treating production as cut over. As of June 28, 2026, the `kevinten.com` Cloudflare zone exists as `014623dcba379877a65c37c5b823cd40`, and the registrar nameservers have been changed in Aliyun from `dns13.hichina.com` / `dns14.hichina.com` to:

- `chip.ns.cloudflare.com`
- `faye.ns.cloudflare.com`

The `.com` registry authoritative servers already return the Cloudflare nameservers, but common recursive resolvers may continue returning the old HiChina nameservers until cache expiry. Cloudflare still reports the zone as `initializing` until its activation check completes. During that window, Cloudflare authoritative nameservers can return `REFUSED`; do not change DNS records again just to fix that state.

Current Pages custom domain records have been created:

- `kevinten.com`: `4c680f65-e787-4e95-8d0e-652503e508e3`
- `www.kevinten.com`: `03769c45-9203-4357-9596-b0ff6d8b25f9`

They remain `pending` until Cloudflare activates the zone and validates the Pages custom domains.

Current Cloudflare DNS records in the `kevinten.com` zone:

- `kevinten.com` `CNAME` -> `kevinten-interactive-preview.pages.dev`, proxied
- `www.kevinten.com` `CNAME` -> `kevinten-interactive-preview.pages.dev`, proxied

These records were created through Cloudflare Dashboard/API earlier in the cutover work. The current automation credential can list the zone but cannot read `/zones/:id/dns_records`, so `npm run verify:cutover` will keep reporting Cloudflare zone/DNS as not ready until a token with zone DNS read permission is available.

Production Cloudflare Access apps have also been created for:

- `kevinten.com/admin/*`
- `www.kevinten.com/admin/*`

Do not only add a manual CNAME to `<project>.pages.dev` without first adding the domain under Pages > Custom domains; Cloudflare documents that this can fail to resolve correctly. After DNS propagation:

```powershell
$env:PAGES_URL="https://kevinten.com"
npm run verify:preview
npm run verify:cutover
curl.exe -I https://kevinten.com/
curl.exe -I https://www.kevinten.com/
```

`npm run verify:cutover` checks Worker CORS, Pages runtime, Auth0 callbacks, reward QR codes, Pages custom domains, active Cloudflare zone status, Cloudflare DNS records for the apex and `www` CNAMEs, registry delegation, direct Cloudflare authoritative DNS answers from `chip.ns.cloudflare.com` and `faye.ns.cloudflare.com`, recursive DNS, production HTTP responses for the apex and `www` domains, unauthenticated production `/admin/` HTTP protection, and Access API protection for production admin paths. Cloudflare API read failures are reported as `not ready` without intentionally stopping later independent checks. The authoritative DNS gate expects `NOERROR` with a non-GitHub answer; `REFUSED` or `NOERROR` with zero answers means Cloudflare is not yet serving usable production records. The production HTTP gate expects Cloudflare response evidence and the generated runtime marker; a GitHub Pages response or TLS handshake failure is still treated as not ready. The admin HTTP gate expects a Cloudflare Access login/challenge marker and Cloudflare response evidence; a GitHub 404/admin shell or TLS failure is not sufficient. If Node `fetch` fails, the script falls back to `curl` and parses final response headers after redirects before evaluating `server`, `cf-ray`, and GitHub headers. If `dig` is unavailable on Windows, the script falls back to `nslookup` for registry and authoritative DNS diagnostics. Set `AUTH0_CLI_TIMEOUT_MS` when diagnosing a slow or stuck Auth0 CLI; the script reports Auth0 as `not ready` after the timeout instead of hanging. Set `CUTOVER_AUDIT_OUT=docs/maintenance/2026-06-28-cutover-readiness.json` to save the same checks as structured JSON with pass/fail counts.

As of June 28, 2026, the check is expected to remain `not ready` until `AUTH0_CLIENT_ID` is supplied locally and Auth0 CLI access is refreshed. A no-file diagnostic run using the public preview runtime client ID reached the Auth0 CLI but reported `Config.json file is missing`; restore Auth0 CLI login/config before relying on automated Auth0 production callback checks. The WeChat QR image must be replaced with a real collect-money QR, Cloudflare must activate the zone and Pages custom domains, Cloudflare authoritative nameservers must return usable records for both production hosts, the active Cloudflare credential must read zone DNS records, recursive DNS must return Cloudflare/Pages answers, production HTTP for `kevinten.com` and `www.kevinten.com` must be served by Cloudflare Pages, and production `/admin/` must show Cloudflare Access protection.

Keep GitHub Pages and the repository `CNAME` intact until rollback has been verified. Add live Stripe only after a supported-country business entity and Stripe KYC are complete.
