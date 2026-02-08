/**
 * Bento Grid Interactions
 * Mouse tracking, skill bar animations, number counters
 */

(function() {
  'use strict';

  /**
   * Mouse tracking for hover effects
   * Tracks mouse position on cards for radial gradient effect
   */
  function initMouseTracking() {
    const cards = document.querySelectorAll('.bento-item, .impact-metric');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mouse-x', `50%`);
        card.style.setProperty('--mouse-y', `50%`);
      });
    });
  }

  /**
   * Skill bar animations
   * Animates skill bars to their target width when visible
   */
  function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-fill');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target;
          const targetWidth = fill.style.width;

          // Reset to 0 first
          fill.style.width = '0';

          // Animate to target width
          requestAnimationFrame(() => {
            setTimeout(() => {
              fill.style.width = targetWidth;
            }, 100);
          });

          observer.unobserve(fill);
        }
      });
    }, {
      threshold: 0.5,
      rootMargin: '0px 0px -50px 0px'
    });

    skillBars.forEach(bar => observer.observe(bar));
  }

  /**
   * Number counter animations
   * Animates numbers from 0 to target value
   */
  function initNumberCounters() {
    const counters = document.querySelectorAll('.animate-number');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.dataset.value, 10);
          const duration = parseInt(counter.dataset.duration, 10) || 2000;
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
              counter.textContent = (currentValue / 1000).toFixed(1) + 'k';
            } else {
              counter.textContent = currentValue;
            }

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              // Ensure final value is exact
              if (target >= 1000) {
                counter.textContent = (target / 1000).toFixed(1) + 'k';
              } else {
                counter.textContent = target;
              }
            }
          };

          requestAnimationFrame(animate);
          observer.unobserve(counter);
        }
      });
    }, {
      threshold: 0.5,
      rootMargin: '0px 0px -50px 0px'
    });

    counters.forEach(counter => observer.observe(counter));
  }

  /**
   * Scroll-triggered animations
   * Adds is-visible class when elements come into view
   */
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Small delay for stagger effect
          const staggerDelay = entry.target.classList.contains('stagger-1') ? 0 :
                              entry.target.classList.contains('stagger-2') ? 100 :
                              entry.target.classList.contains('stagger-3') ? 200 :
                              entry.target.classList.contains('stagger-4') ? 300 :
                              entry.target.classList.contains('stagger-5') ? 400 : 0;

          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, staggerDelay);

          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  }

  /**
   * Initialize all interactions
   */
  function init() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
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
        fill.style.width = fill.style.width;
      });
      document.querySelectorAll('.animate-number').forEach(counter => {
        const target = parseInt(counter.dataset.value, 10);
        counter.textContent = target >= 1000 ? (target / 1000).toFixed(1) + 'k' : target;
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-initialize on reduced motion change
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
    // Reload to apply changes
    location.reload();
  });

})();
