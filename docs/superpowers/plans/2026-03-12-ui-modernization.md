# UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the portfolio UI to Glassmorphism 2.0 with dual accent colors (Indigo + Cyan), unified card system, simplified animations, and upgraded typography.

**Architecture:** Static vanilla HTML/CSS/JS site. Changes span `theme.css` (tokens), `main.css` (all styles), `index.html` (DOM cleanup), `bento-interactions.js` (remove mouse tracking), and `sw.js` (cache bump). No build step — push to master deploys via GitHub Pages.

**Tech Stack:** HTML5, CSS3 (custom properties), vanilla JS (IIFE modules).

**Spec:** `docs/superpowers/specs/2026-03-12-ui-modernization-design.md`

---

## Chunk 1: Design Tokens & Hero Redesign

### Task 1: Update design tokens in theme.css

**Files:**
- Modify: `assets/css/theme.css:6-180` — update/add CSS variables

- [ ] **Step 1: Update background color to darker base**

In `assets/css/theme.css`, find the dark theme `:root` block (line ~16-20). Change:

```css
/* Old */
--color-bg: #000000;

/* New */
--color-bg: #050508;
```

- [ ] **Step 2: Add unified shadow system**

After the existing shadow variables (line ~146-153), replace with 3-level system:

```css
/* Old shadow variables - replace all shadow definitions */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.3);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.4);

/* New unified 3-level shadow system */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.5);
--shadow-2xl: 0 8px 32px rgba(0, 0, 0, 0.5);
```

- [ ] **Step 3: Add dual accent color tokens**

After the existing primary color alpha variables (line ~62-71), add:

```css
/* Dual accent system */
--color-accent-indigo: #6366F1;
--color-accent-indigo-light: #818CF8;
--color-accent-indigo-alpha-8: rgba(99, 102, 241, 0.08);
--color-accent-indigo-alpha-10: rgba(99, 102, 241, 0.10);
--color-accent-indigo-alpha-15: rgba(99, 102, 241, 0.15);
--color-accent-indigo-alpha-20: rgba(99, 102, 241, 0.20);
--color-accent-cyan: #22D3EE;
--color-accent-cyan-deep: #06B6D4;
--color-accent-cyan-alpha-8: rgba(6, 182, 212, 0.08);
--color-accent-cyan-alpha-10: rgba(6, 182, 212, 0.10);
--color-accent-cyan-alpha-15: rgba(6, 182, 212, 0.15);
```

- [ ] **Step 4: Add unified card tokens**

After the bento grid variables (line ~83-90), add:

```css
/* Unified card system */
--card-bg: rgba(255, 255, 255, 0.03);
--card-border: rgba(255, 255, 255, 0.06);
--card-border-hover: rgba(255, 255, 255, 0.12);
--card-radius: 16px;
--card-blur: 8px;
--card-inner-glow: 0 0 0 0.5px rgba(255, 255, 255, 0.04);
--card-shadow: var(--card-inner-glow), var(--shadow-sm);
--card-shadow-hover: 0 0 0 0.5px rgba(255, 255, 255, 0.06), var(--shadow-md);
```

- [ ] **Step 5: Update light theme card tokens**

In the `[data-theme="light"]` block (line ~445-508), add:

```css
--card-bg: rgba(255, 255, 255, 0.7);
--card-border: rgba(0, 0, 0, 0.06);
--card-border-hover: rgba(0, 0, 0, 0.12);
--card-inner-glow: none;
--card-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
--card-shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.08);
```

- [ ] **Step 6: Commit**

```bash
git add assets/css/theme.css
git commit -m "refactor: Update design tokens — darker bg, unified shadows, dual accent colors, card system"
```

---

### Task 2: Hero section redesign

**Files:**
- Modify: `assets/css/main.css:366-445` — hero styles
- Modify: `assets/css/main.css:886-916` — section title styles
- Modify: `index.html:104` — remove particle container
- Modify: `index.html:45` — remove particles preload
- Modify: `index.html:1454` — remove particles script tag

- [ ] **Step 1: Remove particle DOM and script references from index.html**

In `index.html`:
1. Remove the particle container div (line ~104): `<div class="particles-container" id="particles"></div>`
2. Remove the particles preload link (line ~45): `<link rel="preload" href="/assets/js/particles.js" as="script">`
3. Remove the particles script tag (line ~1454): `<script src="/assets/js/particles.js" defer></script>`

- [ ] **Step 2: Replace hero background styles**

In `assets/css/main.css`, replace `.hero::before` (lines 378-388) and `.hero::after` (lines 391-400) with:

```css
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  z-index: 0;
}

.hero::after {
  content: '';
  position: absolute;
  top: 30%;
  left: 25%;
  width: 350px;
  height: 350px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-accent-indigo-alpha-10) 0%, transparent 70%);
  filter: blur(50px);
  z-index: 0;
  pointer-events: none;
}
```

