# Portfolio UI Modernization Design

**Date:** 2026-03-12
**Status:** Approved

## Overview

Comprehensive UI modernization of the KevinTen portfolio site. Direction: Glassmorphism 2.0 with dual accent colors (Indigo + Cyan). Simplify visual noise, unify card system, upgrade typography, modernize Hero, and streamline animations.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Overall Direction | Glassmorphism 2.0 | Builds on existing glass foundation, upgrade quality not rebuild |
| Color Strategy | Dual Accent (Indigo #6366F1 + Cyan #22D3EE) | Content diversity needs visual distinction; Indigo=interaction, Cyan=data |
| Hero Style | Grid & Glow | Subtle grid preserves tech metaphor; dual glow echoes dual accent |
| Card System | Glass & Shimmer (unified) | Remove per-component decoration, share one base style |

## 1. Design Tokens Upgrade

### Background Color Scale
- Page: `#050508` (darker than current `#000000` — adds depth)
- Card: `rgba(255,255,255,0.03)` + `backdrop-filter: blur(8px)`
- Nested: `rgba(255,255,255,0.06)`

### Border System (unified)
- Default: `1px solid rgba(255,255,255,0.06)`
- Hover: `1px solid rgba(255,255,255,0.12)`
- Active/Focus: `1px solid rgba(99,102,241,0.4)`

### Border Radius (unified)
- Cards: `16px` (all cards, currently varies 12–24px)
- Small elements (tags, icons): `10px`
- Buttons: `10px` (rectangular) or `999px` (pill)

### Shadow System (3 levels only)
- `--shadow-sm`: `0 2px 8px rgba(0,0,0,0.3)` — resting cards
- `--shadow-md`: `0 4px 16px rgba(0,0,0,0.4)` — hover state
- `--shadow-lg`: `0 8px 32px rgba(0,0,0,0.5)` — modals/elevated

### Dual Accent Colors
- `--color-accent-indigo`: `#6366F1` — buttons, links, interactive hover, timeline
- `--color-accent-indigo-alpha`: `rgba(99,102,241, <varies>)` — 8%, 10%, 15%, 20%
- `--color-accent-cyan`: `#22D3EE` / `#06B6D4` — metric values, data badges, stats
- `--color-accent-cyan-alpha`: `rgba(6,182,212, <varies>)`

## 2. Hero Redesign

### Remove
- Particle animation system (`particles.js` DOM elements + CSS)
- Hero `::before` grid overlay (current heavy grid pattern)
- Hero `::after` gradient overlay
- Gradient text on hero title

### Add
- Subtle grid background: `background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 60px 60px;`
- Dual ambient glow: Indigo blob (top-left, 300px, blur 50px) + Cyan blob (bottom-right, 200px, blur 40px)
- Hero title: Pure white `#FAFAFA`, `font-weight: 800`, `letter-spacing: -0.04em` (no gradient)
- Subtitle badge: `Available for work` pill with Indigo alpha background

### Keep
- Bento card area (bio + account matrix) — applies new unified card style
- Typing effect
- Stat badges (years, title, company)

## 3. Unified Card System

### Base Card Style (replaces all 7+ card variants)

```css
.card-base {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  box-shadow: 0 0 0 0.5px rgba(255,255,255,0.04), var(--shadow-sm);
  transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}

.card-base:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,0.12);
  box-shadow: 0 0 0 0.5px rgba(255,255,255,0.06), var(--shadow-md);
}
```

### Per-Component Removals

| Component | Remove | Keep |
|-----------|--------|------|
| `.bento-item` | `::before` radial glow, mouse-tracking gradient | Glass base, grid layout |
| `.project-card` | `::before` accent bar, `::after` radial glow, shimmer animation | Cover image, footer, hover |
| `.impact-metric` | Over-styled borders | Icon bg colors (row-based), counter animation |
| `.experience-card` | Gradient top bar | Timeline layout, bullet glow |
| `.contribution-card` | Large gradient icon background | Icon + text structure |
| `.award-card` | Color-coded top bar | Color indicator as left 4px border instead |
| `.writing-card` | Cyan accent bar, radial glow | Category badge, meta info |
| `.about-card` | Gradient accent top bar, radial gradient hover | Icon + description |

### Award Card Special Treatment
Replace top color bar with left 4px vertical accent:
- Gold: `border-left: 4px solid #F59E0B`
- Silver: `border-left: 4px solid #94A3B8`
- Bronze: `border-left: 4px solid #D97706`

## 4. Typography Upgrade

### Section Titles
- Remove: gradient text (`-webkit-background-clip: text`)
- New: Pure white `#FAFAFA`, `font-weight: 800`, `letter-spacing: -0.03em`

### Section Subtitles
- `#71717A` → `#A1A1AA` for better readability

### Navigation
- Underline animation: change `transform-origin: left` → `transform-origin: center`
- Result: expands from center outward (modern convention)

## 5. Animation Streamlining

### Remove
- `particles.js` particle system (30 CSS particles)
- `.shimmer` sweep animation on project cards
- Card-specific radial glow animations on hover
- Bento mouse-tracking gradient effect

### Simplify Scroll Animations
- Unified entrance: `opacity: 0 → 1` + `translateY(20px → 0)`
- Duration: `500ms` with `cubic-bezier(0.4, 0, 0.2, 1)`
- Stagger delay: `60ms` between siblings (currently inconsistent)

### Keep
- Number counter animations (IntersectionObserver)
- Theme toggle icon rotation
- Skill bar width animations
- Gallery lightbox transitions

## 6. Button Refresh

### Remove
- `::before` shine overlay on all buttons

### Primary Button
- Background: `#6366F1` solid (no gradient)
- Hover: `#7C7CF8` (lighten 10%)
- Border-radius: `10px`
- Active: `scale(0.98)`

### Secondary Button
- Background: `rgba(255,255,255,0.06)`
- Border: `1px solid rgba(255,255,255,0.1)`
- Hover: `rgba(255,255,255,0.1)` + border brighten

## 7. Light Theme Adaptation

### Cards
- Background: `rgba(255,255,255,0.7)`
- Border: `1px solid rgba(0,0,0,0.06)` → hover `rgba(0,0,0,0.12)`
- Shadow: `0 2px 8px rgba(0,0,0,0.06)` → hover `0 4px 16px rgba(0,0,0,0.08)`

### Hero
- Grid lines: `rgba(0,0,0,0.04)`
- Glow blobs: reduce opacity by 50%

### Accent Colors
- Keep Indigo + Cyan as-is (sufficient contrast on light bg)

## 8. Service Worker
- Bump cache `v14` → `v15`

## File Change Summary

| File | Action | Changes |
|------|--------|---------|
| `assets/css/theme.css` | Modify | New tokens (shadow-sm/md/lg, accent-indigo, accent-cyan, unified border/radius) |
| `assets/css/main.css` | Modify | Unified card base, remove decorations, hero redesign, typography, animation cleanup |
| `index.html` | Modify | Remove particle DOM, simplify hero structure |
| `assets/js/particles.js` | Remove/Empty | No longer needed |
| `assets/js/bento-interactions.js` | Modify | Remove mouse-tracking gradient logic |
| `sw.js` | Modify | Cache v14→v15 |
