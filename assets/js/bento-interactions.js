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
   */
  function initMouseTracking() {
    // Mouse-tracking gradient removed in UI modernization
  }

  /**
   * Skill bar animations using ObserverManager
   */
  function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-fill');
    if (skillBars.length === 0) return;

    skillBars.forEach(function(fill) {
      ObserverManager.observe('skillBar', fill);
    });
  }

  /**
   * Number counter animations using ObserverManager
   */
  function initNumberCounters() {
    const counters = document.querySelectorAll('.animate-number');
    if (counters.length === 0) return;

    counters.forEach(function(counter) {
      ObserverManager.observe('counter', counter, function(el) {
        const target = parseInt(el.dataset.value, 10);
        const duration = parseInt(el.dataset.duration, 10) || 2000;
        const suffix = el.dataset.suffix || '';
        const startTime = performance.now();

        function animate(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const currentValue = Math.floor(target * easeOutQuart);

          if (target >= 1000) {
            el.textContent = (currentValue / 1000).toFixed(1) + 'k' + suffix;
          } else {
            el.textContent = currentValue;
          }

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            if (target >= 1000) {
              el.textContent = (target / 1000).toFixed(1) + 'k' + suffix;
            } else {
              el.textContent = target;
            }
          }
        }

        requestAnimationFrame(animate);
      });
    });
  }

  /**
   * Scroll-triggered animations using ObserverManager
   */
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (animatedElements.length === 0) return;

    animatedElements.forEach(function(el) {
      ObserverManager.observe('scrollAnimation', el, function(target) {
        const staggerDelay = target.classList.contains('stagger-1') ? 0 :
                              target.classList.contains('stagger-2') ? 100 :
                              target.classList.contains('stagger-3') ? 200 :
                              target.classList.contains('stagger-4') ? 300 :
                              target.classList.contains('stagger-5') ? 400 : 0;

        setTimeout(function() {
          target.classList.add('is-visible');
        }, staggerDelay);
      });
    });
  }

  /**
   * Initialize all interactions
   */
  function init() {
    // Wait for ObserverManager to be available
    function waitForObserver() {
      if (window.ObserverManager) {
        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) {
          initMouseTracking();
          initSkillBars();
          initNumberCounters();
          initScrollAnimations();
        } else {
          // For reduced motion, immediately show all elements
          document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
            el.classList.add('is-visible');
          });
          document.querySelectorAll('.animate-number').forEach(function(counter) {
            var target = parseInt(counter.dataset.value, 10);
            var suffix = counter.dataset.suffix || '';
            counter.textContent = target >= 1000 ? (target / 1000).toFixed(1) + 'k' + suffix : target;
          });
        }
      } else {
        requestAnimationFrame(waitForObserver);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForObserver);
    } else {
      waitForObserver();
    }
  }

  // Initialize when DOM is ready
  init();

})();
