# Comprehensive Explore And Optimize Goal

## Outcome

全面探索、优化、验证并记录 `/Users/kevinten/projects/agents/projects/websites/kevin/kevinten10.github.io` 当前站点和 Cloudflare 新架构，使项目达到可交付状态：本地代码健康、主要用户路径可用、Cloudflare preview/production cutover 状态清楚、未完成事项有明确外部 blocker 和下一步动作。

## Context

Workdir: `/Users/kevinten/projects/agents/projects/websites/kevin/kevinten10.github.io`

Branch: `codex/cloudflare-interactive-preview`

Must read before continuing after any resume:

1. Repo instructions: `AGENTS.md` when present, otherwise `CLAUDE.md`, then `README.md`.
2. `git status --short --branch`.
3. `docs/cloudflare-preview-ops.md`.
4. `docs/cloudflare-preview-report.md`.
5. `package.json`.
6. `scripts/verify-preview.mjs`.
7. `scripts/verify-cutover-readiness.mjs`.
8. Current diff for touched files: `git diff --stat` and targeted `git diff`.

Important live surfaces:

- Preview site: `https://kevinten-interactive-preview.pages.dev`
- Worker API: `https://kevinten-api-preview.wshten.workers.dev`
- Production domains: `https://kevinten.com`, `https://www.kevinten.com`
- Cloudflare zone: `kevinten.com`
- Registrar: Aliyun/HiChina

## Constraints

- Protect dirty worktrees. Never revert user changes unless explicitly requested.
- Stage/commit only files related to this goal if commits are requested.
- Never print, commit, summarize, or expose secrets, cookies, QR login codes, API tokens, `.env` values, webhook secrets, or private credential files.
- Prefer existing project patterns: vanilla HTML/CSS/JS frontend, Worker scripts, current npm scripts, existing docs.
- Do not enable Stripe live mode. Stripe remains sandbox unless the user explicitly changes business/entity scope.
- Do not perform paid operations, irreversible DNS changes, destructive database changes, or broad rewrites without explicit confirmation.
- Do not change production DNS again unless current evidence shows the existing configuration is objectively wrong and the user confirms.
- Treat Cloudflare `initializing`, DNS cache delay, payment KYC, SMS/MFA, platform auth, and unavailable provider permissions as external blockers when proven.

## Milestones

1. Inventory current state: repo branch, dirty files, deployed URLs, Cloudflare zone/domain status, DNS status, Auth0/Stripe/QR status, and current docs.
2. Code and UX optimization: review landing page, login, comments, rewards, admin shell, stats, responsive layout, accessibility, performance, and security; make narrowly scoped improvements aligned with existing design and architecture.
3. Backend and integration hardening: verify Worker health, CORS, auth protection, comments, rewards, stats, Stripe sandbox rejection rules, and admin authorization.
4. Deployment and domain readiness: verify Pages preview, Worker deploy state, Cloudflare custom domains, registrar NS, Cloudflare zone activation, Access protection, and production readiness.
5. Documentation and completion audit: update docs with current truth, validation evidence, unresolved blockers, and next actions.

## Per-Item Loop

For each area or issue:

1. Inventory: identify files, routes, scripts, live URL, current behavior, and expected behavior.
2. Read targeted code/docs before editing.
3. Implement the smallest complete improvement.
4. Run the narrowest meaningful validation first.
5. Broaden validation if shared behavior, deployment, auth, payments, DNS, or user-facing UI is affected.
6. For frontend changes, run browser verification on desktop and mobile sizes; inspect screenshots/console/network where useful.
7. For live integrations, verify with API/browser/CLI evidence without leaking credentials.
8. Update docs or a ledger when the current operational state changes.
9. Continue to the next item unless a blocker prevents all meaningful progress.

## Verification

Run relevant checks based on changed surface:

```bash
git status --short --branch
npm run verify
npm run verify:preview
npm run verify:qrs
npm run verify:cutover
```

Domain/DNS checks when production cutover is in scope:

```bash
dig @a.gtld-servers.net kevinten.com NS +noall +authority
dig +short kevinten.com NS
dig +short kevinten.com A
dig +short www.kevinten.com CNAME
dig @chip.ns.cloudflare.com kevinten.com A +noall +answer +comments
curl -I -L --max-time 30 https://kevinten-interactive-preview.pages.dev/
curl -sS --max-time 30 https://kevinten-api-preview.wshten.workers.dev/health
curl -I -L --max-time 30 https://kevinten.com/
curl -I -L --max-time 30 https://www.kevinten.com/
```

Browser QA:

- Open preview homepage.
- Check first viewport, navigation, login controls, comments, rewards, stats, admin entry, mobile layout, console errors, and network failures.
- Confirm text does not overlap on mobile/desktop.
- Confirm comments/rewards/stats paths still work after visual changes.

## Done When

The goal may be marked complete only after a completion audit proves all of these are true:

- Current repo state is understood and documented.
- All intentional code/doc changes are scoped and explained.
- `npm run verify` passes, or any failure is documented with root cause and blocker evidence.
- `npm run verify:preview` passes against the active preview URL.
- Main user flows are browser-verified: homepage, login state handling, comments, rewards, public stats, admin protection.
- Cloudflare production cutover status is verified from current evidence:
  - registrar NS,
  - Cloudflare zone status,
  - Pages custom domain status,
  - DNS records,
  - Access admin protection,
  - `kevinten.com` / `www.kevinten.com` HTTP behavior when active.
- Stripe remains sandbox-only unless explicitly re-scoped.
- WeChat/Alipay QR status is verified or recorded as a blocker.
- Docs reflect the current truth.
- All unresolved items are classified as external blocker, optional enhancement, historical note, or non-goal cleanup.
- A final report lists changed files, validation commands, live checks, blockers, and dirty-worktree notes.

## If Blocked

If Cloudflare zone activation, DNS propagation, Auth0 login, Aliyun SMS/MFA, Stripe KYC, provider permissions, or payment QR replacement blocks completion:

1. Record owner/system, timestamp, attempted action, exact current result/error, and next action.
2. Finish all safe local work that does not depend on the blocker.
3. Continue other independent items.
4. Do not mark the whole goal blocked unless no meaningful work remains and the same blocker prevents all progress.
5. Do not mark complete unless the blocker is explicitly acceptable for completion under the goal and documented.

## Completion Audit

Before final answer:

1. Reread this file and current `git status`.
2. Enumerate every requirement from this goal.
3. Attach current evidence for each requirement.
4. Treat stale, indirect, or partial evidence as incomplete.
5. Update `docs/cloudflare-preview-ops.md` and `docs/cloudflare-preview-report.md` if operational state changed.
6. Final response must include completed changes, commands run and results, live URLs checked, unresolved blockers, what was intentionally not changed, and whether production can safely be considered cut over.
