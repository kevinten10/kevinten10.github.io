/**
 * Data Visualization Animations
 * 技能进度条和数据统计动画
 * Uses centralized ObserverManager
 * @version 2.0.0
 */

(function() {
  'use strict';

  const DataViz = {
    init() {
      // Wait for ObserverManager to be available
      const waitForObserver = () => {
        if (window.ObserverManager) {
          this.initSkillBars();
          this.initStatCounters();
        } else {
          requestAnimationFrame(waitForObserver);
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForObserver);
      } else {
        waitForObserver();
      }
    },

    // Initialize skill progress bars using ObserverManager
    initSkillBars() {
      const skillBars = document.querySelectorAll('.skill-bar-cyber');

      if (ObserverManager.prefersReducedMotion()) {
        // For reduced motion, keep static state
        return;
      }

      skillBars.forEach(bar => {
        ObserverManager.observe('skillBar', bar, (target) => {
          this.animateSkillBar(target);
        });
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

    // Initialize stat counters using ObserverManager
    initStatCounters() {
      const counters = document.querySelectorAll('.stat-value[data-target]');

      if (ObserverManager.prefersReducedMotion()) {
        counters.forEach(counter => {
          counter.textContent = counter.dataset.target;
        });
        return;
      }

      counters.forEach(counter => {
        ObserverManager.observe('counter', counter, (el) => {
          this.animateCounter(el);
        });
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
    }
  };

  // Auto-initialize when DOM is ready
  DataViz.init();

  // Expose to global scope
  window.DataViz = DataViz;
})();
