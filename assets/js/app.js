/**
 * Main Application Module
 * KevinTen Personal Website - Core functionality
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
      
      window.addEventListener('scroll', () => {
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
      }, { passive: true });
    },

    // Scroll-triggered effects
    initScrollEffects() {
      // Intersection Observer for fade-in animations
      const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      // Observe elements with animation classes
      document.querySelectorAll('.feature-card, .project-card, .article-item, .section-header').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
      });

      // Add animate-in class styles
      const style = document.createElement('style');
      style.textContent = `
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `;
      document.head.appendChild(style);
    },

    // Lazy loading for images
    initLazyLoading() {
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              
              // Handle srcset
              if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
              }
              
              // Handle src
              if (img.dataset.src) {
                img.src = img.dataset.src;
              }
              
              img.classList.add('loaded');
              img.removeAttribute('data-src');
              img.removeAttribute('data-srcset');
              
              imageObserver.unobserve(img);
            }
          });
        }, {
          rootMargin: '50px 0px'
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
      } else {
        // Fallback: load all images immediately
        document.querySelectorAll('img[data-src]').forEach(img => {
          img.src = img.dataset.src;
        });
      }
    },

    // Mobile menu toggle
    initMobileMenu() {
      const menuBtn = document.querySelector('.nav-menu-btn');
      const mobileNav = document.querySelector('.mobile-nav');
      
      if (!menuBtn || !mobileNav) return;

      menuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        menuBtn.classList.toggle('active');
        
        const isOpen = mobileNav.classList.contains('active');
        menuBtn.setAttribute('aria-expanded', isOpen);
      });

      // Close menu when clicking a link
      mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileNav.classList.remove('active');
          menuBtn.classList.remove('active');
          menuBtn.setAttribute('aria-expanded', 'false');
        });
      });
    },

    // Smooth scroll for anchor links
    initSmoothScroll() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId === '#') return;
          
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            e.preventDefault();
            
            const headerOffset = 80;
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

    // Initialize animations
    initAnimations() {
      // Typing effect for hero subtitle
      const typingElement = document.querySelector('.typing-text');
      if (typingElement) {
        this.initTypingEffect(typingElement);
      }

      // Counter animation for stats
      document.querySelectorAll('.counter').forEach(counter => {
        this.initCounterAnimation(counter);
      });
    },

    // Typing effect
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
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(type, 500);
            observer.unobserve(element);
          }
        });
      });
      
      observer.observe(element);
    },

    // Counter animation
    initCounterAnimation(counter) {
      const target = parseInt(counter.dataset.target);
      const duration = parseInt(counter.dataset.duration) || 2000;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(counter, target, duration);
            observer.unobserve(counter);
          }
        });
      });
      
      observer.observe(counter);
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
