# Portfolio Comprehensive Optimization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix account matrix display, expand Impact from 6 to 9 metrics, generate AI project illustrations, and refine styles across the portfolio site.

**Architecture:** Static vanilla HTML/CSS/JS site. All changes are in `index.html`, `assets/css/main.css`, and `sw.js`. No build step — push to master deploys via GitHub Pages. AI images generated via Image MCP tool and saved to `/images/projects/`.

**Tech Stack:** HTML5, CSS3 (custom properties), vanilla JS (IIFE modules), Image MCP for illustration generation.

**Spec:** `docs/superpowers/specs/2026-03-12-portfolio-optimization-design.md`

---

## Chunk 1: Content & Structure Changes

### Task 1: Account Matrix — Add GitHub and X/Twitter, change to 3-col grid

**Files:**
- Modify: `index.html:216` — insert 2 new account cards before LinkedIn
- Modify: `assets/css/main.css:450` — change `repeat(4, 1fr)` to `repeat(3, 1fr)`

- [ ] **Step 1: Add GitHub account card to account-matrix**

In `index.html`, insert the following as the FIRST child of `.account-matrix` (before the LinkedIn `<a>` at line 217):

```html
<a href="https://github.com/kevinten10" target="_blank" rel="noopener noreferrer" class="account-card" aria-label="GitHub">
    <svg class="account-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
    <span class="account-label">GitHub</span>
</a>
```

- [ ] **Step 2: Add X/Twitter account card**

Insert the following as the SECOND child of `.account-matrix` (after GitHub, before LinkedIn):

```html
<a href="https://x.com/kevinten1024" target="_blank" rel="noopener noreferrer" class="account-card" aria-label="X / Twitter">
    <svg class="account-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
    <span class="account-label">X</span>
</a>
```

- [ ] **Step 3: Change account-matrix CSS grid to 3 columns**

In `assets/css/main.css`, change line 450:
- Old: `grid-template-columns: repeat(4, 1fr);`
- New: `grid-template-columns: repeat(3, 1fr);`

- [ ] **Step 4: Verify account matrix visually**

Start local server (`python -m http.server 8000`) and use Playwright to screenshot the account matrix area. Confirm:
- 9 accounts displayed in 3x3 grid
- All labels fully visible (no truncation)
- Order: GitHub, X, LinkedIn, 知乎, CSDN, 小红书, 抖音, TikTok, 微信

- [ ] **Step 5: Commit**

```bash
git add index.html assets/css/main.css
git commit -m "fix: Account matrix 4col→3col, add GitHub and X accounts (9 total, 3x3 grid)"
```

---

### Task 2: Impact Section — Add 3 new metric cards (6 → 9)

**Files:**
- Modify: `index.html:332` — insert 3 new `.impact-metric` divs after the last existing metric

- [ ] **Step 1: Add Hackathon Awards metric**

In `index.html`, insert after the AI Agent 应用 metric (after line 332, before `</div><!-- end impact-dashboard -->`):

```html
<!-- Hackathon Awards -->
<div class="impact-metric animate-on-scroll stagger-1">
    <div class="metric-icon">&#x1F3C6;</div>
    <div class="metric-value animate-number" data-value="4" data-duration="1500" data-suffix="+">0</div>
    <div class="metric-label">Hackathon 奖项</div>
    <div class="metric-desc">金奖 &middot; 亚军 &middot; 铜奖</div>
</div>
```

- [ ] **Step 2: Add Open Source Projects metric**

Insert after the Hackathon metric:

```html
<!-- Open Source Projects -->
<div class="impact-metric animate-on-scroll stagger-2">
    <div class="metric-icon">&#x1F4E6;</div>
    <div class="metric-value animate-number" data-value="10" data-duration="1500" data-suffix="+">0</div>
    <div class="metric-label">开源项目</div>
    <div class="metric-desc">个人项目 + 社区贡献</div>
</div>
```

- [ ] **Step 3: Add Tech Meetup metric**

Insert after the Open Source metric:

```html
<!-- Tech Meetup -->
<div class="impact-metric animate-on-scroll stagger-3">
    <div class="metric-icon">&#x1F3A4;</div>
    <div class="metric-value animate-number" data-value="20" data-duration="1500" data-suffix="+">0</div>
    <div class="metric-label">技术 Meetup</div>
    <div class="metric-desc">组织与参与</div>
</div>
```

