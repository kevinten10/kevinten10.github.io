/**
 * Gallery Component
 * 图片相册功能 - 分类过滤和 Lightbox
 * @version 1.1.0
 */

(function() {
  'use strict';

  const Gallery = {
    filterBtns: null,
    galleryItems: null,
    lightbox: null,
    lightboxImg: null,
    lightboxClose: null,
    triggerElement: null,
    boundHandlers: [],

    init() {
      this.filterBtns = document.querySelectorAll('.filter-btn');
      this.galleryItems = document.querySelectorAll('.gallery-item');

      this.initGalleryFilter();
      this.initLightbox();
    },

    /**
     * Bind event with cleanup tracking
     */
    bindEvent(element, event, handler) {
      if (!element) return;
      element.addEventListener(event, handler);
      this.boundHandlers.push({ element, event, handler });
    },

    /**
     * Gallery filter functionality
     */
    initGalleryFilter() {
      this.filterBtns.forEach(btn => {
        this.bindEvent(btn, 'click', () => {
          // Remove active class from all buttons
          this.filterBtns.forEach(b => b.classList.remove('active'));
          // Add active class to clicked button
          btn.classList.add('active');

          const filter = btn.dataset.filter;

          // Filter items
          this.galleryItems.forEach(item => {
            if (filter === 'all' || item.dataset.category === filter) {
              item.classList.remove('hidden');
            } else {
              item.classList.add('hidden');
            }
          });
        });
      });
    },

    /**
     * Lightbox functionality
     */
    initLightbox() {
      // Create lightbox element
      this.lightbox = document.createElement('div');
      this.lightbox.className = 'lightbox';
      this.lightbox.innerHTML = `
        <div class="lightbox-content">
          <button class="lightbox-close" aria-label="关闭">&times;</button>
          <img src="" alt="">
        </div>
      `;
      document.body.appendChild(this.lightbox);

      this.lightboxImg = this.lightbox.querySelector('img');
      this.lightboxClose = this.lightbox.querySelector('.lightbox-close');

      // Add click events to gallery items
      this.galleryItems.forEach(item => {
        this.bindEvent(item, 'click', () => {
          this.triggerElement = item;
          const img = item.querySelector('img');
          this.lightboxImg.src = img.src;
          this.lightboxImg.alt = img.alt;
          this.lightbox.classList.add('active');
          document.body.style.overflow = 'hidden';
          this.lightboxClose.focus();
        });
      });

      // Close lightbox events
      this.bindEvent(this.lightboxClose, 'click', () => this.closeLightbox());
      this.bindEvent(this.lightbox, 'click', (e) => {
        if (e.target === this.lightbox) {
          this.closeLightbox();
        }
      });

      // Close on Escape key and trap focus
      this.keydownHandler = (e) => {
        if (!this.lightbox.classList.contains('active')) return;

        if (e.key === 'Escape') {
          this.closeLightbox();
        } else if (e.key === 'Tab') {
          // Trap focus within lightbox - only close button is focusable
          e.preventDefault();
          this.lightboxClose.focus();
        }
      };
      this.bindEvent(document, 'keydown', this.keydownHandler);
    },

    closeLightbox() {
      this.lightbox.classList.remove('active');
      document.body.style.overflow = '';
      if (this.triggerElement) {
        this.triggerElement.focus();
        this.triggerElement = null;
      }
    },

    /**
     * Cleanup event listeners on page unload
     */
    destroy() {
      this.boundHandlers.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.boundHandlers = [];
      this.closeLightbox();

      // Remove lightbox from DOM
      if (this.lightbox && this.lightbox.parentNode) {
        this.lightbox.parentNode.removeChild(this.lightbox);
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Gallery.init());
  } else {
    Gallery.init();
  }

  // Expose to global scope
  window.Gallery = Gallery;

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => Gallery.destroy());
})();
