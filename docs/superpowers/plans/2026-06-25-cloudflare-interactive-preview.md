# Cloudflare Interactive Preview Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans or subagent-driven-development. Track steps with checkboxes and keep the goal active until preview deployment or documented CLI blockers are complete.

**Goal:** Implement and preview-deploy the personal-site interactive system on Cloudflare free-tier services without touching GitHub Pages production.

**Architecture:** Cloudflare Pages serves the static site. A single Hono Worker exposes all `/api/*` routes and uses D1, KV, R2, and Queues. Auth0 provides visitor identity, anonymous fallback remains available, Cloudflare Access protects `/admin`, and Stripe webhooks write verified rewards.

**Tech Stack:** Cloudflare Workers, Hono, TypeScript, D1, KV, R2, Queues, Auth0 CLI, Stripe CLI, Wrangler, vanilla frontend IIFEs.

---

## Tasks

- [x] Create `codex/cloudflare-interactive-preview` branch.
- [x] Add Worker/Hono/TypeScript project files and D1 schema.
- [x] Implement Auth0 JWT verification, KV JWKS cache, user upsert, admin checks.
- [x] Implement comments, replies, reactions, rewards, stats, admin, and Stripe webhook routes.
- [x] Add queue consumer for stats aggregation.
- [x] Replace Cloudbase frontend comments/analytics with Worker-backed modules.
- [x] Add Auth0 login entry, rewards section, public stats, and admin page.
- [x] Add Cloudflare/Auth0/Stripe automation scripts and ops docs.
- [x] Run typecheck/tests/static preview build.
- [x] Attempt Wrangler/Auth0/Stripe CLI provisioning and preview deploys.
- [x] Produce final report with preview URLs or precise blockers.
