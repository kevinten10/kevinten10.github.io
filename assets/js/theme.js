/**
 * Theme Manager - Dark/Light mode toggle
 * Supports system preference and manual override
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'kevinten-theme';
  const THEME_ATTRIBUTE = 'data-theme';

  // Theme manager object
  const ThemeManager = {
    // Get current theme
    getCurrentTheme() {
      // Check localStorage first
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return stored;
      }
      
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      
      return 'light';
    },

    // Set theme
    setTheme(theme) {
      if (theme === 'dark') {
        document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark');
      } else {
        document.documentElement.setAttribute(THEME_ATTRIBUTE, 'light');
      }
      localStorage.setItem(STORAGE_KEY, theme);
      this.updateToggleIcon(theme);
    },

    // Toggle theme
    toggle() {
      const current = this.getCurrentTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
    },

    // Update toggle button icon
    updateToggleIcon(theme) {
      const toggle = document.querySelector('.theme-toggle');
      if (!toggle) return;

      const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
      
      const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

      toggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
      toggle.setAttribute('aria-label', theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式');
    },

    // Initialize
    init() {
      // Set initial theme
      const theme = this.getCurrentTheme();
      this.setTheme(theme);

      // Listen for system theme changes
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          // Only auto-switch if user hasn't manually set preference
          if (!localStorage.getItem(STORAGE_KEY)) {
            this.setTheme(e.matches ? 'dark' : 'light');
          }
        });
      }

      // Bind toggle button
      const toggle = document.querySelector('.theme-toggle');
      if (toggle) {
        toggle.addEventListener('click', () => this.toggle());
      }
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
