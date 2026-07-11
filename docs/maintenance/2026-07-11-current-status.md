# Current Production Status - 2026-07-11

## Summary

Cloudflare production cutover is complete and the public site is healthy. Repository cleanup and the Next.js/media workspaces are follow-up source changes; they do not replace the deployed static entry point.

## Deployment Evidence

| Component | Current state |
| --- | --- |
| Production site | `https://kevinten.com/` and `https://www.kevinten.com/` return Cloudflare-served HTTP 200 responses |
| Pages | Latest verified production deployment `005ba2cb-31bc-401e-b818-9d7ffea3f6f7`, source commit `fa866af` |
| Stable Pages origin | `https://kevinten-interactive-preview.pages.dev/` is healthy |
| Worker | Deployment version `2558a175-7a2e-4a95-9766-dcf56174a863`; `/health` returns `success: true` and `status: ok` |
| DNS | Cloudflare nameservers `chip.ns.cloudflare.com` and `faye.ns.cloudflare.com`; apex and `www` resolve through Cloudflare |
| Admin | Production `/admin/` redirects to Cloudflare Access |
| Promo assets | Production MP4, poster, and AnyCap images return HTTP 200 |

The tracked cutover artifact `2026-07-01-cutover-readiness.json` completed at `2026-07-06T16:28:48.281Z` with 24 passed checks, 0 failed checks, and `ready: true`.

## Repository State

- Cloudflare production currently runs source commit `fa866af` from `codex/cloudflare-interactive-preview`.
- `master` remains the GitHub default branch and GitHub Pages rollback source.
- The Next.js application under `next-portfolio/` is a migration candidate, not the production site.
- Curated screenshots live under `docs/maintenance/screenshots/`; generated browser output remains ignored.
- Pages builds publish only the production promo MP4 and poster from `video/`, not the media-production workspace.

## Intentional Limitations

- WeChat rewards remain disabled until a verified collect-money QR is available.
- Alipay is the enabled real QR support method.
- Stripe remains sandbox-only.
- Older June/July continuation reports are retained as historical evidence and must not be interpreted as current blockers.