- [ ] **Step 3: Add second ambient glow blob**

After `.hero::after`, add a new element. Since we can't add a third pseudo-element, add a CSS-only glow using the hero's existing container. In `index.html`, inside the `.hero` section (after the opening tag), add:

```html
<div class="hero-glow hero-glow-cyan" aria-hidden="true"></div>
```

And in `main.css`, after the `.hero::after` block, add:

```css
.hero-glow-cyan {
  position: absolute;
  bottom: 20%;
  right: 15%;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-accent-cyan-alpha-8) 0%, transparent 70%);
  filter: blur(40px);
  z-index: 0;
  pointer-events: none;
}
```

- [ ] **Step 4: Update hero title to pure white (remove gradient text)**

In `assets/css/main.css`, replace `.hero-title` (lines 402-413):

```css
/* Old - has gradient text */
.hero-title {
  ...
  background: var(--gradient-hero);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  ...
}
```

Replace with:

```css
.hero-title {
  font-family: var(--font-heading);
  font-size: clamp(2.75rem, 7vw, 4.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: var(--line-tight);
  color: #FAFAFA;
  margin-bottom: var(--space-6);
  position: relative;
  z-index: 1;
  animation: fadeInUp var(--transition-slower) ease-out;
}
```

- [ ] **Step 5: Remove particle CSS styles**

In `assets/css/main.css`, delete the entire particles section (lines 2088-2171):
- `.particles-container` (2088-2097)
- `.particle` (2099-2105)
- `@keyframes particle-float-1/2/3` (2108-2127)
- `@keyframes particle-pulse` (2129-2132)
- 30 individual `.particle:nth-child()` rules (2135-2164)
- Mobile particle hide (2167-2171)

- [ ] **Step 6: Update section titles to pure white**

In `assets/css/main.css`, replace `.section-title` (lines 886-895):

```css
.section-title {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #FAFAFA;
  margin-bottom: var(--space-4);
  position: relative;
}
```

Remove the light theme override for `.section-title` gradient (lines 904-909) and replace with:

```css
[data-theme="light"] .section-title {
  color: #18181B;
}
```

Also update the light theme `.hero-title` override (lines 911-916):

```css
[data-theme="light"] .hero-title {
  color: #18181B;
}
```

- [ ] **Step 7: Verify hero visually**

Start local server (`python -m http.server 8000`) and use Playwright to screenshot the hero area. Confirm:
- No particles visible
- Subtle grid lines in background
- Dual glow blobs (indigo left, cyan right)
- Title is pure white, no gradient
- Bento cards still display correctly

- [ ] **Step 8: Commit**

```bash
git add assets/css/main.css assets/css/theme.css index.html
git commit -m "refactor: Redesign hero — remove particles, add grid+glow background, pure white titles"
```

---

## Chunk 2: Unified Card System

### Task 3: Unify all card styles to glass base

**Files:**
- Modify: `assets/css/main.css` — multiple card sections

This is the largest task. We systematically replace 7 card variants with the unified base.

- [ ] **Step 1: Update bento-item to unified card base**

In `assets/css/main.css`, replace `.bento-item` (lines 3233-3242):

```css
.bento-item {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--space-5);
  position: relative;
  overflow: hidden;
  transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}
```

Replace `.bento-item::before` (lines 3244-3252) — remove the radial gradient overlay:

```css
.bento-item::before {
  display: none;
}
```

Replace `.bento-item:hover` (lines 3254-3261):

```css
.bento-item:hover {
  transform: translateY(-2px);
  border-color: var(--card-border-hover);
  box-shadow: var(--card-shadow-hover);
}
```

Remove the existing `[data-theme="light"] .bento-item` and `[data-theme="light"] .bento-item:hover` rules (added in previous session, near line 3266-3275) — they're now handled by the card tokens in theme.css.

- [ ] **Step 2: Update about-card**

Replace `.about-card` (lines 929-938):

```css
.about-card {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--space-6);
  text-align: center;
  position: relative;
  transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}
```

Remove `.about-card::before` accent bar (lines 940-951) — replace with:

```css
.about-card::before {
  display: none;
}
```

Remove `.about-card::after` radial glow (lines 953-964) — replace with:

```css
.about-card::after {
  display: none;
}
```

Simplify `.about-card:hover` (lines 966-977):

```css
.about-card:hover {
  transform: translateY(-2px);
  border-color: var(--card-border-hover);
  box-shadow: var(--card-shadow-hover);
}
```

- [ ] **Step 3: Update project-card**

Replace `.project-card` (lines 1319-1328):

