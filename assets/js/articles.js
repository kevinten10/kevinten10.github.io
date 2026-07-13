/**
 * Articles Page Functionality
 * Search, filter, and pagination for article list
 */

(function() {
  'use strict';

  const ARTICLES_INDEX_URL = '/assets/data/articles.json?v=1';

  // State management
  const state = {
    articles: [],
    filteredArticles: [],
    currentCategory: 'all',
    currentTag: null,
    searchQuery: '',
    currentPage: 1,
    itemsPerPage: 12,
    isLoading: false
  };

  // DOM Elements
  const elements = {
    searchInput: document.getElementById('searchInput'),
    categoryList: document.getElementById('categoryList'),
    tagCloud: document.getElementById('tagCloud'),
    articlesGrid: document.getElementById('articlesGrid'),
    filterStatus: document.getElementById('filterStatus'),
    filterText: document.querySelector('.filter-text'),
    clearFilter: document.getElementById('clearFilter'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    loadMoreContainer: document.getElementById('loadMoreContainer'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    noResults: document.getElementById('noResults')
  };

  /**
   * Initialize the articles page
   */
  async function init() {
    bindEvents();
    setLoading(true);

    try {
      const response = await fetch(ARTICLES_INDEX_URL, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`Article index request failed: ${response.status}`);

      const payload = await response.json();
      if (!Array.isArray(payload.articles) || payload.total !== payload.articles.length) {
        throw new Error('Article index payload is invalid.');
      }

      state.articles = payload.articles;
      state.filteredArticles = payload.articles;
      renderTaxonomy();
      renderArticles();
      updateFilterStatus();
    } catch {
      state.articles = [];
      state.filteredArticles = [];
      const title = elements.noResults?.querySelector('h3');
      const description = elements.noResults?.querySelector('p');
      if (title) title.textContent = '文章索引加载失败';
      if (description) description.textContent = '请刷新页面重试，或访问历史归档。';
      renderArticles();
      if (elements.filterText) elements.filterText.textContent = '文章索引暂时不可用';
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    state.isLoading = isLoading;
    if (elements.loadingIndicator) elements.loadingIndicator.hidden = !isLoading;
    if (elements.loadMoreContainer && isLoading) elements.loadMoreContainer.hidden = true;
  }

  function renderTaxonomy() {
    const categories = new Map();
    const tags = new Map();

    state.articles.forEach((article) => {
      const category = categories.get(article.category) || {
        slug: article.category,
        name: article.categoryName,
        count: 0
      };
      category.count++;
      categories.set(article.category, category);

      article.tags.forEach((tag) => {
        const key = tag.toLocaleLowerCase('zh-CN');
        const item = tags.get(key) || { key, name: tag, count: 0 };
        item.count++;
        tags.set(key, item);
      });
    });

    const sortedCategories = Array.from(categories.values())
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'zh-CN'));
    const popularTags = Array.from(tags.values())
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'zh-CN'))
      .slice(0, 16);

    if (elements.categoryList) {
      elements.categoryList.innerHTML = [
        `<li><button type="button" class="category-item active" data-category="all"><span class="category-name">全部文章</span><span class="category-count">${state.articles.length}</span></button></li>`,
        ...sortedCategories.map((category) => `<li><button type="button" class="category-item" data-category="${escapeHtml(category.slug)}"><span class="category-name">${escapeHtml(category.name)}</span><span class="category-count">${category.count}</span></button></li>`)
      ].join('');
    }

    if (elements.tagCloud) {
      elements.tagCloud.innerHTML = popularTags
        .map((tag) => `<button type="button" class="tag-item" data-tag="${escapeHtml(tag.key)}">${escapeHtml(tag.name)} <span aria-hidden="true">${tag.count}</span></button>`)
        .join('');
    }
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Search input with debounce
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Category filter
    if (elements.categoryList) {
      elements.categoryList.addEventListener('click', handleCategoryClick);
    }

    // Tag filter
    if (elements.tagCloud) {
      elements.tagCloud.addEventListener('click', handleTagClick);
    }

    // Clear filter
    if (elements.clearFilter) {
      elements.clearFilter.addEventListener('click', clearFilters);
    }

    // Load more
    if (elements.loadMoreBtn) {
      elements.loadMoreBtn.addEventListener('click', loadMore);
    }
  }

  /**
   * Handle search input
   */
  function handleSearch(e) {
    state.searchQuery = e.target.value.toLowerCase().trim();
    state.currentPage = 1;
    filterArticles();
  }

  /**
   * Handle category click
   */
  function handleCategoryClick(e) {
    const categoryItem = e.target.closest('.category-item');
    if (!categoryItem) return;

    const category = categoryItem.dataset.category;
    
    // Update active state
    document.querySelectorAll('.category-item').forEach(item => {
      item.classList.remove('active');
    });
    categoryItem.classList.add('active');

    state.currentCategory = category;
    state.currentPage = 1;
    filterArticles();
  }

  /**
   * Handle tag click
   */
  function handleTagClick(e) {
    const tagItem = e.target.closest('.tag-item');
    if (!tagItem) return;

    const tag = tagItem.dataset.tag;
    
    // Toggle active state
    document.querySelectorAll('.tag-item').forEach(item => {
      item.classList.remove('active');
    });
    
    if (state.currentTag === tag) {
      state.currentTag = null;
    } else {
      tagItem.classList.add('active');
      state.currentTag = tag;
    }

    state.currentPage = 1;
    filterArticles();
  }

  /**
   * Filter articles based on current state
   */
  function filterArticles() {
    state.filteredArticles = state.articles.filter(article => {
      // Category filter
      if (state.currentCategory !== 'all' && article.category !== state.currentCategory) {
        return false;
      }

      // Tag filter
      if (state.currentTag && !article.tags.some((tag) => tag.toLocaleLowerCase('zh-CN') === state.currentTag)) {
        return false;
      }

      // Search filter
      if (state.searchQuery) {
        const searchLower = state.searchQuery.toLowerCase();
        const matchTitle = article.title.toLowerCase().includes(searchLower);
        const matchExcerpt = article.excerpt.toLowerCase().includes(searchLower);
        const matchTags = article.tags.some(tag => tag.toLowerCase().includes(searchLower));
        const matchCategory = article.categoryName.toLowerCase().includes(searchLower);
        
        if (!matchTitle && !matchExcerpt && !matchTags && !matchCategory) {
          return false;
        }
      }

      return true;
    });

    renderArticles();
    updateFilterStatus();
  }

  /**
   * Render articles to the grid
   */
  function renderArticles() {
    if (!elements.articlesGrid) return;

    const startIndex = 0;
    const endIndex = state.currentPage * state.itemsPerPage;
    const articlesToShow = state.filteredArticles.slice(startIndex, endIndex);

    if (articlesToShow.length === 0) {
      elements.articlesGrid.innerHTML = '';
      if (elements.noResults) elements.noResults.hidden = false;
      elements.loadMoreContainer.hidden = true;
      return;
    }

    if (elements.noResults) elements.noResults.hidden = true;

    const html = articlesToShow.map(article => `
      <article class="article-card" data-id="${Number(article.id)}">
        <div class="article-header">
          <div class="article-meta">
            <span class="article-date">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${formatDate(article.date)}
            </span>
            <span class="article-reading-time">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${escapeHtml(article.readTime)}
            </span>
          </div>
          <span class="article-category">${escapeHtml(article.categoryName)}</span>
        </div>
        <h2 class="article-title">
          <a href="${escapeHtml(article.url)}">${highlightMatch(article.title, state.searchQuery)}</a>
        </h2>
        <p class="article-excerpt">${highlightMatch(article.excerpt, state.searchQuery)}</p>
        <div class="article-footer">
          <div class="article-tags">
            ${article.tags.map(tag => `<span class="article-tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
          <a href="${escapeHtml(article.url)}" class="article-link">
            阅读更多
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </article>
    `).join('');

    elements.articlesGrid.innerHTML = html;

    // Show/hide load more button
    if (state.filteredArticles.length > endIndex) {
      elements.loadMoreContainer.hidden = false;
    } else {
      elements.loadMoreContainer.hidden = true;
    }
  }

  /**
   * Update filter status text
   */
  function updateFilterStatus() {
    if (!elements.filterText || !elements.clearFilter) return;

    let statusText = '';
    const filters = [];

    if (state.currentCategory !== 'all') {
      const categoryName = document.querySelector(`[data-category="${state.currentCategory}"] .category-name`)?.textContent;
      if (categoryName) filters.push(categoryName);
    }

    if (state.currentTag) {
      filters.push(state.currentTag);
    }

    if (state.searchQuery) {
      filters.push(`搜索: "${state.searchQuery}"`);
    }

    if (filters.length === 0) {
      statusText = `显示全部文章 (${state.filteredArticles.length})`;
      elements.clearFilter.hidden = true;
    } else {
      statusText = `${filters.join(' + ')} (${state.filteredArticles.length})`;
      elements.clearFilter.hidden = false;
    }

    elements.filterText.textContent = statusText;
  }

  /**
   * Clear all filters
   */
  function clearFilters() {
    state.currentCategory = 'all';
    state.currentTag = null;
    state.searchQuery = '';
    state.currentPage = 1;

    // Reset UI
    if (elements.searchInput) {
      elements.searchInput.value = '';
    }

    document.querySelectorAll('.category-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.category === 'all') {
        item.classList.add('active');
      }
    });

    document.querySelectorAll('.tag-item').forEach(item => {
      item.classList.remove('active');
    });

    filterArticles();
  }

  /**
   * Load more articles
   */
  function loadMore() {
    state.currentPage++;
    renderArticles();
  }

  /**
   * Format date string
   */
  function formatDate(dateString) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString) ? dateString : '';
  }

  /**
   * Highlight search matches
   */
  function highlightMatch(text, query) {
    const source = String(text || '');
    if (!query) return escapeHtml(source);

    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    let output = '';
    let lastIndex = 0;
    for (const match of source.matchAll(regex)) {
      output += escapeHtml(source.slice(lastIndex, match.index));
      output += `<mark class="search-highlight">${escapeHtml(match[0])}</mark>`;
      lastIndex = match.index + match[0].length;
    }
    return output + escapeHtml(source.slice(lastIndex));
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  /**
   * Escape regex special characters
   */
  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Debounce function
   */
  function debounce(func, wait) {
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
