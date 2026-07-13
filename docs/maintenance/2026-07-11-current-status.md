# Current Production Status - 2026-07-11

Last verified: 2026-07-13.

## Summary

Cloudflare production cutover is complete and the public site is healthy. The latest UI release removed the redundant standalone media showcase while retaining the promo video and project artwork. A bilingual site guide now combines curated site knowledge with Workers AI and a safe fallback. The Next.js and video-production workspaces remain source-only candidates; they do not replace the deployed static entry point.

## Deployment Evidence

| Component | Current state |
| --- | --- |
| Production site | `https://kevinten.com/` and `https://www.kevinten.com/` return Cloudflare-served HTTP 200 responses |
| Pages | Production branch `preview`; latest deployment is verified with Wrangler plus stable/custom-domain smoke checks |
| Stable Pages origin | `https://kevinten-interactive-preview.pages.dev/` is healthy |
| Worker | `/health` is healthy; `/api/assistant` returns verified site knowledge and live Workers AI answers |
| DNS | Cloudflare nameservers `chip.ns.cloudflare.com` and `faye.ns.cloudflare.com`; apex and `www` resolve through Cloudflare |
| Admin | Production `/admin/` redirects to Cloudflare Access |
| Promo assets | Production MP4, poster, and retained OpenOctopus artwork return HTTP 200 |

The tracked cutover artifact `2026-07-01-cutover-readiness.json` completed at `2026-07-06T16:28:48.281Z` with 24 passed checks, 0 failed checks, and `ready: true`.

The latest completion audit includes:

- PR #1 merged the Cloudflare production architecture; PR #6 added an Auth0 runtime deployment guard.
- 23 test files and all 133 tests passed, together with Pages build, audit validation, Next.js lint/build, and video script checks.
- Production smoke verification passes 15 standard API and site checks; `VERIFY_ASSISTANT_AI=1` adds a 16th live inference check.
- Desktop and mobile browser checks found no horizontal overflow and no console errors; the promo-video modal opens the expected production MP4.
- Public Auth0 authorize/logout checks, authoritative DNS, production HTTP, and Access redirects passed.
- `npm run verify:cutover` now discovers the public Auth0 client ID from the deployed runtime, so production verification no longer requires a manual environment export.

The 2026-07-12 dependency maintenance pass upgraded the undeployed Next.js candidate to Next.js 16.2.10, applied the patched PostCSS release, and refreshed vulnerable transitive packages in the Next.js and video workspaces. Official npm registry audits now report 0 vulnerabilities in all three workspaces, and the full repository verification still passes.

## Repository State

- Cloudflare Pages production is deployed from the current release; the production branch name in Cloudflare remains the historical `preview`.
- `master` is the GitHub default branch and GitHub Pages rollback source.
- The Next.js application under `next-portfolio/` is a migration candidate, not the production site.
- Curated screenshots live under `docs/maintenance/screenshots/`; generated browser output remains ignored.
- Pages builds publish only the production promo MP4 and poster from `video/`, not the media-production workspace.
- Production Pages builds now fail before upload when the public Auth0 client ID is missing.

## Intentional Limitations

- WeChat rewards remain disabled until a verified collect-money QR is available.
- Alipay is the enabled real QR support method.
- Stripe remains sandbox-only.
- The current Cloudflare token reads Pages, DNS, zone, and Access state, but Worker deployment-version listing requires an additional Workers read permission.
- The Auth0 CLI is not currently logged in; public authorize/logout verification passes and is sufficient for read-only cutover checks. Log in only before mutating Auth0 configuration.
- Official npm registry audits report 0 vulnerabilities in the production root, undeployed Next.js candidate, and local video toolchain workspaces.
- Older June/July continuation reports are retained as historical evidence and must not be interpreted as current blockers.
