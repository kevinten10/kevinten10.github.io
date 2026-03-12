/**
 * Data Visualization Animations
 * 技能进度条和数据统计动画
 * @version 1.0.0
 */

(function() {
  'use strict';

  const DataViz = {
    init() {
      this.initSkillBars();
      this.initStatCounters();
      // initNumberAnimations removed: handled by bento-interactions.js initNumberCounters
    },

    // Initialize skill progress bars
    initSkillBars() {
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.5
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateSkillBar(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      document.querySelectorAll('.skill-bar-cyber').forEach(bar => {
        observer.observe(bar);
      });
    },

    animateSkillBar(skillBar) {
      // Get skill level from CSS variable
      const skillLevel = skillBar.style.getPropertyValue('--skill-level');
      if (!skillLevel) return;

      // Parse the percentage
      const percentage = parseInt(skillLevel);

      // Animate the bar
      let currentWidth = 0;
      const increment = percentage / 60; // 60 frames for smooth animation

      const animate = () => {
        if (currentWidth < percentage) {
          currentWidth += increment;
          if (currentWidth > percentage) currentWidth = percentage;
          skillBar.style.setProperty('--skill-level', `${currentWidth}%`);
          requestAnimationFrame(animate);
        }
      };

      animate();
    },

    // Initialize stat counters
    initStatCounters() {
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.5
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      document.querySelectorAll('.stat-value').forEach(counter => {
        if (counter.dataset.target) {
          observer.observe(counter);
        }
      });
    },

    animateCounter(counter) {
      const target = parseInt(counter.dataset.target);
      const duration = 2000; // 2 seconds
      const frameRate = 60;
      const totalFrames = (duration / 1000) * frameRate;
      const increment = target / totalFrames;

      let current = 0;
      let frame = 0;

      const animate = () => {
        if (frame < totalFrames) {
          current += increment;
          if (current > target) current = target;
          counter.textContent = Math.floor(current);
          frame++;
          requestAnimationFrame(animate);
        } else {
          counter.textContent = target;
        }
      };

      animate();
    },

    // Initialize number animations
    initNumberAnimations() {
      const numberElements = document.querySelectorAll('.animate-number');

      numberElements.forEach(el => {
        const finalValue = parseInt(el.dataset.value) || 0;
        const duration = parseInt(el.dataset.duration) || 2000;

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.animateNumber(el, finalValue, duration);
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.5 });

        observer.observe(el);
      });
    },

    animateNumber(element, finalValue, duration) {
      const startTime = performance.now();
      const startValue = 0;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (finalValue - startValue) * easeOutQuart;

        element.textContent = Math.floor(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.textContent = finalValue;
        }
      };

      requestAnimationFrame(animate);
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DataViz.init());
  } else {
    DataViz.init();
  }

  // Expose to global scope
  window.DataViz = DataViz;
})();
