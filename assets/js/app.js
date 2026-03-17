/**
 * Main Application Module
 * KevinTen Personal Website - Core functionality
 * Uses centralized ObserverManager
 * @version 2.0.0
 */

(function() {
  'use strict';

  var App = {
    init: function() {
      this.initNavigation();
      this.initScrollEffects();
      this.initLazyLoading();
      this.initMobileMenu();
      this.initSmoothScroll();
      this.initAnimations();
    },

    initNavigation: function() {
      var header = document.querySelector('.nav-header');
      if (!header) return;

      var lastScroll = 0;
      var ticking = false;

      window.addEventListener('scroll', function() {
        if (!ticking) {
          window.requestAnimationFrame(function() {
            var currentScroll = window.pageYOffset;

            if (currentScroll > 50) {
              header.classList.add('scrolled');
            } else {
              header.classList.remove('scrolled');
            }

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

    initScrollEffects: function() {
      var style = document.createElement('style');
      style.textContent = '.animate-in { opacity: 1 !important; transform: translateY(0) !important; }';
      document.head.appendChild(style);

      function initObserver() {
        if (!window.ObserverManager) {
          requestAnimationFrame(initObserver);
          return;
        }

        var elements = document.querySelectorAll('.feature-card, .project-card, .article-item');
        elements.forEach(function(el) {
          el.style.opacity = '0';
          el.style.transform = 'translateY(20px)';
          el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

          ObserverManager.observe('scrollAnimation', el, function(target) {
            target.classList.add('animate-in');
          });
        });
      }

      initObserver();
    },

    initLazyLoading: function() {
      var supportsLazyLoading = 'loading' in HTMLImageElement.prototype;

      if (supportsLazyLoading) {
        document.querySelectorAll('img[data-src]').forEach(function(img) {
          img.loading = 'lazy';
          img.src = img.dataset.src;
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
        });
        return;
      }

      function initLazyLoadObserver() {
        if (!window.ObserverManager) {
          requestAnimationFrame(initLazyLoadObserver);
          return;
        }

        document.querySelectorAll('img[data-src]').forEach(function(img) {
          ObserverManager.observe('lazyLoad', img);
        });
      }

      initLazyLoadObserver();
    },

    initMobileMenu: function() {
      if (window.MobileNav && window.MobileNav.init) {
        window.MobileNav.init();
        return;
      }

      var menuBtn = document.querySelector('.mobile-menu-btn');
      var mobileNav = document.querySelector('.mobile-nav');

      if (!menuBtn || !mobileNav) return;

      menuBtn.addEventListener('click', function() {
        mobileNav.classList.toggle('active');
        menuBtn.classList.toggle('active');

        var isOpen = mobileNav.classList.contains('active');
        menuBtn.setAttribute('aria-expanded', isOpen);

        if (isOpen) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      });

      mobileNav.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
          mobileNav.classList.remove('active');
          menuBtn.classList.remove('active');
          menuBtn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
    },

    initSmoothScroll: function() {
      var headerOffset = 80;
      var sections = document.querySelectorAll('section[id]');

      function updateActiveNav() {
        var scrollY = window.pageYOffset;

        sections.forEach(function(section) {
          var sectionHeight = section.offsetHeight;
          var sectionTop = section.offsetTop - headerOffset - 20;
          var sectionId = section.getAttribute('id');
          var navLink = document.querySelector('.nav-link[href="#' + sectionId + '"]');

          if (navLink) {
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
              navLink.classList.add('active');
            } else {
              navLink.classList.remove('active');
            }
          }
        });
      }

      var ticking = false;
      window.addEventListener('scroll', function() {
        if (!ticking) {
          window.requestAnimationFrame(function() {
            updateActiveNav();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
          var targetId = anchor.getAttribute('href');
          if (targetId === '#') return;

          var targetElement = document.querySelector(targetId);
          if (targetElement) {
            e.preventDefault();

            var elementPosition = targetElement.getBoundingClientRect().top;
            var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        });
      });
    },

    initAnimations: function() {
      var self = this;

      function initWhenReady() {
        if (!window.ObserverManager) {
          requestAnimationFrame(initWhenReady);
          return;
        }

        var typingElement = document.querySelector('.typing-text');
        if (typingElement) {
          self.initTypingEffect(typingElement);
        }

        document.querySelectorAll('.counter').forEach(function(counter) {
          self.initCounterAnimation(counter);
        });
      }

      initWhenReady();
    },

    initTypingEffect: function(element) {
      var text = element.dataset.text || element.textContent;
      var speed = parseInt(element.dataset.speed) || 100;

      element.textContent = '';
      element.classList.add('typing');

      var i = 0;
      function type() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          element.classList.remove('typing');
        }
      }

      ObserverManager.observe('typing', element, function() {
        setTimeout(type, 500);
      });
    },

    initCounterAnimation: function(counter) {
      var target = parseInt(counter.dataset.target);
      var duration = parseInt(counter.dataset.duration) || 2000;

      ObserverManager.observe('counter', counter, function(el) {
        var start = 0;
        var increment = target / (duration / 16);
        var current = start;

        function updateCounter() {
          current += increment;
          if (current < target) {
            el.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
          } else {
            el.textContent = target;
          }
        }

        updateCounter();
      });
    },

    debounce: function(func, wait) {
      var timeout;
      return function() {
        var args = arguments;
        var later = function() {
          timeout = null;
          func.apply(null, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    throttle: function(func, limit) {
      var inThrottle;
      return function() {
        var args = arguments;
        if (!inThrottle) {
          func.apply(null, args);
          inThrottle = true;
          setTimeout(function() { inThrottle = false; }, limit);
        }
      };
    }
  };

  window.App = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { App.init(); });
  } else {
    App.init();
  }
})();
