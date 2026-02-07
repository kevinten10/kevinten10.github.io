/**
 * Project Modal Module
 * Handles project quick-view modal functionality
 * @version 1.1.0
 */

(function() {
  'use strict';

  const ProjectModal = {
    modal: null,
    backdrop: null,
    closeBtn: null,
    activeProject: null,
    previousFocus: null,
    focusableElements: null,
    boundHandlers: [],

    // Project data
    projects: {
      capa: {
        title: 'Capa',
        description: 'Mecha SDK of Cloud Application API. 实现 "write once, run anywhere"，让Java应用具备跨云和混合云能力。Capa 提供统一的云服务调用接口，支持多云部署、服务发现、配置管理等核心功能。',
        language: 'Java',
        languageColor: 'var(--color-java)',
        stars: 14,
        forks: 9,
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
        techStack: ['Java', 'Spring Boot', 'Multi-Cloud', 'Service Mesh', 'Distributed Systems'],
        repoUrl: 'https://github.com/kevinten10/Capa',
        demoUrl: null
      },
      vrml: {
        title: 'Vrml',
        description: '高级抽象API库，用于应用运行时。目标是迁移到cloud-runtimes，成为标准API的实现部分。Vrml 提供了一套简洁优雅的API，帮助开发者快速构建云原生应用。',
        language: 'Java',
        languageColor: 'var(--color-java)',
        stars: 19,
        forks: 4,
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
        techStack: ['Java', 'Cloud Native', 'Runtime', 'API Design'],
        repoUrl: 'https://github.com/kevinten10/Vrml',
        demoUrl: null
      },
      dubbo: {
        title: 'Apache Dubbo',
        description: 'Apache Dubbo的Java实现。一个高性能的RPC和微服务框架，被广泛应用于大规模分布式系统。Dubbo 提供了服务自动发现、负载均衡、容错机制等功能，是构建微服务架构的理想选择。',
        language: 'Java',
        languageColor: 'var(--color-java)',
        stars: '41.7k',
        forks: '26.6k',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
        techStack: ['Java', 'RPC', 'Microservices', 'High Performance', 'Distributed Systems'],
        repoUrl: 'https://github.com/apache/dubbo',
        demoUrl: null,
        contributor: true
      },
      dapr: {
        title: 'Dapr',
        description: '可移植的运行时，用于构建跨云和边缘的分布式应用，结合事件驱动架构与工作流编排。Dapr 提供了最佳实践的构建模块，如状态管理、服务调用、发布/订阅等。',
        language: 'Go',
        languageColor: 'var(--color-go)',
        stars: '25.5k',
        forks: '2k',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        techStack: ['Go', 'Distributed Systems', 'Event-Driven', 'Cloud Native', 'Workflow'],
        repoUrl: 'https://github.com/dapr/dapr',
        demoUrl: null,
        contributor: true
      },
      layotto: {
        title: 'Layotto',
        description: '快速高效的云原生应用运行时，为应用提供分布式能力抽象。Layotto 旨在解决多语言应用开发中的复杂性问题，提供统一的分布式能力接口。',
        language: 'Go',
        languageColor: 'var(--color-go)',
        stars: 853,
        forks: 175,
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        techStack: ['Go', 'Cloud Native', 'Multi-Runtime', 'Service Mesh'],
        repoUrl: 'https://github.com/mosn/layotto',
        demoUrl: null
      },
      capabff: {
        title: 'CapaBFF',
        description: '[Hackathon] 零成本BFF解决方案 - 携程2021 Hackathon大赛金奖项目。CapaBFF 提供了一种高效的前后端分离架构方案，无需额外部署BFF层。',
        language: 'Java',
        languageColor: 'var(--color-java)',
        stars: 35,
        forks: 8,
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
        techStack: ['Java', 'BFF', 'Hackathon', 'Architecture'],
        repoUrl: 'https://github.com/kevinten10/CapaBFF',
        demoUrl: null,
        award: '🏆 Gold'
      }
    },

    /**
     * Initialize the module
     */
    init() {
      this.modal = document.getElementById('project-modal');
      if (!this.modal) {
        console.warn('Project modal not found');
        return;
      }

      this.backdrop = this.modal.querySelector('.modal-backdrop');
      this.closeBtn = this.modal.querySelector('.modal-close');

      this.bindEvents();
      this.attachProjectCards();
    },

    /**
     * Bind modal events with proper cleanup tracking
     */
    bindEvents() {
      // Close button
      this.bindEvent(this.closeBtn, 'click', () => this.close());

      // Backdrop click
      this.bindEvent(this.backdrop, 'click', () => this.close());

      // Keyboard handling
      this.bindEvent(document, 'keydown', (e) => this.handleKeyDown(e));
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
     * Handle keyboard events
     */
    handleKeyDown(e) {
      if (!this.isOpen()) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          this.close();
          break;
        case 'Tab':
          this.trapFocus(e);
          break;
      }
    },

    /**
     * Trap focus within modal
     */
    trapFocus(event) {
      if (!this.focusableElements || this.focusableElements.length === 0) return;

      const firstElement = this.focusableElements[0];
      const lastElement = this.focusableElements[this.focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },

    /**
     * Get all focusable elements in modal
     */
    getFocusableElements() {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ];

      return Array.from(
        this.modal.querySelectorAll(focusableSelectors.join(','))
      ).filter(el => this.isVisible(el));
    },

    /**
     * Check if element is visible
     */
    isVisible(element) {
      return element.offsetWidth > 0 || element.offsetHeight > 0 ||
             element.getClientRects().length > 0;
    },

    /**
     * Attach click handlers to project cards
     */
    attachProjectCards() {
      const projectCards = document.querySelectorAll('.project-card');
      projectCards.forEach(card => {
        const titleLink = card.querySelector('.project-title a');
        if (!titleLink) return;

        const projectName = this.getProjectNameFromTitle(titleLink.textContent);
        if (!projectName) return;

        // Make entire card clickable
        card.style.cursor = 'pointer';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `View details for ${titleLink.textContent}`);

        this.bindEvent(card, 'click', (e) => {
          if (e.target.tagName === 'A' || e.target.closest('a')) return;
          this.open(projectName);
        });

        this.bindEvent(card, 'keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.open(projectName);
          }
        });

        // Add quick-view button
        const quickViewBtn = document.createElement('button');
        quickViewBtn.className = 'project-quick-view-btn';
        quickViewBtn.innerHTML = '<span>Quick View</span>';
        quickViewBtn.setAttribute('aria-label', `Quick view ${projectName}`);
        quickViewBtn.type = 'button';

        this.bindEvent(quickViewBtn, 'click', (e) => {
          e.stopPropagation();
          this.open(projectName);
        });

        const footer = card.querySelector('.project-footer');
        if (footer) {
          footer.appendChild(quickViewBtn);
        }
      });
    },

    /**
     * Get project key from title
     */
    getProjectNameFromTitle(title) {
      const nameMap = {
        'Capa': 'capa',
        'Vrml': 'vrml',
        'Apache Dubbo': 'dubbo',
        'Dapr': 'dapr',
        'Layotto': 'layotto',
        'CapaBFF': 'capabff'
      };
      return nameMap[title] || null;
    },

    /**
     * Open modal for project
     */
    open(projectName) {
      const project = this.projects[projectName];
      if (!project) {
        console.warn(`Project not found: ${projectName}`);
        return;
      }

      // Store previous focus for restoration
      this.previousFocus = document.activeElement;

      this.activeProject = project;
      this.populateModal(project);

      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Get focusable elements for trap focus
      this.focusableElements = this.getFocusableElements();

      // Focus first focusable element (or close button)
      const firstFocusable = this.focusableElements[0] || this.closeBtn;
      if (firstFocusable) {
        firstFocusable.focus();
      }

      // Announce to screen readers
      this.announceToScreenReader(`Opened details for ${project.title}`);
    },

    /**
     * Close modal
     */
    close() {
      this.modal.classList.remove('active');
      document.body.style.overflow = '';

      // Restore previous focus
      if (this.previousFocus && this.previousFocus.focus) {
        this.previousFocus.focus();
      }

      this.activeProject = null;
      this.focusableElements = null;

      // Announce to screen readers
      this.announceToScreenReader('Modal closed');
    },

    /**
     * Check if modal is open
     */
    isOpen() {
      return this.modal && this.modal.classList.contains('active');
    },

    /**
     * Populate modal with project data
     */
    populateModal(project) {
      // Icon
      const iconEl = document.getElementById('modal-icon');
      if (iconEl) iconEl.innerHTML = project.icon;

      // Stats
      const statsHtml = `
        <span class="stat-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span class="stat-value">${project.stars}</span>
          <span class="sr-only">stars</span>
        </span>
        <span class="stat-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c3.943 0 7.295 2.619 8.476 6.204-1.368-.066-2.512-.39-3.559-.836-.747-.326-1.518-.663-2.391-.863-.873-.2-1.852-.265-2.926-.265-1.074 0-2.053.065-2.926.265-.873.2-1.644.537-2.391-.863-1.047.446-2.191.77-3.559.836 1.181-3.585 4.533-6.204 8.476-6.204zm0 20c-3.943 0-7.295-2.619-8.476-6.204 1.368.066 2.512.39 3.559.836.747.326 1.518.663 2.391.863.873.2 1.852.265 2.926.265 1.074 0 2.053-.065 2.926-.265.873-.2 1.644-.537 2.391-.863 1.047-.446-2.191.77-3.559-.836-1.181 3.585-4.533 6.204-8.476 6.204z"/></svg>
          <span class="stat-value">${project.forks}</span>
          <span class="sr-only">forks</span>
        </span>
      `;

      const statsEl = document.getElementById('modal-stats');
      if (statsEl) statsEl.innerHTML = statsHtml;

      // Language badge
      let langBadge = `<span class="language-badge ${project.language.toLowerCase()}" style="display: inline-flex; align-items: center; gap: var(--space-2);">
        <span class="language-dot" style="background: ${project.languageColor}" aria-hidden="true"></span>
        ${project.language}
      </span>`;

      if (project.contributor) {
        langBadge += ` <span class="contribution-badge">Contributor</span>`;
      }
      if (project.award) {
        langBadge += ` <span class="award-badge">${project.award}</span>`;
      }

      const langEl = document.getElementById('modal-language');
      if (langEl) langEl.innerHTML = langBadge;

      // Title and description
      const titleEl = document.getElementById('modal-title');
      const descEl = document.getElementById('modal-description');
      if (titleEl) titleEl.textContent = project.title;
      if (descEl) descEl.textContent = project.description;

      // Tech stack
      const techStackHtml = project.techStack.map(tech =>
        `<span class="tech-tag secondary">${tech}</span>`
      ).join('');

      const tagsEl = document.getElementById('modal-tech-tags');
      if (tagsEl) tagsEl.innerHTML = techStackHtml;

      // Links
      const repoLink = document.getElementById('modal-repo-link');
      const demoLink = document.getElementById('modal-demo-link');

      if (repoLink) {
        repoLink.href = project.repoUrl;
        repoLink.setAttribute('aria-label', `View ${project.title} on GitHub`);
      }

      if (demoLink) {
        if (project.demoUrl) {
          demoLink.href = project.demoUrl;
          demoLink.style.display = 'inline-flex';
          demoLink.removeAttribute('aria-hidden');
        } else {
          demoLink.style.display = 'none';
          demoLink.setAttribute('aria-hidden', 'true');
        }
      }
    },

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
      let announcement = document.getElementById('modal-announcement');

      if (!announcement) {
        announcement = document.createElement('div');
        announcement.id = 'modal-announcement';
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        document.body.appendChild(announcement);
      }

      announcement.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        announcement.textContent = '';
      }, 1000);
    },

    /**
     * Cleanup event listeners
     */
    destroy() {
      this.boundHandlers.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.boundHandlers = [];
      this.close();
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ProjectModal.init());
  } else {
    ProjectModal.init();
  }

  // Expose to global scope
  window.ProjectModal = ProjectModal;

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => ProjectModal.destroy());
})();
