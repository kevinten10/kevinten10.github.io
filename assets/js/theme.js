/**
 * Theme Manager - Dark/Light mode toggle
 * Supports system preference and manual override
 * @version 1.1.0
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'kevinten-theme';
  const THEME_ATTRIBUTE = 'data-theme';

  // Theme manager object
  const ThemeManager = {
    currentTheme: 'dark',

    // Theme colors for browser UI (theme-color meta tag)
    themeColors: {
      light: '#F8FAFC',
      dark: '#0F172A'
    },

    // Theme CSS variables for smooth transitions
    themes: {
      light: {
        '--color-bg': '#F8FAFC',
        '--color-bg-secondary': '#F1F5F9',
        '--color-bg-tertiary': '#E2E8F0',
        '--color-bg-card': '#FFFFFF',
        '--color-text': '#0F172A',
        '--color-text-secondary': '#475569',
        '--color-text-muted': '#64748B',
        '--color-text-subtle': '#94A3B8',
        '--color-border': '#E2E8F0',
        '--color-border-light': '#CBD5E1',
        '--color-border-glow': 'rgba(59, 130, 246, 0.3)',
        '--gradient-hero': 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)'
      },
      dark: {
        '--color-bg': '#0F172A',
        '--color-bg-secondary': '#1E293B',
        '--color-bg-tertiary': '#334155',
        '--color-bg-card': 'rgba(30, 41, 59, 0.8)',
        '--color-text': '#F8FAFC',
        '--color-text-secondary': '#CBD5E1',
        '--color-text-muted': '#64748B',
        '--color-text-subtle': '#475569',
        '--color-border': '#334155',
        '--color-border-light': '#475569',
        '--color-border-glow': 'rgba(59, 130, 246, 0.5)',
        '--gradient-hero': 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)'
      }
    },

    // Get current theme
    getCurrentTheme() {
      return this.currentTheme;
    },

    // Set theme
    setTheme(theme, save = true) {
      this.currentTheme = theme;
      const themeVars = this.themes[theme];

      if (theme === 'dark') {
        document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark');
      } else {
        document.documentElement.setAttribute(THEME_ATTRIBUTE, 'light');
      }

      // Apply CSS variables for smooth transition
      if (themeVars) {
        const root = document.documentElement;
        Object.entries(themeVars).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
      }

      if (save) {
        localStorage.setItem(STORAGE_KEY, theme);
      }

      this.updateThemeColor(theme);
      this.updateToggleButton(theme);
      this.announceThemeChange(theme);
    },

    // Toggle theme
    toggle() {
      const current = this.getCurrentTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
    },

    // Update browser theme-color meta tag
    updateThemeColor(theme) {
      const themeColorMeta = document.getElementById('theme-color-meta');
      if (themeColorMeta) {
        const color = this.themeColors[theme] || this.themeColors.dark;
        themeColorMeta.setAttribute('content', color);
      }
    },

    // Update toggle button icons
    updateToggleButton(theme) {
      const toggle = document.getElementById('theme-toggle');
      if (!toggle) return;

      const sunIcon = toggle.querySelector('.sun-icon');
      const moonIcon = toggle.querySelector('.moon-icon');

      if (theme === 'dark') {
        if (sunIcon) sunIcon.style.display = 'block';
        if (moonIcon) moonIcon.style.display = 'none';
        toggle.setAttribute('aria-label', 'Switch to light theme');
      } else {
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
        toggle.setAttribute('aria-label', 'Switch to dark theme');
      }
    },

    // Announce theme change to screen readers
    announceThemeChange(theme) {
      let announcement = document.getElementById('theme-announcement');
      if (!announcement) {
        announcement = document.createElement('div');
        announcement.id = 'theme-announcement';
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        document.body.appendChild(announcement);
      }

      const themeName = theme === 'dark' ? 'Dark' : 'Light';
      announcement.textContent = `${themeName} theme activated`;

      setTimeout(() => {
        announcement.textContent = '';
      }, 1000);
    },

    // Initialize
    init() {
      // Check localStorage first, default to dark theme
      const stored = localStorage.getItem(STORAGE_KEY);
      let theme;

      if (stored) {
        theme = stored;
      } else {
        // Default to dark theme for new visitors
        theme = 'dark';
      }

      this.setTheme(theme, false);

      // Listen for system theme changes
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          // Only auto-switch if user hasn't manually set preference
          if (!localStorage.getItem(STORAGE_KEY)) {
            this.setTheme(e.matches ? 'dark' : 'light', false);
          }
        });
      }

      // Bind toggle button
      const toggle = document.getElementById('theme-toggle');
      if (toggle) {
        toggle.addEventListener('click', () => this.toggle());
      }
    },

    // Get theme value (for external use)
    getTheme() {
      return this.getCurrentTheme();
    }
  };

  // Expose to global scope
  window.ThemeManager = ThemeManager;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
  } else {
    ThemeManager.init();
  }
})();
