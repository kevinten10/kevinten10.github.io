# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static GitHub Pages personal portfolio site for a Software Architect / AI-Native Developer. Single-page application built with **vanilla HTML/CSS/JavaScript** — no frameworks, no build tools, no npm dependencies.

**Live site:** https://kevinten10.github.io/
**Deployment:** Push to `master` branch triggers automatic GitHub Pages deployment. No build step.

## Local Development

```bash
# Start a local server (pick one)
python -m http.server 8000
npx http-server -p 8000

# Then visit http://localhost:8000
```

There is no build, lint, or test command — this is a static site served directly.

## Architecture

### Single-Page Structure

`index.html` (1,459 lines) is the entire site. It contains sections: hero/about, impact metrics, experience timeline, projects, tech skills, contributions, awards, writing/articles, photo gallery, and contact.

### Modern Source Code (`assets/`)

- **`assets/css/theme.css`** — CSS custom properties (variables) for the theming system (dark/light mode). All colors, spacing, and design tokens live here.
- **`assets/css/main.css`** — All component styles (~5,300 lines). Uses the variables from theme.css.
- **`assets/css/articles.css`** — Styles for the articles page.
- **`assets/js/`** — 13 modular JS files using IIFE pattern, exposing globals (e.g., `window.App`, `window.ThemeManager`, `window.MobileNav`). Scripts are loaded sequentially in index.html — no module bundler.

Key JS modules:
| Module | Purpose |
|--------|---------|
| `app.js` | Core initialization, scroll handling, typing effect |
| `theme.js` | Dark/light toggle, localStorage persistence, system preference detection |
| `animations.js` | IntersectionObserver-based scroll animations |
| `bento-interactions.js` | Mouse-tracking hover effects on bento grid cards |
| `mobile-nav.js` | Mobile drawer menu with Escape key support |
| `project-modal.js` | Project quick-view modal with GitHub stats |
| `gallery.js` | Photo gallery with category filtering and lightbox |
| `github-stats.js` | Live GitHub API fetching for repo data |
| `particles.js` | Canvas-based background particle animation |
| `search.js` | Article search and filtering |

### Legacy Code (kept for backward compatibility)

`/js/`, `/css/`, `/2018/`, `/2019/`, `/categories/`, `/tags/`, `/archives/`, `articles.html` — old blog structure from earlier iterations. The modern implementation lives in `/assets/`.

### Service Worker (`sw.js`)

Versioned cache (`kevinten-v9`) with three strategies:
- **Cache-first:** static assets (JS, CSS, images, fonts)
- **Network-first:** API requests
- **Stale-while-revalidate:** HTML pages

When modifying cached assets, bump the cache version in `sw.js`.

## Key Patterns

- **Theming:** CSS custom properties in `theme.css` control all visual theming. Dark mode is default. Theme preference persists via localStorage.
- **Animations:** IntersectionObserver triggers `.visible` class additions for scroll-reveal effects. Respects `prefers-reduced-motion`.
- **Responsive breakpoints:** Mobile < 768px, Tablet 768–1024px, Desktop > 1024px, Large > 1280px.
- **Accessibility:** Semantic HTML5, ARIA labels, skip-to-content link, keyboard navigation, focus-visible styles, screen-reader-only content (`.sr-only`).
- **Content language:** Site content is bilingual (Chinese and English). Chinese text appears in section content; English in technical terms and UI labels.

## External Services

- **GitHub API** — fetches live repo stats (stars, forks) for project cards
- **Google Fonts** — DM Sans, Inter, JetBrains Mono, Noto Sans SC, Space Grotesk

## Important Files

| File | Purpose |
|------|---------|
| `index.html` | The entire site |
| `sw.js` | Service Worker (update cache version when changing assets) |
| `assets/css/theme.css` | Design tokens / CSS variables |
| `assets/css/main.css` | All component styles |
| `assets/js/app.js` | Core app initialization |
| `.nojekyll` | Disables Jekyll processing on GitHub Pages |
| `sitemap.xml` | SEO sitemap |
