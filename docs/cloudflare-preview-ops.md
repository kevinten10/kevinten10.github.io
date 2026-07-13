# Cloudflare Production Operations

The resource names still contain `preview`, but this stack now serves the production custom domain.

## Current Production State

- Site: `https://kevinten.com/` and `https://www.kevinten.com/`
- Pages project: `kevinten-interactive-preview`
- Stable Pages origin: `https://kevinten-interactive-preview.pages.dev/`
- Worker: `https://kevinten-api-preview.wshten.workers.dev/`
- Admin: `/admin/` is protected by Cloudflare Access; Worker admin APIs also require a valid Auth0 bearer token whose verified email is authorized.
- Rollback: GitHub Pages remains available from the repository `master` branch.

The latest tracked cutover audit completed on 2026-07-06 with 24 of 24 checks passing and `ready: true`. See `docs/maintenance/2026-07-01-cutover-readiness.json` and the current summary in `docs/maintenance/2026-07-11-current-status.md`.

## Local Setup

Use Node.js 20 or newer.

```bash
npm ci
npm run verify
```

Create `.dev.vars` only for local Worker secrets. Use `.env.example` as the variable-name template and never commit real values.

```bash
npm run dev:worker
```

The Pages build uses an explicit production allowlist. It publishes the static site directories plus:

- `video/kevinten-ai-native-promo.mp4`
- `video/kevinten-ai-native-promo-poster.jpg`

It must not recursively publish the video-production workspace, Next.js candidate, maintenance screenshots, local dependencies, or generated output.

## Verification

```bash
# Typecheck, Worker tests, Pages build, and tracked audit validation
npm run verify

# Public preview/production smoke checks; this intentionally writes smoke-test records
PAGES_URL=https://kevinten.com npm run verify:preview

# Add one live Workers AI inference check
VERIFY_ASSISTANT_AI=1 PAGES_URL=https://kevinten.com npm run verify:preview

# DNS, custom domains, Auth0, rewards, production HTTP, and Access readiness
npm run verify:cutover

# Reward QR policy
npm run verify:qrs
```

Set `PREVIEW_AUDIT_OUT` or `CUTOVER_AUDIT_OUT` only when intentionally refreshing tracked audit evidence. Review generated diffs before committing them.

## Deployment

The following commands change external state:

```bash
npm run deploy:worker
npm run deploy:pages
```

Before deployment, confirm Wrangler is authenticated to the intended account and run `npm run verify`. The Pages command builds `dist/pages` and deploys it to the `preview` branch of `kevinten-interactive-preview`; this branch currently backs production.

`npm run deploy:pages` requires a public `AUTH0_CLIENT_ID` from the environment or ignored `dist/auth0-preview.env`. The build fails before upload when it is missing, preventing a deployment that silently breaks visitor login.

Provisioning commands are not routine deploy steps:

```bash
npm run provision:cloudflare
npm run provision:auth0
npm run provision:stripe
npm run provision:access
npm run provision:cutover
```

Run them only when intentionally changing the corresponding provider configuration. Do not store provider credentials or generated webhook secrets in the repository.

## Runtime and Authentication

`scripts/prepare-pages-preview.mjs` generates `assets/js/cloudflare-runtime.js` inside the Pages output. Runtime values may come from environment variables or the ignored `dist/auth0-preview.env` file. The generated file is excluded from service-worker caching so callback and API origins can change safely between hosts.

Production Auth0 callback, logout, and allowed-origin configuration must cover:

- `https://kevinten.com/`
- `https://www.kevinten.com/`
- `https://kevinten-interactive-preview.pages.dev/`

Cloudflare Access protects the static admin shell. Do not treat Access headers alone as Worker API authorization; the API continues to verify Auth0 tokens.

## Site Guide

`POST /api/assistant` answers known project, architecture, writing, and collaboration questions from curated bilingual site knowledge. Other questions use the Worker `AI` binding and `AI_MODEL`; KV limits each visitor session to 12 questions per minute. Inference failures return an honest site-information fallback and never expose provider errors to visitors.

The production model is configured in `worker/wrangler.toml`. Run the opt-in smoke check above after changing the model or AI binding; the standard smoke suite avoids consuming inference on every routine deployment.

## Payments and Rewards

- Alipay is the only enabled real QR support method.
- WeChat remains disabled until a verified collect-money QR replaces the placeholder and `npm run verify:qrs` passes with that method enabled.
- Stripe remains sandbox-only. Do not enable live Stripe without a separately approved business/KYC scope change.

## DNS and Rollback

The authoritative nameservers are `chip.ns.cloudflare.com` and `faye.ns.cloudflare.com`. Apex and `www` route through proxied Cloudflare records to the Pages project.

Do not change registrar nameservers, production DNS, Pages custom domains, or the repository `CNAME` as routine cleanup. If rollback is required, first verify the GitHub Pages build and certificate, then make DNS changes as a dedicated, documented operation.
