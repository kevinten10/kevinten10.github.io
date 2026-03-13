/**
 * Search Module - Article search functionality
 * Fast client-side search with debouncing
 */

(function() {
  'use strict';

  const SearchModule = {
    searchIndex: [],
    isInitialized: false,

    // Initialize search
    async init() {
      if (this.isInitialized) return;

      const searchInput = document.querySelector('.search-input');
      const searchResults = document.querySelector('.search-results');
      
      if (!searchInput) return;

      // Load search index
      await this.loadSearchIndex();

      // Bind events
      searchInput.addEventListener('input', this.debounce((e) => {
        this.performSearch(e.target.value);
      }, 300));

      searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim()) {
          this.showResults();
        }
      });

      // Close search on click outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
          this.hideResults();
        }
      });

      // Keyboard navigation
      searchInput.addEventListener('keydown', (e) => {
        this.handleKeyboard(e);
      });

      this.isInitialized = true;
    },

    // Load search index from JSON or generate from DOM
    async loadSearchIndex() {
      try {
        // Try to load from search.json
        const response = await fetch('/search.json');
        if (response.ok) {
          this.searchIndex = await response.json();
          return;
        }
      } catch (e) {
        console.log('Search index not found, generating from DOM...');
      }

      // Fallback: generate from DOM
      this.generateSearchIndexFromDOM();
    },

    // Generate search index from existing article links
    generateSearchIndexFromDOM() {
      const articles = document.querySelectorAll('[data-search-item]');
      this.searchIndex = Array.from(articles).map(article => ({
        title: article.dataset.title || '',
        url: article.dataset.url || '',
        excerpt: article.dataset.excerpt || '',
        tags: (article.dataset.tags || '').split(',').filter(Boolean),
        date: article.dataset.date || ''
      }));
    },

    // Perform search
    performSearch(query) {
      const normalizedQuery = query.toLowerCase().trim();
      const resultsContainer = document.querySelector('.search-results');

      if (!normalizedQuery) {
        this.hideResults();
        return;
      }

      const results = this.searchIndex.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(normalizedQuery);
        const excerptMatch = item.excerpt.toLowerCase().includes(normalizedQuery);
        const tagMatch = item.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));
        
        return titleMatch || excerptMatch || tagMatch;
      }).slice(0, 10); // Limit to 10 results

      this.renderResults(results, normalizedQuery);
      this.showResults();
    },

    // Render search results
    renderResults(results, query) {
      const container = document.querySelector('.search-results');
      
      if (results.length === 0) {
        container.innerHTML = `
          <div class="search-empty">
            <p>未找到与 "${this.escapeHtml(query)}" 相关的文章</p>
          </div>
        `;
        return;
      }

      const html = results.map((result, index) => `
        <a href="${result.url}" class="search-result-item" data-index="${index}">
          <div class="search-result-title">${this.highlightMatch(result.title, query)}</div>
          ${result.excerpt ? `<div class="search-result-excerpt">${this.highlightMatch(result.excerpt.substring(0, 100) + '...', query)}</div>` : ''}
          <div class="search-result-meta">
            <span class="search-result-date">${result.date}</span>
            ${result.tags.map(tag => `<span class="search-result-tag">${tag}</span>`).join('')}
          </div>
        </a>
      `).join('');

      container.innerHTML = html;
      this.selectedIndex = -1;
    },

    // Highlight matching text
    highlightMatch(text, query) {
      if (!query) return this.escapeHtml(text);
      const regex = new RegExp(`(${query})`, 'gi');
      return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
    },

    // Escape HTML
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    // Show results
    showResults() {
      const container = document.querySelector('.search-results');
      if (container) {
        container.classList.add('active');
      }
    },

    // Hide results
    hideResults() {
      const container = document.querySelector('.search-results');
      if (container) {
        container.classList.remove('active');
      }
    },

    // Handle keyboard navigation
    handleKeyboard(e) {
      const items = document.querySelectorAll('.search-result-item');
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
          this.updateSelection(items);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
          this.updateSelection(items);
          break;
        case 'Enter':
          e.preventDefault();
          if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
            items[this.selectedIndex].click();
          }
          break;
        case 'Escape':
          this.hideResults();
          e.target.blur();
          break;
      }
    },

    // Update selection highlight
    updateSelection(items) {
      items.forEach((item, index) => {
        item.classList.toggle('selected', index === this.selectedIndex);
      });
      
      if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
        items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    },

    // Debounce utility
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
    }
  };

  // Expose to global scope
  window.SearchModule = SearchModule;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SearchModule.init());
  } else {
    SearchModule.init();
  }
})();