```css
.project-card {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--space-5);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}
```

Remove `.project-card::before` accent bar (lines 1330-1341) — replace with:

```css
.project-card::before {
  display: none;
}
```

Remove `.project-card::after` radial glow (lines 1343-1354) — replace with:

```css
.project-card::after {
  display: none;
}
```

Simplify `.project-card:hover` (lines 1356-1369):

```css
.project-card:hover {
  transform: translateY(-2px);
  border-color: var(--card-border-hover);
  box-shadow: var(--card-shadow-hover);
}
```

Remove `.project-card:hover::before` and `.project-card:hover::after` rules.

Update `.project-card.featured` (lines 1371-1375):

```css
.project-card.featured {
  border-color: var(--color-accent-indigo-alpha-20);
}
```

Remove shimmer animation (lines 1389-1407):

```css
.project-card .shimmer {
  display: none;
}

.project-card:hover .shimmer {
  display: none;
}
```

- [ ] **Step 4: Update impact-metric**

Replace `.impact-metric` (lines 3623-3633):

```css
.impact-metric {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--space-5);
  text-align: center;
  position: relative;
  transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}
```

Remove `.impact-metric::before` radial glow (lines 3635-3647) — replace with:

```css
.impact-metric::before {
  display: none;
}
```

Simplify `.impact-metric:hover` (lines 3649-3657):

```css
.impact-metric:hover {
  transform: translateY(-2px);
  border-color: var(--card-border-hover);
  box-shadow: var(--card-shadow-hover);
}
```

Remove the `[data-theme="light"] .impact-metric` and hover rules (previously added near line 3728-3738) — now handled by card tokens.

- [ ] **Step 5: Update award-card — replace top bar with left accent**

Replace `.award-card` (lines 1838-1847):

```css
.award-card {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--space-5);
  position: relative;
  text-align: center;
  transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}
```

Replace `.award-card::before` top bar (lines 1849-1856):

```css
.award-card::before {
  display: none;
}
```

Simplify `.award-card:hover` (lines 1858-1862):

```css
.award-card:hover {
  transform: translateY(-2px);
  border-color: var(--card-border-hover);
  box-shadow: var(--card-shadow-hover);
}
```

Update award type variants (lines 1864-1939) — replace top gradient bars with left border accents. For each variant (`.award-gold`, `.award-silver`, `.award-bronze`, etc.), change from:

```css
/* Old pattern */
.award-gold { border-top: ... ; }
.award-gold::before { background: linear-gradient(...) }
```

To:

```css
.award-gold { border-left: 4px solid #F59E0B; }
.award-silver { border-left: 4px solid #94A3B8; }
.award-bronze { border-left: 4px solid #D97706; }
.award-excellence { border-left: 4px solid var(--color-accent-indigo); }
.award-chengguo { border-left: 4px solid var(--color-accent-cyan); }
.award-architecture { border-left: 4px solid #8B5CF6; }
```

Remove each variant's `::before` gradient override.

- [ ] **Step 6: Update writing-card**

Replace `.writing-card` (lines 2417-2427):

```css
.writing-card {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  position: relative;
  transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}
```

Replace `.writing-card::before` accent bar (lines 2429-2440):

```css
.writing-card::before {
  display: none;
}
```

Replace `.writing-card::after` radial glow (lines 2442-2453):

```css
.writing-card::after {
  display: none;
}
```

Simplify `.writing-card:hover` (lines 2455-2469):

```css
.writing-card:hover {
  transform: translateY(-2px);
  border-color: var(--card-border-hover);
  box-shadow: var(--card-shadow-hover);
}
```

- [ ] **Step 7: Update contribution-card**

Replace `.contribution-card` (lines 1684-1691):

```css
.contribution-card {
  background: var(--card-bg);
  backdrop-filter: blur(var(--card-blur));
  -webkit-backdrop-filter: blur(var(--card-blur));
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--space-5);
  text-align: center;
  position: relative;
  transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}
```

Simplify `.contribution-card:hover` (lines 1693-1700):

```css
.contribution-card:hover {
  transform: translateY(-2px);
  border-color: var(--card-border-hover);
  box-shadow: var(--card-shadow-hover);
}
```

- [ ] **Step 8: Verify cards visually**

Use Playwright to scroll through all sections and screenshot. Confirm:
- All cards share same glass appearance
- No top accent bars visible
- Award cards have left colored border
- Hover effects are uniform (-2px lift + border brighten)
- No radial glows on hover

- [ ] **Step 9: Commit**

```bash
git add assets/css/main.css
git commit -m "refactor: Unify 7 card types into single glass card system — remove accent bars and radial glows"
```

---

## Chunk 3: Typography, Navigation, Buttons & Animation Cleanup

### Task 4: Update navigation and buttons

