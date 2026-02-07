/**
 * Tech Cursor Effect - Cyberpunk Style
 * 鼠标跟随和尾迹效果
 * @version 1.0.0
 */

(function() {
  'use strict';

  // Disable on touch devices
  if ('ontouchstart' in window) return;

  const config = {
    cursorSize: 20,
    trailSize: 8,
    trailCount: 5,
    trailInterval: 50
  };

  // Create main cursor
  const cursor = document.createElement('div');
  cursor.className = 'tech-cursor';
  document.body.appendChild(cursor);

  // Cursor position
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;
  let cursorVisible = true;

  // Trail array
  const trails = [];
  let trailCounter = 0;

  // Initialize
  function init() {
    // Create trail elements
    for (let i = 0; i < config.trailCount; i++) {
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.opacity = '0';
      document.body.appendChild(trail);
      trails.push({
        element: trail,
        x: cursorX,
        y: cursorY
      });
    }

    // Event listeners
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);

    // Hover effects for interactive elements
    addHoverEffects();

    // Start animation loop
    requestAnimationFrame(animate);
  }

  function onMouseMove(e) {
    cursorX = e.clientX;
    cursorY = e.clientY;
  }

  function onMouseDown() {
    cursor.classList.add('active');
  }

  function onMouseUp() {
    cursor.classList.remove('active');
  }

  function onMouseEnter() {
    cursorVisible = true;
  }

  function onMouseLeave() {
    cursorVisible = false;
  }

  function addHoverEffects() {
    const hoverElements = document.querySelectorAll('a, button, .btn, .card, .project-card, .nav-link');

    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
      });

      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
      });
    });
  }

  function animate() {
    // Update cursor position
    if (cursorVisible) {
      cursor.style.transform = `translate(${cursorX - config.cursorSize / 2}px, ${cursorY - config.cursorSize / 2}px)`;
      cursor.style.opacity = '1';
    } else {
      cursor.style.opacity = '0';
    }

    // Update trails
    updateTrails();

    requestAnimationFrame(animate);
  }

  function updateTrails() {
    // Shift trail positions
    for (let i = trails.length - 1; i > 0; i--) {
      trails[i].x = trails[i - 1].x;
      trails[i].y = trails[i - 1].y;
    }

    // Set first trail position
    trails[0].x = cursorX;
    trails[0].y = cursorY;

    // Update trail elements
    trails.forEach((trail, index) => {
      const delay = (index + 1) / trails.length;
      trail.element.style.transform = `translate(${trail.x - config.trailSize / 2}px, ${trail.y - config.trailSize / 2}px)`;
      trail.element.style.opacity = cursorVisible ? (0.6 - delay * 0.5) : '0';
    });
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose cleanup function
  window.TechCursor = {
    destroy() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
      cursor.remove();
      trails.forEach(t => t.element.remove());
    }
  };
})();
