/**
 * Main Application Module
 * KevinTen Personal Website - Core functionality
 * Uses centralized ObserverManager
 * @version 2.0.0
 */

(function() {
  'use strict';

  const App = {
    // Initialize application
    init() {
      this.initNavigation();
      this.initScrollEffects();
      this.initLazyLoading();
      this.initMobileMenu();
      this.initSmoothScroll();
      this.initAnimations();
    },

    // Navigation scroll effect
    initNavigation() {
      const header = document.querySelector('.nav-header');
      if (!header) return;

      let lastScroll = 0;
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const currentScroll = window.pageYOffset;

            // Add/remove scrolled class
            if (currentScroll > 50) {
              header.classList.add('scrolled');
            } else {
              header.classList.remove('scrolled');
            }

            // Hide/show on scroll direction (mobile)
            if (window.innerWidth < 768) {
              if (currentScroll > lastScroll && currentScroll > 100) {
                header.style.transform = 'translateY(-100%)';
              } else {
                header.style.transform = 'translateY(0)';
              }
            }

            lastScroll = currentScroll;
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    },

    // Scroll-triggered effects using ObserverManager
    initScrollEffects() {
      // Add animate-in class styles
      const style = document.createElement('style');
      style.textContent = `
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `;
      document.head.appendChild(style);

      // Wait for ObserverManager
      const initObserver = () => {
        if (!window.ObserverManager) {
          requestAnimationFrame(initObserver);
          return;
        }

        // Observe elements with animation classes
        const elements = document.querySelectorAll('.feature-card, .project-card, .article-item, .section-header');

        elements.forEach(el => {
          el.style.opacity = '0';
          el.style.transform = 'translateY(20px)';
          el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

          ObserverManager.observe('scrollAnimation', el, (target) => {
            target.classList.add('animate-in');
          });
        });
      };

      initObserver();
    },

    // Lazy loading for images using ObserverManager
    initLazyLoading() {
      // Check for native lazy loading support first
      const supportsLazyLoading = 'loading' in HTMLImageElement.prototype;

      if (supportsLazyLoading) {
        // Use native lazy loading for browsers that support it
        document.querySelectorAll('img[data-src]').forEach(img => {
          img.loading = 'lazy';
          img.src = img.dataset.src;
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
        });
        return;
      }

      // Fallback to IntersectionObserver via ObserverManager
      const initLazyLoadObserver = () => {
        if (!window.ObserverManager) {
          requestAnimationFrame(initLazyLoadObserver);
          return;
        }

        document.querySelectorAll('img[data-src]').forEach(img => {
          ObserverManager.observe('lazyLoad', img);
        });
      };

      initLazyLoadObserver();
    },

    // Mobile menu is now handled by mobile-nav.js module
    // This function is kept for compatibility but delegates to mobile-nav.js
    initMobileMenu() {
      // Check if mobile-nav.js has initialized
      if (window.MobileNav && window.MobileNav.init) {
        window.MobileNav.init();
        return;
      }

      // Fallback implementation
      const menuBtn = document.querySelector('.mobile-menu-btn');
      const mobileNav = document.querySelector('.mobile-nav');

      if (!menuBtn || !mobileNav) return;

      menuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        menuBtn.classList.toggle('active');

        const isOpen = mobileNav.classList.contains('active');
        menuBtn.setAttribute('aria-expanded', isOpen);

        // Prevent body scroll when menu is open
        if (isOpen) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      });

      // Close menu when clicking a link
      mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileNav.classList.remove('active');
          menuBtn.classList.remove('active');
          menuBtn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
    },

    // Smooth scroll for anchor links with active section tracking
    initSmoothScroll() {
      const headerOffset = 80; // Height of fixed header
      const sections = document.querySelectorAll('section[id]');

      // Update active nav link on scroll
      const updateActiveNav = () => {
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
          const sectionHeight = section.offsetHeight;
          const sectionTop = section.offsetTop - headerOffset - 20;
          const sectionId = section.getAttribute('id');
          const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

          if (navLink) {
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
              navLink.classList.add('active');
            } else {
              navLink.classList.remove('active');
            }
          }
        });
      };

      // Throttle scroll events
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateActiveNav();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      // Smooth scroll for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId === '#') return;

          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            e.preventDefault();

            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        });
      });
    },

    // Initialize animations using ObserverManager
    initAnimations() {
      const initWhenReady = () => {
        if (!window.ObserverManager) {
          requestAnimationFrame(initWhenReady);
          return;
        }

        // Typing effect for hero subtitle
        const typingElement = document.querySelector('.typing-text');
        if (typingElement) {
          this.initTypingEffect(typingElement);
        }

        // Counter animation for stats
        document.querySelectorAll('.counter').forEach(counter => {
          this.initCounterAnimation(counter);
        });
      };

      initWhenReady();
    },

    // Typing effect using ObserverManager
    initTypingEffect(element) {
      const text = element.dataset.text || element.textContent;
      const speed = parseInt(element.dataset.speed) || 100;

      element.textContent = '';
      element.classList.add('typing');

      let i = 0;
      const type = () => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          element.classList.remove('typing');
        }
      };

      // Start typing when element is visible
      ObserverManager.observe('typing', element, () => {
        setTimeout(type, 500);
      });
    },

    // Counter animation using ObserverManager
    initCounterAnimation(counter) {
      const target = parseInt(counter.dataset.target);
      const duration = parseInt(counter.dataset.duration) || 2000;

      ObserverManager.observe('counter', counter, (el) => {
        this.animateCounter(el, target, duration);
      });
    },

    animateCounter(element, target, duration) {
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;

      const updateCounter = () => {
        current += increment;
        if (current < target) {
          element.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target;
        }
      };

      updateCounter();
    },

    // Utility: Debounce function
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    // Utility: Throttle function
    throttle(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  };

  // Expose to global scope
  window.App = App;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})();
