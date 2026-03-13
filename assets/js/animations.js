/**
 * Scroll Animations & Interactive Effects
 * Uses centralized ObserverManager for scroll-triggered animations
 * @version 2.0.0
 */

(function() {
  'use strict';

  /**
   * Initialize scroll animations using ObserverManager
   */
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (animatedElements.length === 0) return;

    // Check for reduced motion preference
    if (ObserverManager.prefersReducedMotion()) {
      animatedElements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    animatedElements.forEach((el, index) => {
      ObserverManager.observe('scrollAnimation', el, (target) => {
        // Add staggered delay based on existing stagger classes or index
        const delay = parseFloat(getComputedStyle(target).transitionDelay) || 0;
        if (delay === 0) {
          target.style.transitionDelay = `${index * 80}ms`;
        }
        target.classList.add('is-visible');
      });
    });
  }

  /**
   * Initialize navigation scroll effect
   * Adds 'scrolled' class when page is scrolled
   */
  function initNavScroll() {
    const nav = document.querySelector('.nav-header');
    if (!nav) return;

    let ticking = false;

    function updateNav() {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNav);
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Initialize smooth scroll for anchor links
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();

          const headerOffset = 100;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Update URL hash without jumping
          history.pushState(null, null, href);
        }
      });
    });
  }

  /**
   * Initialize counter animation for stats using ObserverManager
   */
  function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-value[data-target]');

    if (ObserverManager.prefersReducedMotion()) {
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        counter.textContent = target;
      });
      return;
    }

    counters.forEach(counter => {
      ObserverManager.observe('counter', counter, (el) => {
        const target = parseInt(el.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
          current += step;
          if (current < target) {
            el.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
          } else {
            el.textContent = target;
          }
        };

        updateCounter();
      });
    });
  }

  /**
   * Initialize parallax effects for hero elements
   */
  function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    if (parallaxElements.length === 0) return;
    if (ObserverManager.prefersReducedMotion()) return;

    let ticking = false;

    function updateParallax() {
      const scrolled = window.pageYOffset;

      parallaxElements.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.5;
        const yPos = -(scrolled * speed);
        el.style.transform = `translateY(${yPos}px)`;
      });

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Initialize typing animation using ObserverManager
   */
  function initTypingAnimation() {
    const typingElements = document.querySelectorAll('.typing-text[data-type]');

    typingElements.forEach(el => {
      const texts = JSON.parse(el.getAttribute('data-type'));
      let textIndex = 0;
      let charIndex = 0;
      let isDeleting = false;
      let typingSpeed = 100;

      function type() {
        const currentText = texts[textIndex];

        if (isDeleting) {
          el.textContent = currentText.substring(0, charIndex - 1);
          charIndex--;
          typingSpeed = 50;
        } else {
          el.textContent = currentText.substring(0, charIndex + 1);
          charIndex++;
          typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentText.length) {
          isDeleting = true;
          typingSpeed = 2000;
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          textIndex = (textIndex + 1) % texts.length;
          typingSpeed = 500;
        }

        setTimeout(type, typingSpeed);
      }

      // Start typing when visible
      ObserverManager.observe('typing', el, () => {
        setTimeout(type, 500);
      });
    });
  }

  /**
   * Add stagger animation delays to child elements
   */
  function addStaggerDelays() {
    const staggerContainers = document.querySelectorAll('[data-stagger]');

    staggerContainers.forEach(container => {
      const children = container.children;
      const delayStart = parseFloat(container.getAttribute('data-stagger-start')) || 0;
      const delayIncrement = parseFloat(container.getAttribute('data-stagger')) || 100;

      Array.from(children).forEach((child, index) => {
        child.style.transitionDelay = `${delayStart + (index * delayIncrement)}ms`;
      });
    });
  }

  /**
   * Initialize all animations
   */
  function init() {
    // Wait for ObserverManager to be available
    const waitForObserver = () => {
      if (window.ObserverManager) {
        setTimeout(() => {
          initScrollAnimations();
          initNavScroll();
          initSmoothScroll();
          initCounterAnimation();
          initParallax();
          initTypingAnimation();
          addStaggerDelays();
        }, 100);
      } else {
        requestAnimationFrame(waitForObserver);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForObserver);
    } else {
      waitForObserver();
    }
  }

  // Expose to global scope
  window.AnimationManager = {
    init,
    initScrollAnimations,
    initNavScroll,
    initSmoothScroll
  };

  // Auto-initialize
  init();

})();
