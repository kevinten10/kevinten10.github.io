/**
 * Scroll Animations & Interactive Effects
 * Intersection Observer for scroll-triggered animations
 * @version 1.0.0
 */

(function() {
  'use strict';

  // Configuration
  const ANIMATION_THRESHOLD = 0.1;
  const ANIMATION_ROOT_MARGIN = '0px 0px -50px 0px';

  /**
   * Initialize scroll animations using Intersection Observer
   */
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (animatedElements.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: ANIMATION_ROOT_MARGIN,
      threshold: ANIMATION_THRESHOLD
    };

    // Track which elements become visible in the same batch
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add staggered delay based on existing stagger classes or index
          const delay = parseFloat(getComputedStyle(entry.target).transitionDelay) || 0;
          if (delay === 0) {
            entry.target.style.transitionDelay = `${index * 80}ms`;
          }
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));
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
   * Initialize counter animation for stats
   */
  function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-value[data-target]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.getAttribute('data-target'));
          const duration = 2000; // 2 seconds
          const step = target / (duration / 16); // 60 FPS
          let current = 0;

          const updateCounter = () => {
            current += step;
            if (current < target) {
              counter.textContent = Math.floor(current);
              requestAnimationFrame(updateCounter);
            } else {
              counter.textContent = target;
            }
          };

          updateCounter();
          observer.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  /**
   * Initialize parallax effects for hero elements
   */
  function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    if (parallaxElements.length === 0) return;

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
   * Initialize typing animation
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
          typingSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          textIndex = (textIndex + 1) % texts.length;
          typingSpeed = 500; // Pause before typing next
        }

        setTimeout(type, typingSpeed);
      }

      type();
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
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          initScrollAnimations();
          initNavScroll();
          initSmoothScroll();
          initCounterAnimation();
          initParallax();
          initTypingAnimation();
          addStaggerDelays();
        }, 100);
      });
    } else {
      setTimeout(() => {
        initScrollAnimations();
        initNavScroll();
        initSmoothScroll();
        initCounterAnimation();
        initParallax();
        initTypingAnimation();
        addStaggerDelays();
      }, 100);
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
