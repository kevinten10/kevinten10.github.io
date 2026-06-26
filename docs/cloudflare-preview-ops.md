# Cloudflare Preview Ops

This project keeps the existing GitHub Pages production site untouched. Cloudflare resources use preview names only.

Cloudflare Access protects the static `/admin/` shell. Worker `/api/admin/*` routes still require a valid Auth0 bearer token whose verified email maps to `ADMIN_EMAILS`; do not rely on raw `cf-access-authenticated-user-email` headers for API authorization.

## Local Setup

```powershell
npm install
npm run verify
```

Create `.dev.vars` for local Worker development:

```dotenv
AUTH0_DOMAIN=
AUTH0_AUDIENCE=https://kevinten-preview/api
ADMIN_EMAILS=wshten@gmail.com
STRIPE_WEBHOOK_SECRET=whsec_test
SITE_ORIGIN=http://localhost:8788
ALLOWED_ORIGINS=https://kevinten-interactive-preview.pages.dev
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

Check public site config after deploy:

```powershell
curl.exe https://kevinten-api-preview.wshten.workers.dev/api/config
```

Deploy Pages preview:

```powershell
$env:API_BASE_URL="https://kevinten-api-preview.<subdomain>.workers.dev"
$env:PAGES_URL="https://kevinten-interactive-preview.pages.dev"
$env:AUTH0_DOMAIN="your-tenant.auth0.com"
$env:AUTH0_CLIENT_ID="your-auth0-spa-client-id"
$env:AUTH0_AUDIENCE="https://kevinten-preview/api"
$env:AUTH0_CALLBACK_URL="https://kevinten-interactive-preview.pages.dev/"
$env:AUTH0_LOGOUT_URL="https://kevinten-interactive-preview.pages.dev/"
npm run deploy:pages
```

`npm run verify` rebuilds `dist/pages` with safe blank defaults for local/static hosting. Always set the preview runtime environment variables again before `npm run deploy:pages`.

The runtime config is intentionally loaded as `/assets/js/cloudflare-runtime.js?v=2` and bypasses Service Worker caching because it differs between preview and future production deployments.

Verify the deployed preview:

```powershell
$env:PAGES_URL="https://<deployment-id>.kevinten-interactive-preview.pages.dev"
npm run verify:preview
```

`npm run verify:preview` is a smoke test and intentionally writes preview-only page views, comments, reactions, and reward records.

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
```

Use those values when rebuilding/deploying the Pages preview so `/assets/js/cloudflare-runtime.js` contains the visitor login configuration.

## Stripe Automation

```powershell
stripe login
$env:WORKER_API_URL="https://kevinten-api-preview.<subdomain>.workers.dev"
npm run provision:stripe
```

Store the Stripe webhook secret as a Worker secret:

```powershell
npx wrangler secret put STRIPE_WEBHOOK_SECRET --config worker/wrangler.toml
```

## Production Cutover

Do not change `CNAME` or `kevinten.com` until the preview is verified. When ready, create a production Cloudflare Pages project or promote the preview project, bind the custom domain, then update DNS deliberately.

Before production cutover, set `ALLOWED_ORIGINS=https://kevinten.com,https://www.kevinten.com`, update Auth0 callback/logout/origin URLs for the production domain, and re-run the full local plus remote verification suite.