- [ ] **Step 4: Verify Impact section visually**

Use Playwright to scroll to Impact section and screenshot. Confirm:
- 9 metric cards displayed
- 3x3 grid on desktop (auto-fit with minmax(200px, 1fr) handles this)
- New cards have counter animation on scroll
- All text readable, no overflow

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: Add 3 Impact metrics (Hackathon, Open Source, Meetup) — 6→9 total"
```

---

## Chunk 2: AI-Generated Project Illustrations

### Task 3: Generate and integrate AI project illustrations

**Files:**
- Create: `images/projects/capa-concept.png`
- Create: `images/projects/openoctopus-concept.png`
- Create: `images/projects/trip-agent-concept.png`
- Create: `images/projects/ai-tools-concept.png`
- Modify: `index.html` — update project card structure to include cover images

- [ ] **Step 1: Create images/projects/ directory**

```bash
mkdir -p images/projects
```

- [ ] **Step 2: Generate Capa illustration**

Use Image MCP (`mcp__mcp-image__generate_image`) with prompt:
"Minimalist abstract illustration of cloud-native multi-runtime architecture. Multiple cloud icons (AWS, Azure, GCP) connected through a central glowing API abstraction layer. Futuristic tech style, dark navy background, blue and purple gradient accents. Clean vector style, no text. 400x240px aspect ratio."

Save to: `images/projects/capa-concept.png`

- [ ] **Step 3: Generate OpenOctopus illustration**

Use Image MCP with prompt:
"Minimalist digital octopus as an AI agent coordinator. Glowing tentacles connecting life domain icons (travel suitcase, health heart, finance chart, food). Neural network nodes along tentacles. Dark background, emerald green and cyan glow. Clean vector style, no text. 400x240px aspect ratio."

Save to: `images/projects/openoctopus-concept.png`

- [ ] **Step 4: Generate Trip Agent illustration**

Use Image MCP with prompt:
"Minimalist AI travel planning concept. Abstract world map with glowing route paths between cities. Small AI agent icon orchestrating the routes. Warm amber and coral gradients on dark background. Clean vector style, no text. 400x240px aspect ratio."

Save to: `images/projects/trip-agent-concept.png`

- [ ] **Step 5: Generate AI Tools illustration**

Use Image MCP with prompt:
"Minimalist developer tools dashboard overview. Floating IDE window outlines, code brackets, AI model chip icons arranged in a grid pattern. Purple and magenta gradients on dark background. Clean vector style, no text. 400x240px aspect ratio."

Save to: `images/projects/ai-tools-concept.png`

- [ ] **Step 6: Add cover images to project cards in index.html**

For each of the 4 project cards (Capa at ~line 524, OpenOctopus at ~line 685, Trip Agent at ~line 726, AI Tools at ~line 705), add a cover image div after `<div class="shimmer"></div>`:

```html
<div class="project-cover">
    <img src="/images/projects/capa-concept.png" alt="Capa concept illustration" loading="lazy">
</div>
```

Repeat for each project with appropriate image path and alt text.

- [ ] **Step 7: Add project-cover CSS**

In `assets/css/main.css`, add after the `.shimmer` styles for project cards:

```css
.project-cover {
  width: 100%;
  height: 140px;
  overflow: hidden;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  margin: calc(-1 * var(--space-5)) calc(-1 * var(--space-5)) var(--space-4) calc(-1 * var(--space-5));
  width: calc(100% + var(--space-5) * 2);
}

.project-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}

