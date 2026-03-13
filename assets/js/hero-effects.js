/**
 * Hero Section Effects
 * Particles background and social links interactions
 * @version 1.0.0
 */

(function() {
  'use strict';

  var HeroEffects = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,
    isActive: false,

    init: function() {
      this.initParticles();
      this.initSocialToggle();
      this.handleReducedMotion();
    },

    initParticles: function() {
      this.canvas = document.getElementById('hero-particles');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();

      var self = this;
      window.addEventListener('resize', function() {
        self.resizeCanvas();
      }, { passive: true });

      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      this.createParticles();
      this.startAnimation();
    },

    resizeCanvas: function() {
      if (!this.canvas) return;
      var hero = this.canvas.closest('.hero');
      this.canvas.width = hero.offsetWidth;
      this.canvas.height = hero.offsetHeight;
    },

    createParticles: function() {
      var count = window.innerWidth < 768 ? 15 : 25;
      this.particles = [];

      for (var i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
    },

    startAnimation: function() {
      this.isActive = true;
      this.animate();
    },

    animate: function() {
      if (!this.isActive || !this.ctx) return;

      var self = this;
      this.animationId = requestAnimationFrame(function() {
        self.animate();
      });

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Update and draw particles
      for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.canvas.height;
        if (p.y > this.canvas.height) p.y = 0;

        // Draw particle
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(99, 102, 241, ' + p.opacity + ')';
        this.ctx.fill();
      }

      // Draw connections
      this.drawConnections();
    },

    drawConnections: function() {
      var maxDistance = 100;
      var maxConnections = 3;

      for (var i = 0; i < this.particles.length; i++) {
        var connections = 0;
        for (var j = i + 1; j < this.particles.length; j++) {
          if (connections >= maxConnections) break;

          var dx = this.particles[i].x - this.particles[j].x;
          var dy = this.particles[i].y - this.particles[j].y;
          var distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            var opacity = (1 - distance / maxDistance) * 0.15;
            this.ctx.beginPath();
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.strokeStyle = 'rgba(99, 102, 241, ' + opacity + ')';
            this.ctx.stroke();
            connections++;
          }
        }
      }
    },

    stopAnimation: function() {
      this.isActive = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    },

    initSocialToggle: function() {
      var moreBtn = document.getElementById('social-more-btn');
      var expanded = document.getElementById('social-expanded');

      if (!moreBtn || !expanded) return;

      moreBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        expanded.classList.toggle('active');
      });

      document.addEventListener('click', function(e) {
        if (!expanded.contains(e.target) && e.target !== moreBtn) {
          expanded.classList.remove('active');
        }
      });
    },

    handleReducedMotion: function() {
      var mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      var self = this;

      if (mediaQuery.matches) {
        this.stopAnimation();
      }

      mediaQuery.addEventListener('change', function(e) {
        if (e.matches) {
          self.stopAnimation();
        } else {
          self.startAnimation();
        }
      });
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      HeroEffects.init();
    });
  } else {
    HeroEffects.init();
  }

  // Expose to global scope
  window.HeroEffects = HeroEffects;
})();
