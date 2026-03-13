/**
 * Data Visualization Animations
 * 技能进度条和数据统计动画
 * Uses centralized ObserverManager
 * @version 2.0.0
 */

(function() {
  'use strict';

  var DataViz = {
    init: function() {
      var self = this;

      function waitForObserver() {
        if (window.ObserverManager) {
          self.initSkillBars();
          self.initStatCounters();
        } else {
          requestAnimationFrame(waitForObserver);
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForObserver);
      } else {
        waitForObserver();
      }
    },

    initSkillBars: function() {
      var self = this;
      var skillBars = document.querySelectorAll('.skill-bar-cyber');
      if (skillBars.length === 0) return;

      skillBars.forEach(function(bar) {
        ObserverManager.observe('skillBar', bar, function(target) {
          self.animateSkillBar(target);
        });
      });
    },

    animateSkillBar: function(skillBar) {
      var skillLevel = skillBar.style.getPropertyValue('--skill-level');
      if (!skillLevel) return;

      var percentage = parseInt(skillLevel);
      var currentWidth = 0;
      var increment = percentage / 60;

      function animate() {
        if (currentWidth < percentage) {
          currentWidth += increment;
          if (currentWidth > percentage) currentWidth = percentage;
          skillBar.style.setProperty('--skill-level', currentWidth + '%');
          requestAnimationFrame(animate);
        }
      }

      animate();
    },

    initStatCounters: function() {
      var self = this;
      var counters = document.querySelectorAll('.stat-value[data-target]');
      if (counters.length === 0) return;

      counters.forEach(function(counter) {
        ObserverManager.observe('counter', counter, function(el) {
          self.animateCounter(el);
        });
      });
    },

    animateCounter: function(counter) {
      var target = parseInt(counter.dataset.target);
      var duration = 2000;
      var frameRate = 60;
      var totalFrames = (duration / 1000) * frameRate;
      var increment = target / totalFrames;

      var current = 0;
      var frame = 0;

      function animate() {
        if (frame < totalFrames) {
          current += increment;
          if (current > target) current = target;
          counter.textContent = Math.floor(current);
          frame++;
          requestAnimationFrame(animate);
        } else {
          counter.textContent = target;
        }
      }

      animate();
    }
  };

  DataViz.init();
  window.DataViz = DataViz;
})();
