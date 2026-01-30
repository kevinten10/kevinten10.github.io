/**
 * Articles Page Functionality
 * Search, filter, and pagination for article list
 */

(function() {
  'use strict';

  // Article data - sample data based on actual blog structure
  const articlesData = [
    {
      id: 1,
      title: 'Reactive gRPC - 响应式RPC框架实践',
      excerpt: '探讨如何在微服务架构中使用Reactive gRPC实现高性能的异步通信，包括背压处理、流控制和错误处理策略。',
      date: '2019-09-15',
      category: 'reactive',
      categoryName: 'Reactive',
      tags: ['gRPC', 'Reactive', 'Microservices'],
      url: '/2019/09/15/Reactive/Reactive-gRPC/',
      readTime: '15 min'
    },
    {
      id: 2,
      title: 'Java IO模型深度解析',
      excerpt: '从BIO到NIO再到AIO，全面解析Java中的IO模型演进，以及在不同场景下的选型建议。',
      date: '2019-09-15',
      category: 'java',
      categoryName: 'Java',
      tags: ['Java', 'IO', 'NIO', 'Netty'],
      url: '/2019/09/15/Java/io/Java-IO模型/',
      readTime: '20 min'
    },
    {
      id: 3,
      title: 'Service Mesh - Istio入门与实践',
      excerpt: '详细介绍Istio的架构设计、核心功能以及在Kubernetes环境中的部署和配置方法。',
      date: '2019-09-03',
      category: 'servicemesh',
      categoryName: 'Service Mesh',
      tags: ['Istio', 'Service Mesh', 'Kubernetes'],
      url: '/2019/09/03/Cloud/servicemesh/Cloud-Istio/',
      readTime: '25 min'
    },
    {
      id: 4,
      title: 'Envoy代理配置详解',
      excerpt: '深入理解Envoy的配置模型，包括Listener、Cluster、Route等核心概念的配置方法。',
      date: '2019-09-03',
      category: 'servicemesh',
      categoryName: 'Service Mesh',
      tags: ['Envoy', 'Proxy', 'Service Mesh'],
      url: '/2019/09/03/Cloud/servicemesh/Cloud-Envoy/',
      readTime: '18 min'
    },
    {
      id: 5,
      title: 'AWS Lambda无服务器架构实战',
      excerpt: '从零开始构建AWS Lambda应用，包括函数开发、部署、监控和最佳实践。',
      date: '2019-09-21',
      category: 'aws',
      categoryName: 'AWS',
      tags: ['AWS', 'Lambda', 'Serverless'],
      url: '/2019/09/21/AWS/lambda/Aws-Lambda/',
      readTime: '12 min'
    },
    {
      id: 6,
      title: 'Kubernetes服务发现机制',
      excerpt: '深入分析Kubernetes中的服务发现原理，包括DNS、Endpoints和Service的工作原理。',
      date: '2019-08-30',
      category: 'kubernetes',
      categoryName: 'Kubernetes',
      tags: ['Kubernetes', 'Service Discovery', 'DNS'],
      url: '/2019/08/30/Cloud/kubernetes/Cloud-K8s-Solution/',
      readTime: '22 min'
    },
    {
      id: 7,
      title: 'Netty核心组件详解',
      excerpt: '全面解析Netty的核心组件，包括Channel、EventLoop、ChannelHandler等关键概念。',
      date: '2019-11-11',
      category: 'java',
      categoryName: 'Java',
      tags: ['Netty', 'Java', 'NIO', 'Network'],
      url: '/2019/11/11/Netty/Netty-核心组件/',
      readTime: '30 min'
    },
    {
      id: 8,
      title: 'QCon上海 - 云架构演进之路',
      excerpt: 'QCon大会云架构专题分享总结，涵盖多云战略、混合云架构和云原生实践。',
      date: '2019-10-21',
      category: 'qcon',
      categoryName: 'QCon',
      tags: ['QCon', 'Cloud', 'Architecture'],
      url: '/2019/10/21/Qcon/Qcon-云架构/',
      readTime: '10 min'
    },
    {
      id: 9,
      title: '领域驱动设计实践指南',
      excerpt: '从理论到实践，详细介绍DDD的核心概念、战略设计和战术设计方法。',
      date: '2019-11-19',
      category: 'java',
      categoryName: 'Java',
      tags: ['DDD', 'Architecture', 'Design'],
      url: '/2019/11/19/Principle/领域驱动设计/',
      readTime: '35 min'
    },
    {
      id: 10,
      title: 'TDD测试驱动开发实践',
      excerpt: '通过实际案例学习TDD的开发流程，包括单元测试编写、重构技巧等。',
      date: '2019-11-20',
      category: 'java',
      categoryName: 'Java',
      tags: ['TDD', 'Testing', 'Java'],
      url: '/2019/11/20/Principle/TDD/',
      readTime: '28 min'
    }
  ];

  // State management
  const state = {
    articles: articlesData,
    filteredArticles: articlesData,
    currentCategory: 'all',
    currentTag: null,
    searchQuery: '',
    currentPage: 1,
    itemsPerPage: 6,
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
  function init() {
    bindEvents();
    renderArticles();
    updateFilterStatus();
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
      if (state.currentTag && !article.tags.includes(state.currentTag)) {
        return false;
      }

      // Search filter
      if (state.searchQuery) {
        const searchLower = state.searchQuery.toLowerCase();
        const matchTitle = article.title.toLowerCase().includes(searchLower);
        const matchExcerpt = article.excerpt.toLowerCase().includes(searchLower);
        const matchTags = article.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchTitle && !matchExcerpt && !matchTags) {
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
      elements.noResults.style.display = 'block';
      elements.loadMoreContainer.style.display = 'none';
      return;
    }

    elements.noResults.style.display = 'none';

    const html = articlesToShow.map(article => `
      <article class="article-card" data-id="${article.id}">
        <div class="article-header">
          <div class="article-meta">
            <span class="article-date">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${formatDate(article.date)}
            </span>
            <span class="article-reading-time">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${article.readTime}
            </span>
          </div>
          <span class="article-category">${article.categoryName}</span>
        </div>
        <h2 class="article-title">
          <a href="${article.url}">${highlightMatch(article.title, state.searchQuery)}</a>
        </h2>
        <p class="article-excerpt">${highlightMatch(article.excerpt, state.searchQuery)}</p>
        <div class="article-footer">
          <div class="article-tags">
            ${article.tags.map(tag => `<span class="article-tag">${tag}</span>`).join('')}
          </div>
          <a href="${article.url}" class="article-link">
            阅读更多
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </article>
    `).join('');

    elements.articlesGrid.innerHTML = html;

    // Show/hide load more button
    if (state.filteredArticles.length > endIndex) {
      elements.loadMoreContainer.style.display = 'block';
    } else {
      elements.loadMoreContainer.style.display = 'none';
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
      elements.clearFilter.style.display = 'none';
    } else {
      statusText = `${filters.join(' + ')} (${state.filteredArticles.length})`;
      elements.clearFilter.style.display = 'inline-block';
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
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Highlight search matches
   */
  function highlightMatch(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark style="background: var(--color-primary); color: white; padding: 0 2px; border-radius: 2px;">$1</mark>');
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