.project-card:hover .project-cover img {
  transform: scale(1.05);
}
```

- [ ] **Step 8: Verify project cards visually**

Use Playwright to scroll to Projects section and screenshot. Confirm cover images display correctly with proper aspect ratio and hover zoom effect.

- [ ] **Step 9: Commit**

```bash
git add images/projects/ index.html assets/css/main.css
git commit -m "feat: Add AI-generated concept illustrations to 4 core project cards"
```

---

## Chunk 3: Style Optimizations

### Task 4: Impact card icon upgrade and color theming

**Files:**
- Modify: `assets/css/main.css:3630-3673` — update metric-icon and metric-value styles

- [ ] **Step 1: Add gradient background to metric-icon**

In `assets/css/main.css`, replace the `.metric-icon` block (line 3630):

Old:
```css
.metric-icon {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-4);
  display: block;
}
```

New:
```css
.metric-icon {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-left: auto;
  margin-right: auto;
  border-radius: var(--radius-xl);
  background: var(--color-primary-alpha-10);
}
```

- [ ] **Step 2: Add color-coded metric value gradients for rows**

Replace the existing nth-child color variants (lines 3661-3673) with expanded theme covering 3 rows:

```css
/* Row 1: Core metrics (1-3) — blue/purple */
.impact-metric:nth-child(-n+3) .metric-value {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Row 2: AI metrics (4-6) — green/teal */
.impact-metric:nth-child(n+4):nth-child(-n+6) .metric-value {
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Row 3: Achievement metrics (7-9) — gold/amber */
.impact-metric:nth-child(n+7) .metric-value {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Matching icon backgrounds per row */
.impact-metric:nth-child(-n+3) .metric-icon {
  background: var(--color-primary-alpha-10);
}

.impact-metric:nth-child(n+4):nth-child(-n+6) .metric-icon {
  background: rgba(16, 185, 129, 0.1);
}

.impact-metric:nth-child(n+7) .metric-icon {
  background: rgba(245, 158, 11, 0.1);
}
```

- [ ] **Step 3: Commit**

```bash
git add assets/css/main.css
git commit -m "style: Impact card icon backgrounds and color-coded metric rows"
```

---

### Task 5: Light theme enhancement and hover effects

**Files:**
- Modify: `assets/css/main.css` — add light theme overrides and hover glow

- [ ] **Step 1: Add light theme Impact card styles**

Append after the Impact mobile responsive block (after line 3688):

```css
[data-theme="light"] .impact-metric {
  background: var(--color-bg-card);
  border-color: var(--color-border-light);
  box-shadow: var(--bento-shadow-sm);
}

[data-theme="light"] .impact-metric:hover {
  box-shadow: var(--bento-shadow-hover);
  border-color: var(--color-primary-light);
}
```

- [ ] **Step 2: Add light theme bento card enhancement**

Add near other `[data-theme="light"]` overrides:

```css
[data-theme="light"] .bento-item {
  box-shadow: var(--bento-shadow-sm);
}

[data-theme="light"] .bento-item:hover {
  box-shadow: var(--bento-shadow-hover);
}
```

- [ ] **Step 3: Add project card hover glow**

Add after project card hover styles:

```css
.project-card:hover {
  box-shadow: 0 0 0 1px var(--color-primary-alpha-30),
              var(--bento-shadow-hover);
}
```

- [ ] **Step 4: Verify light and dark themes**

Use Playwright to:
1. Screenshot Impact section in dark mode
2. Toggle theme to light
3. Screenshot Impact section in light mode
4. Screenshot project cards with hover states

Confirm: colored icon backgrounds, card shadows in light mode, glow border on project hover.

- [ ] **Step 5: Commit**

```bash
git add assets/css/main.css
git commit -m "style: Light theme card shadows, project hover glow, Impact color theming"
```

---

### Task 6: Bump service worker cache and final verification

**Files:**
- Modify: `sw.js:6-8` — bump v13 → v14

- [ ] **Step 1: Bump service worker cache version**

In `sw.js`, change:
- `'kevinten-v13'` → `'kevinten-v14'`
- `'runtime-v13'` → `'runtime-v14'`
- `'static-v13'` → `'static-v14'`

- [ ] **Step 2: Full page visual verification**

Use Playwright to take full-page screenshot in both dark and light modes. Walk through:
- Hero: account matrix 3x3 grid
- Impact: 9 metrics with colored rows
- Projects: cover images on 4 cards
- Responsive: resize to 375px and verify mobile layout

- [ ] **Step 3: Final commit and push**

```bash
git add sw.js
git commit -m "chore: Bump service worker cache v13→v14"
git push origin master
```

---

## File Change Summary

| File | Action | Changes |
|------|--------|---------|
| `index.html` | Modify | +2 account cards, +3 Impact metrics, +4 project cover images |
| `assets/css/main.css` | Modify | Account grid 3col, metric-icon styles, color themes, light theme, hover effects, project-cover |
| `sw.js` | Modify | Cache version v13→v14 |
| `images/projects/*.png` | Create | 4 AI-generated concept illustrations |
