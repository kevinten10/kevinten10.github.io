# Vercel + Supabase Interactive Features Design

> Superseded for current implementation: the active target architecture is documented in `docs/superpowers/specs/2026-06-25-cloudflare-interactive-preview-design.md`. Keep this file as historical context only.

## Context

The site is currently a static personal website with no build step. The maintained entry points are `index.html`, `articles.html`, `assets/css/`, and `assets/js/`; historical blog pages under dated folders should remain intact unless a change is intentionally site-wide.

The current homepage already contains Cloudbase-based experiments for comments and analytics:

- `assets/js/comments.js` uses Cloudbase anonymous auth and an `addComment` cloud function.
- `assets/js/analytics.js` sends page views to a `trackView` cloud function.
- `cloudfunctions/` contains the existing Cloudbase functions and can be kept as migration reference during the first Supabase implementation.

The approved direction is to migrate the interactive layer to Vercel + Supabase and host the whole site on Vercel.

## Goals

- Keep the site mostly static and preserve the current no-build authoring model.
- Add lightweight visitor identity for comments and reward messages.
- Add comments with simple automatic moderation.
- Add privacy-conscious analytics with public counters and owner-only detailed views.
- Add recorded rewards with QR codes and a thanks wall.
- Reserve a clean payment-provider model for Stripe first, then WeChat/Alipay merchant payments.
- Add a small owner admin area for moderation and analytics.

## Non-Goals

- Do not turn visitors into full account users.
- Do not build a full CMS.
- Do not add infinite nested comments.
- Do not implement domestic merchant-payment callbacks before credentials and provider requirements are ready.
- Do not expose privileged Supabase service-role operations in browser JavaScript.

## Architecture

The production site moves from GitHub Pages to Vercel. Static pages and assets are served by Vercel, while Vercel Functions under `/api/*` handle writes, validation, moderation, admin actions, and payment webhooks.

Supabase provides Postgres, Auth, Row Level Security, and optional Storage for reward QR images. The browser can read public approved data through public API endpoints or tightly scoped Supabase anon policies. Any action that mutates data or requires secrets goes through Vercel Functions.

Cloudbase code is replaced on the modern homepage by the Supabase/Vercel implementation. The existing `cloudfunctions/` folder can remain temporarily as migration reference and be removed after the new path is verified in production.

## Visitor Identity

Visitors do not create formal accounts. When they first comment or submit a reward message, the UI asks for:

- nickname, required and public
- email, optional and private
- website, optional and public if provided

The frontend stores a generated `visitorId`, nickname, optional website, and local preferences in `localStorage`. Email is never displayed publicly. If stored, it should be stored in a controlled private column and may also be hashed for matching, moderation, and future notification features.

This identity is intentionally lightweight. It is enough to make comments feel personal without adding a registration burden.

## Comments

Comments use a public form on the homepage and can later be reused on article pages. Submission goes to `POST /api/comments`.

The API validates:

- content length
- empty or repeated content
- submit frequency by visitor/session/IP hash
- link count
- blocked words or suspicious patterns
- parent comment validity
- source page path

Normal comments are written with status `approved` and appear immediately. Comments with links, suspicious metadata, blocked words, excessive length, or rapid repeat submissions are written with status `pending`; the user sees a message that the comment was submitted for review.

Public reads return only `approved` comments. Replies are limited to one or two levels in the first version. Admin can mark comments as `approved`, `hidden`, or `spam`.

## Analytics

Analytics are split into public counters and owner-only detail.

Public pages may show:

- total site visits
- current page views
- comment count
- supporter count
- recent approved supporters

Detailed analytics live in `/admin/` and include:

- daily PV and UV
- top pages and articles
- referrer domains
- browser and device family
- comment activity
- reward activity
- pending moderation counts

Tracking uses `POST /api/track`, called once after page load with a small delay. It respects `navigator.doNotTrack` and fails silently. The server records only the fields needed for aggregate insight and abuse prevention: page, referrer, user-agent-derived browser/device, session id, timestamp, and anonymized or hashed IP metadata. Public counters are served from aggregate tables or views, not raw events.

## Rewards

The first version is recorded reward support:

