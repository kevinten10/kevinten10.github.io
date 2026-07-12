# Current Production Status - 2026-07-11

Last verified: 2026-07-12.

## Summary

Cloudflare production cutover is complete, the optimized source has been merged to `master`, and the public site is healthy. The Next.js/media workspaces remain source-only candidates; they do not replace the deployed static entry point.

## Deployment Evidence

| Component | Current state |
| --- | --- |
| Production site | `https://kevinten.com/` and `https://www.kevinten.com/` return Cloudflare-served HTTP 200 responses |
| Pages | Production deployment `38ef7718-e6f9-4db5-9da6-208523ff5769`, source commit `6fd29bb` |
| Stable Pages origin | `https://kevinten-interactive-preview.pages.dev/` is healthy |
| Worker | Deployment version `06d6309c-ef74-4967-a427-b9a7e8a11ec8`; `/health` returns `success: true` and `status: ok` |
| DNS | Cloudflare nameservers `chip.ns.cloudflare.com` and `faye.ns.cloudflare.com`; apex and `www` resolve through Cloudflare |
| Admin | Production `/admin/` redirects to Cloudflare Access |
| Promo assets | Production MP4, poster, and AnyCap images return HTTP 200 |

The tracked cutover artifact `2026-07-01-cutover-readiness.json` completed at `2026-07-06T16:28:48.281Z` with 24 passed checks, 0 failed checks, and `ready: true`.

The 2026-07-11 release canary completed with:

- PR #1 merged the Cloudflare production architecture; PR #6 added an Auth0 runtime deployment guard.
- 22 test files and 123 tests passed, together with Pages build, audit validation, Next.js lint/build, and video script checks.
- Production smoke verification passed 15 of 15 API and site checks.
- Desktop and mobile browser checks found no horizontal overflow and no console errors; measured page load was about 7.0 seconds.
- Public Auth0 authorize/logout checks, authoritative DNS, production HTTP, and Access redirects passed.

The 2026-07-12 dependency maintenance pass upgraded the undeployed Next.js candidate to Next.js 16.2.10, applied the patched PostCSS release, and refreshed vulnerable transitive packages in the Next.js and video workspaces. Official npm registry audits now report 0 vulnerabilities in all three workspaces, and the full repository verification still passes.

## Repository State

- Cloudflare Pages currently runs `master` source commit `6fd29bb`; the production branch name in Cloudflare remains the historical `preview`.
- `master` is the GitHub default branch and GitHub Pages rollback source.
- The Next.js application under `next-portfolio/` is a migration candidate, not the production site.
- Curated screenshots live under `docs/maintenance/screenshots/`; generated browser output remains ignored.
- Pages builds publish only the production promo MP4 and poster from `video/`, not the media-production workspace.
- Production Pages builds now fail before upload when the public Auth0 client ID is missing.

## Intentional Limitations

- WeChat rewards remain disabled until a verified collect-money QR is available.
- Alipay is the enabled real QR support method.
- Stripe remains sandbox-only.
- The current Wrangler OAuth token cannot read Cloudflare DNS or Access APIs, although authoritative DNS, production HTTP, and Access redirect checks pass. Use a read-scoped API token when refreshing those two API-level audit checks.
- Official npm registry audits report 0 vulnerabilities in the production root, undeployed Next.js candidate, and local video toolchain workspaces.
- Older June/July continuation reports are retained as historical evidence and must not be interpreted as current blockers.
