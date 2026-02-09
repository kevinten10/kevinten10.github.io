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
        '--color-text-secondary': '#334155',
        '--color-text-muted': '#475569',
        '--color-text-subtle': '#94A3B8',
        '--color-border': '#E2E8F0',
        '--color-border-light': '#CBD5E1',
        '--gradient-hero': 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
        '--gradient-card': 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
        '--gradient-subtle': 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 100%)',
        '--glass-bg': 'rgba(255, 255, 255, 0.7)',
        '--glass-border': 'rgba(0, 0, 0, 0.08)',
        '--glass-shadow': '0 4px 20px rgba(0, 0, 0, 0.08)',
        '--bento-shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        '--bento-shadow-md': '0 4px 16px rgba(0, 0, 0, 0.06)',
        '--bento-shadow-hover': '0 8px 24px rgba(0, 0, 0, 0.1)',
        '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
        '--shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
        '--shadow-2xl': '0 25px 50px -12px rgb(0 0 0 / 0.1)',
        '--shadow-inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        '--shadow-glow': '0 0 20px rgba(37, 99, 235, 0.2)'
      },
      dark: {
        '--color-bg': '#000000',
        '--color-bg-secondary': '#18181B',
        '--color-bg-tertiary': '#27272A',
        '--color-bg-card': '#18181B',
        '--color-text': '#FAFAFA',
        '--color-text-secondary': '#A1A1AA',
        '--color-text-muted': '#71717A',
        '--color-text-subtle': '#52525B',
        '--color-border': '#3F3F46',
        '--color-border-light': '#52525B',
        '--gradient-hero': 'linear-gradient(135deg, #000000 0%, #0A0A0A 50%, #111111 100%)',
        '--gradient-card': 'linear-gradient(145deg, rgba(24, 24, 27, 0.9) 0%, rgba(15, 15, 17, 0.95) 100%)',
        '--gradient-subtle': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
        '--glass-bg': 'rgba(24, 24, 27, 0.7)',
        '--glass-border': 'rgba(255, 255, 255, 0.06)',
        '--glass-shadow': '0 4px 20px rgba(0, 0, 0, 0.15)',
        '--bento-shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.05)',
        '--bento-shadow-md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        '--bento-shadow-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.3)',
        '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
        '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
        '--shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
        '--shadow-2xl': '0 25px 50px -12px rgb(0 0 0 / 0.6)',
        '--shadow-inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.3)',
        '--shadow-glow': '0 0 20px rgba(37, 99, 235, 0.3)'
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
