# Cloudflare Interactive Preview Design

## Objective

Build a Cloudflare-hosted preview of the personal site interactive system without changing the existing GitHub Pages production site or the `kevinten.com` domain.

## Architecture

- Frontend: Cloudflare Pages preview project.
- Backend: Cloudflare Workers with Hono and TypeScript.
- Database: Cloudflare D1.
- Object storage: Cloudflare R2.
- Cache and rate limiting: Cloudflare KV.
- Async jobs: Cloudflare Queues.
- Admin page protection: Cloudflare Access plus Worker-side admin authorization.
- Visitor login: Auth0, with anonymous fallback for low-friction commenting.
- Payments: Stripe webhook to Worker, persisted in D1.

## Safety

The implementation must not modify `CNAME`, GitHub Pages settings, or the production domain. Preview deployments use names such as `kevinten-interactive-preview`, `kevinten-api-preview`, `kevinten_site_preview`, `kevinten-site-preview-assets`, and `kevinten-site-preview-events`.

## Data Model

D1 stores users, visitor profiles, comments, reactions, rewards, page views, daily stats, page stats, and admin audit events. Raw page views are short-term operational data; long-term public counters come from aggregate tables and KV cache.

## Automation

Wrangler creates Cloudflare resources and deploys preview Worker/Pages. Auth0 CLI creates the SPA app and API resource. Stripe CLI creates or tests webhook wiring where authentication allows it. If CLI login blocks automation, continue local implementation and document exact recovery commands.
