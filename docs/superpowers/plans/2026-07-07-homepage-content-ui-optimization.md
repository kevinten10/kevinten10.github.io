# Homepage Content UI Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the homepage content hierarchy, visual rhythm, navigation behavior, and mobile ergonomics while preserving the existing static-site architecture and Cloudflare preview deployment path.

**Architecture:** Keep the existing vanilla HTML/CSS/JS structure. Add static tests that guard the intended IA and style changes, then update `index.html`, `assets/css/main.css`, `assets/js/app.js`, and cache versions in `sw.js`.

**Tech Stack:** Static HTML, CSS custom properties, vanilla ES6 IIFE modules, Vitest static guards, Cloudflare Pages preview.

---

## File Map

- Modify `worker/tests/frontend-security.test.ts`: add/adjust static guards for support/comment nav exposure, scroll-margin styles, active nav helper behavior, and cache-busted assets.
- Modify `index.html`: expose support and comments from navigation/footer journey, tighten hero metadata/copy density, and add semantic hooks for optimized layout.
- Modify `assets/css/main.css`: refine section rhythm, contrast, mobile hero density, card/radius/elevation discipline, and scroll-margin behavior.
- Modify `assets/js/app.js`: improve smooth-scroll offsets and active nav calculation for long pages with unlinked intermediate sections.
- Modify `sw.js`: bump service worker version and updated cache-busted resource URLs.
- Keep `docs/design-audit/2026-07-07-page-optimization/*`: current-state screenshot evidence and audit notes.

## Task 1: Static Guards For IA And Scroll Behavior

**Files:**
- Modify: `worker/tests/frontend-security.test.ts`

- [ ] Step 1: Add a failing test that expects optimized homepage hooks.

Expected assertions:
- `index.html` contains nav links to `#rewards` and `#comments`.
- `index.html` contains a `data-hero-density="editorial"` marker.
- `assets/css/main.css` contains `scroll-margin-top`.
- `assets/css/main.css` contains `.hero-compact-actions`.
- `assets/js/app.js` contains `findActiveSection`.
- `sw.js` contains `const SW_VERSION = '47'`.

- [ ] Step 2: Run the focused test.

Run: `npx vitest run worker/tests/frontend-security.test.ts`
Expected: FAIL because the optimized hooks are not implemented yet.

## Task 2: Content And Navigation IA

**Files:**
- Modify: `index.html`

- [ ] Step 1: Add support/discuss links to desktop and mobile navigation.
- [ ] Step 2: Mark the hero container with `data-hero-density="editorial"`.
- [ ] Step 3: Group secondary hero actions in `.hero-compact-actions`.
- [ ] Step 4: Add a compact support/discuss action row near contact so the tail features are discoverable before the page end.

## Task 3: Visual Rhythm And Mobile Polish

**Files:**
- Modify: `assets/css/main.css`

- [ ] Step 1: Add section `scroll-margin-top` so hash navigation lands cleanly below the fixed header.
- [ ] Step 2: Reduce over-dark transitional states by raising section-header contrast and stabilizing reveal opacity for headings.
- [ ] Step 3: Add mobile hero density rules for `data-hero-density="editorial"`.
- [ ] Step 4: Add `.hero-compact-actions` styles so secondary actions sit as deliberate compact controls on desktop and stack cleanly on mobile.
- [ ] Step 5: Tighten card radii/elevation for a more mature product/editorial feel without breaking existing assets.

## Task 4: Active Navigation Behavior

**Files:**
- Modify: `assets/js/app.js`

- [ ] Step 1: Extract `findActiveSection(sections, scrollY, headerOffset)` inside `initSmoothScroll`.
- [ ] Step 2: Choose the active section by the nearest section top crossing rather than independent per-link range checks.
- [ ] Step 3: Keep unlinked sections from clearing the active state; use the nearest previous linked section.
- [ ] Step 4: Call `updateActiveNav()` once after binding so the initial state is correct.

## Task 5: Cache And Verification

**Files:**
- Modify: `index.html`
- Modify: `sw.js`

- [ ] Step 1: Bump `assets/css/main.css` cache query to the next version.
- [ ] Step 2: Bump `assets/js/app.js` cache query if app.js changes.
- [ ] Step 3: Bump `SW_VERSION` and matching precache entries.
- [ ] Step 4: Run `npx vitest run worker/tests/frontend-security.test.ts`.
- [ ] Step 5: Run `npm run verify`.
- [ ] Step 6: Capture desktop/mobile screenshots and inspect with `view_image`.
- [ ] Step 7: Deploy Cloudflare Pages preview.
- [ ] Step 8: Stage only intended files, commit, and push the preview branch.

## Self-Review

- Spec coverage: content hierarchy, visual rhythm, mobile ergonomics, navigation behavior, and verification are covered.
- Placeholder scan: no TODO/TBD placeholders.
- Type consistency: names `findActiveSection`, `hero-compact-actions`, and `data-hero-density` are consistent across tasks.
