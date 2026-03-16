/**
 * Skill Galaxy - Interactive mouse-tracking effects
 * Spotlight follows cursor, proximity-based glow on nodes
 * @version 1.0.0
 */

(function() {
  'use strict';

  function init() {
    var galaxy = document.querySelector('.skill-galaxy');
    if (!galaxy) return;

    // Mouse spotlight tracking
    galaxy.addEventListener('mousemove', function(e) {
      var rect = galaxy.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      galaxy.style.setProperty('--mx', x + '%');
      galaxy.style.setProperty('--my', y + '%');
    });

    // Scroll-triggered stagger reveal
    var nodes = galaxy.querySelectorAll('.skill-node');
    if (!nodes.length) return;

    // Initially hide nodes for reveal animation
    nodes.forEach(function(node) {
      node.style.opacity = '0';
      node.style.transform = 'scale(0.6) translateY(20px)';
    });

    var revealed = false;

    function revealNodes() {
      if (revealed) return;
      var rect = galaxy.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        revealed = true;
        nodes.forEach(function(node, i) {
          setTimeout(function() {
            node.style.transition = 'opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            node.style.opacity = '';
            node.style.transform = '';
          }, i * 40);
        });
        window.removeEventListener('scroll', revealNodes);
      }
    }

    window.addEventListener('scroll', revealNodes, { passive: true });
    // Check immediately in case already in view
    revealNodes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
