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
    var animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (animatedElements.length === 0) return;

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      animatedElements.forEach(function(el) { el.classList.add('is-visible'); });
      return;
    }

    animatedElements.forEach(function(el) {
      ObserverManager.observe('scrollAnimation', el, function(target) {
        target.classList.add('is-visible');
      });
    });
  }

  /**
   * Initialize navigation scroll effect
   */
  function initNavScroll() {
    var nav = document.querySelector('.nav-header');
    if (!nav) return;

    var ticking = false;

    function updateNav() {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      ticking = false;
    }

    window.addEventListener('scroll', function() {
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
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href === '#') return;

        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();

          var headerOffset = 100;
          var elementPosition = target.getBoundingClientRect().top;
          var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          history.pushState(null, null, href);
        }
      });
    });
  }

  /**
   * Initialize counter animation for stats
   */
  function initCounterAnimation() {
    var counters = document.querySelectorAll('.stat-value[data-target]');
    if (counters.length === 0) return;

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      counters.forEach(function(counter) {
        counter.textContent = counter.getAttribute('data-target');
      });
      return;
    }

    counters.forEach(function(counter) {
      ObserverManager.observe('counter', counter, function(el) {
        var target = parseInt(el.getAttribute('data-target'));
        var duration = 2000;
        var step = target / (duration / 16);
        var current = 0;

        function updateCounter() {
          current += step;
          if (current < target) {
            el.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
          } else {
            el.textContent = target;
          }
        }

        updateCounter();
      });
    });
  }

  /**
   * Initialize parallax effects for hero elements
   */
  function initParallax() {
    var parallaxElements = document.querySelectorAll('[data-parallax]');
    if (parallaxElements.length === 0) return;

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    var ticking = false;

    function updateParallax() {
      var scrolled = window.pageYOffset;

      parallaxElements.forEach(function(el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.5;
        var yPos = -(scrolled * speed);
        el.style.transform = 'translateY(' + yPos + 'px)';
      });

      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Initialize typing animation
   */
  function initTypingAnimation() {
    var typingElements = document.querySelectorAll('.typing-text[data-type]');

    typingElements.forEach(function(el) {
      var texts = JSON.parse(el.getAttribute('data-type'));
      var textIndex = 0;
      var charIndex = 0;
      var isDeleting = false;
      var typingSpeed = 100;

      function type() {
        var currentText = texts[textIndex];

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

      ObserverManager.observe('typing', el, function() {
        setTimeout(type, 500);
      });
    });
  }

  /**
   * Add stagger animation delays to child elements
   */
  function addStaggerDelays() {
    var staggerContainers = document.querySelectorAll('[data-stagger]');

    staggerContainers.forEach(function(container) {
      var children = container.children;
      var delayStart = parseFloat(container.getAttribute('data-stagger-start')) || 0;
      var delayIncrement = parseFloat(container.getAttribute('data-stagger')) || 100;

      Array.from(children).forEach(function(child, index) {
        child.style.transitionDelay = (delayStart + (index * delayIncrement)) + 'ms';
      });
    });
  }

  /**
   * Initialize all animations
   */
  function init() {
    function waitForObserver() {
      if (window.ObserverManager) {
        setTimeout(function() {
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
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForObserver);
    } else {
      waitForObserver();
    }
  }

  // Expose to global scope
  window.AnimationManager = {
    init: init,
    initScrollAnimations: initScrollAnimations,
    initNavScroll: initNavScroll,
    initSmoothScroll: initSmoothScroll
  };

  // Auto-initialize
  init();

})();