**Files:**
- Modify: `assets/css/main.css:120-129` — nav underline
- Modify: `assets/css/main.css:735-856` — button styles

- [ ] **Step 1: Change nav underline to center-expand**

In `assets/css/main.css`, find `.nav-link::after` (lines 120-129). Change:

```css
/* Old */
transform-origin: left;

/* New */
transform-origin: center;
```

- [ ] **Step 2: Simplify button styles**

Replace `.btn::before` shine overlay (lines 753-764) with:

```css
.btn::before {
  display: none;
}
```

Replace `.btn-primary` (lines 771-780):

```css
.btn-primary {
  background: var(--color-accent-indigo);
  color: white;
  border: none;
  border-radius: 10px;
}

.btn-primary:hover {
  background: var(--color-accent-indigo-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

Update `.btn-secondary` (lines 782-796):

```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}
```

- [ ] **Step 3: Commit**

```bash
git add assets/css/main.css
git commit -m "refactor: Center-expand nav underline, simplify buttons to solid Indigo"
```

---

### Task 5: Streamline animations and remove mouse tracking

**Files:**
- Modify: `assets/css/theme.css:398-439` — scroll animation base
- Modify: `assets/js/bento-interactions.js:13-30` — remove mouse tracking

- [ ] **Step 1: Simplify scroll animation base**

In `assets/css/theme.css`, update `.animate-on-scroll` (lines ~398-408):

```css
.animate-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 500ms cubic-bezier(0.4, 0, 0.2, 1),
              transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

Update stagger delays (lines ~435-439) to use consistent 60ms intervals:

```css
.stagger-1 { transition-delay: 60ms; }
.stagger-2 { transition-delay: 120ms; }
.stagger-3 { transition-delay: 180ms; }
.stagger-4 { transition-delay: 240ms; }
.stagger-5 { transition-delay: 300ms; }
```

- [ ] **Step 2: Remove mouse tracking from bento-interactions.js**

In `assets/js/bento-interactions.js`, replace the `initMouseTracking` function (lines 13-30) with a no-op:

```javascript
function initMouseTracking() {
  // Mouse tracking gradient removed in UI modernization
}
```

- [ ] **Step 3: Commit**

```bash
git add assets/css/theme.css assets/js/bento-interactions.js
git commit -m "refactor: Simplify scroll animations (20px/500ms), remove mouse-tracking gradient"
```

---

### Task 6: Light theme adaptation and service worker bump

**Files:**
- Modify: `assets/css/main.css` — light theme hero
- Modify: `assets/css/theme.css` — light theme overrides
- Modify: `sw.js:6-8` — cache version bump

- [ ] **Step 1: Add light theme hero overrides**

In `assets/css/main.css`, after the hero styles, add:

```css
[data-theme="light"] .hero::before {
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px);
}

[data-theme="light"] .hero::after {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
}

[data-theme="light"] .hero-glow-cyan {
  background: radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, transparent 70%);
}
```

- [ ] **Step 2: Bump service worker cache version**

In `sw.js`, change lines 6-8:

```javascript
const CACHE_NAME = 'kevinten-v15';
const RUNTIME_CACHE = 'runtime-v15';
const STATIC_CACHE = 'static-v15';
```

- [ ] **Step 3: Full visual verification**

Use Playwright to take full-page screenshots in both dark and light modes. Walk through:
- Hero: grid lines visible, dual glow blobs, pure white title
- Impact: glass cards, no radial glow, color-coded metrics still work
- Projects: glass cards, cover images intact, no shimmer, no accent bars
- Awards: left-border color accents
- Writing: glass cards, no cyan accent bar
- Experience: timeline intact, cards modernized
- Light theme: lighter grid, reduced glow, proper card shadows
- Mobile: resize to 375px and verify layout

- [ ] **Step 4: Commit**

```bash
git add assets/css/main.css assets/css/theme.css sw.js
git commit -m "refactor: Light theme hero adaptation, bump service worker v14→v15"
```

---

## File Change Summary

| File | Action | Changes |
|------|--------|---------|
| `assets/css/theme.css` | Modify | Darker bg, unified shadows, dual accent tokens, card tokens, light theme tokens, scroll animation simplification |
| `assets/css/main.css` | Modify | Hero redesign, 7 card types unified, remove particles CSS, remove accent bars/radial glows, button refresh, nav underline, light theme hero |
| `index.html` | Modify | Remove particle container, particle preload, particle script tag, add hero-glow-cyan div |
| `assets/js/bento-interactions.js` | Modify | Remove mouse-tracking gradient function |
| `sw.js` | Modify | Cache version v14→v15 |
| `assets/js/particles.js` | Keep but unused | Script tag removed from HTML, file left in place for git history |
