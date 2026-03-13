/**
 * ObserverManager - Unified IntersectionObserver Management
 * Consolidates multiple observation patterns to reduce memory overhead
 * @version 1.0.0
 */

(function() {
  'use strict';

  /**
   * Shared observer configurations
   */
  const OBSERVER_CONFIGS = {
    // For scroll-triggered visibility animations
    scrollAnimation: {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    },
    // For lazy loading images (load earlier)
    lazyLoad: {
      root: null,
      rootMargin: '100px 0px',
      threshold: 0
    },
    // For counter animations (trigger when mostly visible)
    counter: {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.5
    },
    // For skill bar animations
    skillBar: {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.5
    },
    // For typing effect
    typing: {
      root: null,
      rootMargin: '0px',
      threshold: 0
    },
    // For counter animations (bento-interactions)
    counterAnimation: {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.5
    },
    // For nav active state tracking
    sectionTracking: {
      root: null,
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0
    }
  };

  /**
   * ObserverManager class
   * Manages shared IntersectionObserver instances
   */
  class ObserverManager {
    constructor() {
      this.observers = new Map();
      this.callbacks = new Map();
      this.destroyed = false;
      this.init();
    }

    /**
     * Initialize all shared observers
     */
    init() {
      // Create scroll animation observer (most common)
      this.createObserver('scrollAnimation', OBSERVER_CONFIGS.scrollAnimation, (entry, observer) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const callback = this.callbacks.get(target);
          if (callback) {
            callback(target);
            this.callbacks.delete(target);
          }
          observer.unobserve(target);
        }
      });

      // Create lazy load observer
      this.createObserver('lazyLoad', OBSERVER_CONFIGS.lazyLoad, (entry, observer) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          img.classList.add('loaded');
          img.removeAttribute('data-src');
          img.removeAttribute('data-srcset');
          observer.unobserve(img);
        }
      });

      // Create counter animation observer
      this.createObserver('counter', OBSERVER_CONFIGS.counter, (entry, observer) => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const callback = this.callbacks.get(counter);
          if (callback) {
            callback(counter);
            this.callbacks.delete(counter);
          }
          observer.unobserve(counter);
        }
      });

      // Create skill bar observer
      this.createObserver('skillBar', OBSERVER_CONFIGS.skillBar, (entry, observer) => {
        if (entry.isIntersecting) {
          const fill = entry.target;
          const targetWidth = fill.style.width;
          fill.style.width = '0';
          requestAnimationFrame(() => {
            setTimeout(() => {
              fill.style.width = targetWidth;
            }, 100);
          });
          observer.unobserve(fill);
        }
      });

      // Create typing effect observer
      this.createObserver('typing', OBSERVER_CONFIGS.typing, (entry, observer) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const callback = this.callbacks.get(element);
          if (callback) {
            callback(element);
            this.callbacks.delete(element);
          }
          observer.unobserve(element);
        }
      });

      // Create counter animation observer (for bento-interactions)
      this.createObserver('counterAnimation', OBSERVER_CONFIGS.counterAnimation, (entry, observer) => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const callback = this.callbacks.get(counter);
          if (callback) {
            callback(counter);
            this.callbacks.delete(counter);
          }
          observer.unobserve(counter);
        }
      });

      // Create section tracking observer (doesn't auto-unobserve)
      this.createObserver('sectionTracking', OBSERVER_CONFIGS.sectionTracking, (entry) => {
        const sectionId = entry.target.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        if (navLink) {
          if (entry.isIntersecting) {
            navLink.classList.add('active');
          } else {
            navLink.classList.remove('active');
          }
        }
      }, { autoUnobserve: false });
    }

    /**
     * Create a new observer with the given configuration
     * @param {string} name - Observer name
     * @param {Object} config - IntersectionObserver config
     * @param {Function} handler - Handler for intersection events
     * @param {Object} options - Additional options
     */
    createObserver(name, config, handler, options = { autoUnobserve: true }) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          handler(entry, observer);
        });
      }, config);

      this.observers.set(name, { observer, options });
    }

    /**
     * Observe an element with a named observer
     * @param {string} observerName - Name of the observer
     * @param {Element} element - Element to observe
     * @param {Function} callback - Optional callback when element intersects
     */
    observe(observerName, element, callback = null) {
      const observerData = this.observers.get(observerName);
      if (!observerData) {
        console.warn(`Observer "${observerName}" not found`);
        return;
      }

      if (callback) {
        this.callbacks.set(element, callback);
      }

      observerData.observer.observe(element);
    }

    /**
     * Observe multiple elements
     * @param {string} observerName - Name of the observer
     * @param {NodeList|Array} elements - Elements to observe
     * @param {Function} callback - Optional callback for each element
     */
    observeAll(observerName, elements, callback = null) {
      elements.forEach(element => {
        this.observe(observerName, element, callback);
      });
    }

    /**
     * Stop observing an element
     * @param {string} observerName - Name of the observer
     * @param {Element} element - Element to stop observing
     */
    unobserve(observerName, element) {
      const observerData = this.observers.get(observerName);
      if (observerData) {
        observerData.observer.unobserve(element);
        this.callbacks.delete(element);
      }
    }

    /**
     * Get a raw observer for custom use
     * @param {string} observerName - Name of the observer
     * @returns {IntersectionObserver|null}
     */
    getObserver(observerName) {
      const observerData = this.observers.get(observerName);
      return observerData ? observerData.observer : null;
    }

    /**
     * Destroy all observers and clean up
     */
    destroy() {
      this.observers.forEach(({ observer }) => {
        observer.disconnect();
      });
      this.observers.clear();
      this.callbacks.clear();
      this.destroyed = true;
    }

    /**
     * Check if reduced motion is preferred
     * @returns {boolean}
     */
    static prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  // Create singleton instance
  const instance = new ObserverManager();

  // Expose to global scope
  window.ObserverManager = instance;

  // Also expose the class for testing
  window.ObserverManagerClass = ObserverManager;

})();
