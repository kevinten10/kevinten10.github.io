# Portfolio Site Comprehensive Optimization Design

**Date:** 2026-03-12
**Status:** Approved

## Overview

Comprehensive optimization of the KevinTen portfolio site across 4 directions: account matrix fix, Impact section expansion, AI-generated project illustrations, and style refinements.

## 1. Account Matrix Redesign

**Problem:** 4-column grid (`repeat(4, 1fr)`) in bento card causes the 4th item (小红书) to compress to 58px. 7 items create asymmetric 4+3 layout. Missing GitHub and X/Twitter which exist in header/contact but not in matrix.

**Solution:**
- Change grid from `repeat(4, 1fr)` to `repeat(3, 1fr)` on desktop
- Add GitHub and X/Twitter accounts to the matrix (9 total)
- Result: 3x3 perfect grid layout
- Account order: GitHub, X, LinkedIn, 知乎, CSDN, 小红书, 抖音, TikTok, 微信
- Mobile (<640px): keep 3 columns

**Files:** `index.html` (add 2 account cards), `main.css` (change grid-template-columns)

## 2. Impact Section Expansion (6 → 9 metrics)

**Problem:** Current 6 metrics don't cover achievements spread across Awards, Open Source, and community sections.

**Solution:** Add 3 new metrics extracted from existing site content:

| New Metric | Value | Source |
|-----------|-------|--------|
| Hackathon 奖项 | 4+ | Awards section: 金奖 + 亚军 + 铜奖 + 入围奖 |
| 开源项目 | 10+ | Contributions section: personal + community projects |
| 技术 Meetup | 20+ | Awards section summary stats |

Layout changes from auto-fit to explicit 3-column grid on desktop, 2-column on mobile.

New metrics use `animate-number` with same IntersectionObserver pattern.

**Files:** `index.html` (add 3 metric cards), `main.css` (adjust grid if needed)

## 3. AI-Generated Project Illustrations

**Problem:** Project cards use emoji placeholders, lacking visual appeal.

**Solution:** Use Image MCP to generate concept illustrations for 4 core projects:

| Project | Concept | Style |
|---------|---------|-------|
| Capa | Multi-cloud runtime abstraction layer | Futuristic tech, blue/purple gradients, dark bg |
| OpenOctopus | AI agent hub with octopus connecting life domains | Neural network glow, green/cyan |
| Trip Agent | AI travel planning with world map routes | Map with glowing paths, warm tones |
| AI Tools | Developer tools matrix dashboard | Floating IDE windows, purple/pink |

Images: 400x240px, PNG format, saved to `/images/projects/`.

**Files:** `index.html` (update img src), new image files

## 4. Style Optimizations

### 4a. Impact Card Icon Upgrade
- Replace plain emoji with emoji inside colored gradient circle backgrounds
- Color coding: blue (core metrics), green (AI metrics), gold (achievement metrics)

### 4b. Bento Card Spacing
- Unify bento-item padding and gap
- Ensure account matrix and bio card height alignment

### 4c. Project Card Hover Enhancement
- Add glow border effect on hover (subtle box-shadow with primary color)
- Icon float animation on hover

### 4d. Light Theme Enhancement
- Add box-shadow to Impact cards and bento cards in light mode
- Increase border contrast for better card definition

### 4e. Mobile Responsive
- Impact 9-grid: 3x3 on desktop, 2-column auto-fit on mobile
- Account matrix: keep 3 columns on mobile (already correct)

### 4f. Counter Animation
- New 3 Impact metrics use same `animate-number` class and IntersectionObserver

**Files:** `main.css` (all style changes), `sw.js` (bump cache version)

## Implementation Notes

- All 4 directions are independent and can be parallelized
- Total files modified: `index.html`, `main.css`, `sw.js`
- New files: 4 AI-generated images in `/images/projects/`
- Service Worker cache version: v13 → v14
