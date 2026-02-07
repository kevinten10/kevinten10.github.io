/**
 * Mobile Navigation Module
 * Handles mobile menu toggle and interactions
 * @version 1.0.0
 */

(function() {
  'use strict';

  const MobileNav = {
    nav: null,
    toggleBtn: null,
    backdrop: null,
    closeBtn: null,
    links: null,
    isOpen: false,
    scrollPosition: 0,

    init() {
      this.nav = document.getElementById('mobile-nav');
      this.toggleBtn = document.querySelector('.mobile-menu-btn');
      this.backdrop = this.nav?.querySelector('.mobile-nav-backdrop');
      this.closeBtn = this.nav?.querySelector('.mobile-nav-close');
      this.links = this.nav?.querySelectorAll('.mobile-nav-link');

      if (!this.nav || !this.toggleBtn) return;

      this.bindEvents();
    },

    bindEvents() {
      // Toggle button
      this.toggleBtn.addEventListener('click', () => this.toggle());

      // Close button
      this.closeBtn?.addEventListener('click', () => this.close());

      // Backdrop
      this.backdrop?.addEventListener('click', () => this.close());

      // Navigation links
      this.links?.forEach(link => {
        link.addEventListener('click', () => this.close());
      });

      // Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });

      // Handle resize
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && this.isOpen) {
          this.close();
        }
      });
    },

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    open() {
      this.isOpen = true;

      // Store scroll position
      this.scrollPosition = window.pageYOffset;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollPosition}px`;
      document.body.style.width = '100%';

      // Show nav
      this.nav.classList.add('active');
      this.nav.setAttribute('aria-hidden', 'false');
      this.toggleBtn.classList.add('active');
      this.toggleBtn.setAttribute('aria-expanded', 'true');

      // Focus first link
      const firstLink = this.links?.[0];
      if (firstLink) {
        setTimeout(() => firstLink.focus(), 100);
      }
    },

    close() {
      this.isOpen = false;

      // Restore scroll position
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');
      window.scrollTo(0, this.scrollPosition);

      // Hide nav
      this.nav.classList.remove('active');
      this.nav.setAttribute('aria-hidden', 'true');
      this.toggleBtn.classList.remove('active');
      this.toggleBtn.setAttribute('aria-expanded', 'false');

      // Return focus to toggle button
      this.toggleBtn.focus();
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileNav.init());
  } else {
    MobileNav.init();
  }

  // Expose to global scope
  window.MobileNav = MobileNav;
})();
