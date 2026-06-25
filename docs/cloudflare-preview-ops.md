# Cloudflare Preview Ops

This project keeps the existing GitHub Pages production site untouched. Cloudflare resources use preview names only.

## Local Setup

```powershell
npm install
npm run verify
```

Create `.dev.vars` for local Worker development:

```dotenv
AUTH0_DOMAIN=
AUTH0_AUDIENCE=https://kevinten-preview/api
ADMIN_EMAILS=you@example.com
STRIPE_WEBHOOK_SECRET=whsec_test
SITE_ORIGIN=http://localhost:8788
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

Apply D1 schema:

```powershell
npx wrangler d1 migrations apply kevinten_site_preview --config worker/wrangler.toml --remote
```

Deploy Worker:

```powershell
npm run deploy:worker
```

Deploy Pages preview:

```powershell
$env:API_BASE_URL="https://kevinten-api-preview.<subdomain>.workers.dev"
npm run deploy:pages
```

## Auth0 Automation

```powershell
$env:AUTH0_DOMAIN="your-tenant.auth0.com"
$env:AUTH0_CLIENT_ID="your-machine-client-id"
$env:AUTH0_CLIENT_SECRET="your-machine-client-secret"
auth0 login --domain $env:AUTH0_DOMAIN --client-id $env:AUTH0_CLIENT_ID --client-secret $env:AUTH0_CLIENT_SECRET
npm run provision:auth0
```

Use the generated SPA Client ID and tenant domain as `AUTH0_CLIENT_ID` and `AUTH0_DOMAIN` for the preview runtime config. If machine credentials are not available, `auth0 login` falls back to a browser/device authorization flow.

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
