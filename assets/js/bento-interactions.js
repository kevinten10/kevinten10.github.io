/**
 * Bento Grid Interactions
 * Mouse tracking, skill bar animations, number counters
 * Uses centralized ObserverManager
 * @version 2.0.0
 */

(function() {
  'use strict';

  /**
   * Mouse tracking for hover effects
   * Tracks mouse position on cards for radial gradient effect
   */
  function initMouseTracking() {
    // Mouse-tracking gradient removed in UI modernization
  }

  /**
   * Skill bar animations using ObserverManager
   * Animates skill bars to their target width when visible
   */
  function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-fill');

    if (ObserverManager.prefersReducedMotion()) {
      // Keep target width for reduced motion
      return;
    }

    skillBars.forEach(fill => {
      ObserverManager.observe('skillBar', fill);
    });
  }

  /**
   * Number counter animations using ObserverManager
   * Animates numbers from 0 to target value
   */
  function initNumberCounters() {
    const counters = document.querySelectorAll('.animate-number');

    if (ObserverManager.prefersReducedMotion()) {
      counters.forEach(counter => {
        const target = parseInt(counter.dataset.value, 10);
        const suffix = counter.dataset.suffix || '';
        counter.textContent = target >= 1000 ? (target / 1000).toFixed(1) + 'k' + suffix : target;
      });
      return;
    }

    counters.forEach(counter => {
      ObserverManager.observe('counter', counter, (el) => {
        const target = parseInt(el.dataset.value, 10);
        const duration = parseInt(el.dataset.duration, 10) || 2000;
        const suffix = el.dataset.suffix || '';
        const startTime = performance.now();
        const startValue = 0;

        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function for smooth animation
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart);

          // Format number with K suffix for large values
          if (target >= 1000) {
            el.textContent = (currentValue / 1000).toFixed(1) + 'k' + suffix;
          } else {
            el.textContent = currentValue;
          }

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Ensure final value is exact
            if (target >= 1000) {
              el.textContent = (target / 1000).toFixed(1) + 'k' + suffix;
            } else {
              el.textContent = target;
            }
          }
        };

        requestAnimationFrame(animate);
      });
    });
  }

  /**
   * Scroll-triggered animations using ObserverManager
   * Adds is-visible class when elements come into view
   */
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (ObserverManager.prefersReducedMotion()) {
      animatedElements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    animatedElements.forEach(el => {
      ObserverManager.observe('scrollAnimation', el, (target) => {
        // Small delay for stagger effect
        const staggerDelay = target.classList.contains('stagger-1') ? 0 :
                              target.classList.contains('stagger-2') ? 100 :
                              target.classList.contains('stagger-3') ? 200 :
                              target.classList.contains('stagger-4') ? 300 :
                              target.classList.contains('stagger-5') ? 400 : 0;

        setTimeout(() => {
          target.classList.add('is-visible');
        }, staggerDelay);
      });
    });
  }

  /**
   * Handle reduced motion preference changes without reload
   */
  function handleReducedMotionChange(e) {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    const counters = document.querySelectorAll('.animate-number');

    if (e.matches) {
      // Reduced motion enabled - show everything immediately
      animatedElements.forEach(el => el.classList.add('is-visible'));
      counters.forEach(counter => {
        const target = parseInt(counter.dataset.value, 10);
        const suffix = counter.dataset.suffix || '';
        counter.textContent = target >= 1000 ? (target / 1000).toFixed(1) + 'k' + suffix : target;
      });
    }
  }

  /**
   * Initialize all interactions
   */
  function init() {
    // Wait for ObserverManager to be available
    const waitForObserver = () => {
      if (window.ObserverManager) {
        if (!ObserverManager.prefersReducedMotion()) {
          initMouseTracking();
          initSkillBars();
          initNumberCounters();
          initScrollAnimations();
        } else {
          // For reduced motion, immediately show all elements
          document.querySelectorAll('.animate-on-scroll').forEach(el => {
            el.classList.add('is-visible');
          });
          document.querySelectorAll('.skill-fill').forEach(fill => {
            // Keep target width
          });
          document.querySelectorAll('.animate-number').forEach(counter => {
            const target = parseInt(counter.dataset.value, 10);
            const suffix = counter.dataset.suffix || '';
            counter.textContent = target >= 1000 ? (target / 1000).toFixed(1) + 'k' + suffix : target;
          });
        }
      } else {
        requestAnimationFrame(waitForObserver);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForObserver);
    } else {
      waitForObserver();
    }

    // Handle reduced motion preference changes without reload
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', handleReducedMotionChange);
  }

  // Initialize when DOM is ready
  init();

})();
