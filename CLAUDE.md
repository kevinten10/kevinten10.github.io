# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal website and blog (kevinten10.github.io) built as a static site. The site uses vanilla HTML/CSS/JavaScript with no build system or framework dependencies. It is deployed via GitHub Pages.

**Key Characteristics:**
- Static site hosted on GitHub Pages
- Modern ES6+ JavaScript (no jQuery)
- CSS custom properties (CSS variables) for theming
- Service Worker for offline caching
- No build tools - direct file editing

## Common Commands

### Local Development

```bash
# Start a local server (Python)
python -m http.server 8000

# Or use Node.js
npx http-server -p 8000

# Or use PHP
php -S localhost:8000
```

Visit http://localhost:8000 to preview changes.

### Deployment

```bash
# Commit and push to main branch - GitHub Pages auto-deploys
git add .
git commit -m "description"
git push origin main
```

**Important:** The `.nojekyll` file in the repository root prevents GitHub Pages from using Jekyll processing, ensuring all files (including files starting with `_`) are served correctly.

## Architecture & File Structure

### Core Architecture

The site follows a **modern static site architecture** without a build system:

- **Entry Point**: `index.html` - The homepage with personal branding, projects showcase, and tech stack
- **Blog Posts**: Located in `2018/`, `2019/`, etc. - Each post is a standalone HTML page generated from a previous Hexo setup
- **Archives**: `archives/`, `categories/`, `tags/` - Dynamic-style pages for content organization

### Key Directories

```
assets/
├── css/
│   ├── theme.css       # CSS custom properties (variables) for theming
│   └── main.css        # Main stylesheet with component styles
├── js/
│   ├── app.js          # Main application logic (navigation, animations)
│   ├── particles.js    # Lightweight particle animation system
│   ├── search.js       # Client-side search functionality
│   └── theme.js        # Theme switching logic
sw.js                   # Service Worker for caching and offline support
```

### CSS Architecture

**Two-tier CSS system:**

1. **`theme.css`** - Design tokens and CSS variables:
   - Color system (primary, secondary, accent, semantic colors)
   - Typography scales (fonts, sizes, weights, line heights)
   - Spacing scale
   - Border radius, shadows, transitions
   - Animation keyframes
   - Responsive breakpoints

2. **`main.css`** - Component styles that reference theme variables

**Theme Modification:** When modifying colors or design tokens, edit `theme.css`. When changing component layouts, edit `main.css`.

### JavaScript Architecture

**Modular IIFE pattern** - Each file is a self-contained module:

- **`app.js`** - Core functionality: navigation scroll effects, lazy loading, mobile menu, smooth scroll, animations (typing, counters)
- **`particles.js`** - Pure CSS-based particle system (disabled on mobile/reduced-motion)
- **`search.js`** - Client-side search with debouncing
- **`theme.js`** - Light/dark theme switching with localStorage persistence

**No build step** - JavaScript modules are loaded directly via `<script>` tags in HTML.

### Service Worker

**`sw.js`** implements multiple caching strategies:
- **Cache First**: Static assets (CSS, JS, images)
- **Network First**: API requests
- **Stale While Revalidate**: HTML pages
- Automatic cache cleanup (7-day expiry)
- Background sync for offline support

**After modifying `sw.js`:** The service worker must be manually updated in browsers. Users can skip waiting by sending a `SKIP_WAITING` message.

## Content Management

### Adding New Blog Posts

Since this was previously a Hexo blog, new posts should be added as HTML files:

1. Create a new directory under the appropriate year: `2024/12/25/article-name/`
2. Create an `index.html` file with full blog post content
3. Include proper meta tags for SEO
4. Link from archives/categories/tags pages as needed

**Note:** Consider migrating to a static site generator (Astro, Next.js) for easier content management. See `Hexo方案说明.md` for the previous Hexo configuration.

### Homepage Customization

Edit `index.html` directly:
- **Hero Section**: Personal info, stats, CTAs
- **Projects Section**: Pinned GitHub projects
- **Tech Stack Section**: Skills and technologies
- **Contributions Section**: Open source contributions

## Technical Constraints

### Browser Support

**Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)**

The site uses modern web standards:
- CSS Grid and Flexbox
- CSS custom properties (variables)
- Intersection Observer API
- ES6+ JavaScript (arrow functions, const/let, template literals)
- Service Workers

### No Framework Constraints

Since there's no build system:
- **No npm/yarn dependencies** (unless using `npx` for local dev)
- **No transpilation** - Code must be natively compatible
- **No bundling** - Each JS/CSS file is loaded separately
- **Direct file editing** - No hot module replacement

When adding new features, use vanilla JavaScript or ensure libraries work without a build step.

### Performance Considerations

- **Service Worker caching** is configured - clear cache after major updates
- **Lazy loading** is implemented for images
- **Particle animations** are disabled on mobile devices
- **Reduced motion** preference is respected

## Deployment Specifics

### GitHub Pages Configuration

- **Source**: `main` branch
- **Root directory**: Repository root
- **Custom domain**: None (using default `kevinten10.github.io`)
- **`.nojekyll` file**: Present - prevents Jekyll processing

### Deployment Checklist

Before pushing changes:
- [ ] Test locally with `python -m http.server`
- [ ] Verify all links work
- [ ] Check mobile responsiveness
- [ ] Test Service Worker (chrome://serviceworker-internals/)
- [ ] Update `sw.js` version if caching strategy changed
- [ ] Verify meta tags and SEO

## Migration Notes

The site was previously built with **Hexo** (static site generator). Evidence of this remains in:
- Blog post directory structure (`YYYY/MM/DD/slug/`)
- `Hexo方案说明.md` - Contains Hexo configuration
- Old article pages maintain Hexo-generated structure

**Future consideration**: The optimization documents (`OPTIMIZATION_SUMMARY.md`, `CODE_REVIEW_REPORT.md`) suggest considering migration to Astro or Next.js for better maintainability.

## Code Style

- **CSS**: 2-space indentation, BEM-like naming, CSS custom properties
- **JavaScript**: ES6+ strict mode, IIFE modules, camelCase naming
- **HTML**: Semantic tags, ARIA attributes, proper meta tags
- **File naming**: kebab-case for files (e.g., `theme.css`, `app.js`)