- Show WeChat and Alipay QR codes.
- Let visitors submit nickname, optional amount, optional currency, and optional message.
- Write the entry through `POST /api/rewards`.
- Show approved entries on a public thanks wall.

Recommended default: new manual reward entries use status `pending` and require owner approval before appearing publicly. This prevents spam from reaching the thanks wall.

Reward QR images can initially live in `images/`. If the admin should later replace them without a code change, move them to Supabase Storage.

## Payment Closure

The data model reserves provider-neutral payment fields from the start:

- `provider`
- `provider_order_id`
- `amount`
- `currency`
- `status`
- `verified_at`
- `metadata`

The second phase implements Stripe first:

- `POST /api/rewards/checkout` creates a Stripe Checkout Session.
- `POST /api/webhooks/stripe` verifies the Stripe signature and marks the matching reward as `verified`.
- The public thanks wall can display a verified badge for callback-confirmed payments.

WeChat and Alipay merchant payments are added later as additional providers using the same rewards table and status model. Manual QR submissions should not be labeled as verified payments.

## Admin

Admin lives under `/admin/` as a lightweight static interface. The owner logs in with Supabase email magic link. Vercel admin APIs verify the Supabase JWT and then check the email against `admin_users`.

First-version admin views:

- overview
- pending comments
- pending rewards
- analytics

Admin actions:

- approve, hide, or mark comments as spam
- approve or hide reward entries
- view analytics summaries
- inspect recent moderation events

## Data Model

Recommended tables:

- `visitor_profiles`: visitor id, nickname, private email fields, website, first seen, last seen, status
- `comments`: page path, parent id, visitor id, nickname snapshot, content, status, moderation reason, created and updated timestamps
- `rewards`: visitor id, display name, message, amount, currency, provider, provider order id, status, verified timestamp, metadata
- `page_views`: raw restrained analytics events
- `daily_stats`: daily aggregate counters
- `page_stats`: per-page aggregate counters
- `admin_users`: owner email whitelist and role
- `moderation_events`: audit trail for admin decisions and automatic moderation

RLS should deny privileged writes from anon clients. Public read policies or API responses expose only approved comments, approved or verified rewards, and aggregate counters.

## API Boundaries

Public APIs:

- `GET /api/comments?page=...`
- `POST /api/comments`
- `POST /api/track`
- `GET /api/public-stats?page=...`
- `POST /api/rewards`

Protected APIs:

- `GET /api/admin/summary`
- `GET /api/admin/analytics`
- `PATCH /api/admin/comments/:id`
- `PATCH /api/admin/rewards/:id`
- `POST /api/rewards/checkout`
- `POST /api/webhooks/stripe`

The Stripe webhook is protected by provider signature verification rather than the admin session.

## Frontend Integration

Add maintained frontend modules in `assets/js/` using the existing IIFE style:

- visitor profile helper
- comments client
- analytics tracker
- rewards client
- admin client

Add CSS in `assets/css/` while keeping theme tokens in `assets/css/theme.css` and component/layout rules in the relevant CSS files.

Replace Cloudbase script tags on `index.html` with Vercel/Supabase scripts. Keep legacy root-level `css/` and `js/` untouched unless the feature is explicitly added to historical pages.

## Deployment

Add Vercel configuration for static hosting and API Functions. The custom domain should point to Vercel so the static site and `/api/*` share one origin.

Required environment variables:

- Supabase project URL
- Supabase anon key for public frontend reads if needed
- Supabase service role key for Vercel Functions only
- owner admin email or admin bootstrap secret
- Stripe secret key
- Stripe webhook secret

Secrets must stay in Vercel environment variables and never be committed.

## Verification

Manual verification is required because the repository has no automated test suite.

Minimum checks:

- Homepage loads on desktop and mobile.
- Existing navigation and theme toggle still work.
- Visitor can set nickname and submit a normal comment.
- Suspicious comment enters pending state.
- Admin can log in by magic link and approve a pending comment.
- Analytics sends one event and public counters update.
- Manual reward entry enters pending and can be approved.
- Stripe webhook handler can verify a test event when Stripe phase is enabled.
- No browser console errors on the homepage.
- One representative legacy article still loads after Vercel migration.

Service worker cache versions in `sw.js` must be bumped when cached assets or scripts change.
