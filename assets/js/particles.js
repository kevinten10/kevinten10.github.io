/**
 * Particle System - Lightweight CSS-based Animation
 * Pure CSS animations for maximum performance
 */

(function() {
  'use strict';

  const ParticleSystem = {
    container: null,
    isActive: false,

    init() {
      // Check browser support
      if (!this.isSupported()) return;

      // Skip on mobile or reduced motion preference
      if (this.isMobile() || this.prefersReducedMotion()) return;

      this.container = document.getElementById('particles');
      if (!this.container) return;

      this.createParticles();
      this.isActive = true;
    },

    isSupported() {
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    },

    isMobile() {
      return window.matchMedia('(max-width: 768px)').matches ||
             window.matchMedia('(pointer: coarse)').matches;
    },

    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    createParticles() {
      // Create 30 particle divs for CSS animation
      const fragment = document.createDocumentFragment();
      
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        fragment.appendChild(particle);
      }
      
      this.container.appendChild(fragment);
    },

    destroy() {
      if (this.container) {
        this.container.innerHTML = '';
      }
      this.isActive = false;
    }
  };

  // Expose to global scope
  window.ParticleSystem = ParticleSystem;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ParticleSystem.init());
  } else {
    ParticleSystem.init();
  }
})();
