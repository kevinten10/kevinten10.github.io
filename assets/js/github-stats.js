/**
 * GitHub Stats Module
 * Fetches and displays live GitHub statistics
 * @version 1.1.0
 */

(function() {
  'use strict';

  const GitHubStats = {
    username: 'kevinten10',
    cacheKey: 'github-stats-cache',
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    apiBase: 'https://api.github.com',
    statsContainer: null,
    isLoading: false,
    abortController: null,

    // Configuration
    config: {
      reposPerPage: 100,
      staleThreshold: 30 * 24 * 60 * 60 * 1000, // 30 days for "active" repos
      requestTimeout: 10000 // 10 seconds
    },

    /**
     * Initialize the module
     */
    init() {
      this.statsContainer = document.getElementById('github-stats');
      if (!this.statsContainer) {
        return;
      }

      // Show loading state
      this.showLoading();

      // Try to load from cache first
      this.loadFromCache();

      // Fetch fresh data in background
      this.fetchStats();
    },

    /**
     * Display loading state
     */
    showLoading() {
      if (!this.statsContainer) return;
      this.statsContainer.classList.add('loading');
    },

    /**
     * Hide loading state
     */
    hideLoading() {
      if (!this.statsContainer) return;
      this.statsContainer.classList.remove('loading');
    },

    /**
     * Load stats from localStorage cache
     */
    loadFromCache() {
      try {
        const cached = localStorage.getItem(this.cacheKey);
        if (!cached) return;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        // Use cache if still valid
        if (age < this.cacheExpiry && data.stats) {
          this.displayStats(data.stats, false);
          this.cache = data.stats;
        }
      } catch (e) {
        // Remove corrupted cache
        localStorage.removeItem(this.cacheKey);
        console.warn('Failed to parse cached stats:', e);
      }
    },

    /**
     * Fetch stats from GitHub API
     */
    async fetchStats() {
      // Prevent duplicate requests
      if (this.isLoading) return;
      this.isLoading = true;

      // Create abort controller for timeout
      this.abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        this.abortController.abort();
      }, this.config.requestTimeout);

      try {
        // Fetch user profile and repos in parallel
        const [userResponse, reposResponse] = await Promise.all([
          this.fetchWithTimeout(`${this.apiBase}/users/${this.username}`),
          this.fetchWithTimeout(
            `${this.apiBase}/users/${this.username}/repos?per_page=${this.config.reposPerPage}&type=owner&sort=updated`
          )
        ]);

        clearTimeout(timeoutId);

        if (!userResponse.ok || !reposResponse.ok) {
          throw new Error(`GitHub API error: ${userResponse.status} / ${reposResponse.status}`);
        }

        const [user, repos] = await Promise.all([
          userResponse.json(),
          reposResponse.json()
        ]);

        // Handle API rate limiting
        if (user.message?.includes('API rate limit')) {
          console.warn('GitHub API rate limit exceeded');
          if (!this.cache) {
            this.displayFallback();
          }
          return;
        }

        const stats = {
          contributions: this.calculateTotalContributions(user),
          pinnedRepos: this.getPinnedRepoCount(repos),
          totalStars: this.calculateTotalStars(repos),
          followers: user.followers || 0,
          publicRepos: user.public_repos || 0,
          lastUpdated: Date.now()
        };

        // Cache the results
        this.saveToCache(stats);

        this.cache = stats;
        this.displayStats(stats, true);

      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          console.warn('GitHub API request timeout');
        } else {
          console.warn('Failed to fetch GitHub stats:', error.message);
        }

        // Use cached stats if available, otherwise show fallback
        if (!this.cache) {
          this.displayFallback();
        }
      } finally {
        this.isLoading = false;
        this.hideLoading();
        this.abortController = null;
      }
    },

    /**
     * Fetch with timeout support
     */
    async fetchWithTimeout(url) {
      if (!this.abortController) {
        this.abortController = new AbortController();
      }
      return fetch(url, {
        signal: this.abortController.signal,
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });
    },

    /**
     * Save stats to cache
     */
    saveToCache(stats) {
      try {
        localStorage.setItem(this.cacheKey, JSON.stringify({
          stats,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to cache stats:', e);
      }
    },

    /**
     * Calculate total contributions (rough estimate)
     */
    calculateTotalContributions(user) {
      // GitHub API doesn't provide contribution count directly without authentication
      // Use public_repos as a reasonable proxy
      return user.public_repos || 0;
    },

    /**
     * Count active/pinned repos
     */
    getPinnedRepoCount(repos) {
      if (!Array.isArray(repos)) return 0;

      const staleThreshold = new Date(Date.now() - this.config.staleThreshold);
      return repos.filter(repo => {
        const hasStars = repo.stargazers_count > 0;
        const isRecent = new Date(repo.updated_at) > staleThreshold;
        return hasStars || isRecent;
      }).length;
    },

    /**
     * Calculate total stars across all repos
     */
    calculateTotalStars(repos) {
      if (!Array.isArray(repos)) return 0;
      return repos.reduce((total, repo) => total + (repo.stargazers_count || 0), 0);
    },

    /**
     * Format large numbers with K suffix
     */
    formatNumber(num) {
      if (typeof num !== 'number' || isNaN(num)) return '0';

      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
      }
      return num.toString();
    },

    /**
     * Display stats in the container
     */
    displayStats(stats, animate = true) {
      if (!this.statsContainer || !stats) return;

      const html = `
        <div class="stat-item" data-label="repositories">
          <span class="stat-value" aria-label="${this.formatNumber(stats.publicRepos)} public repositories">
            ${this.formatNumber(stats.publicRepos)}
          </span>
          <span class="stat-label">Public Repos</span>
        </div>
        <div class="stat-item" data-label="projects">
          <span class="stat-value" aria-label="${this.formatNumber(stats.pinnedRepos)} active projects">
            ${this.formatNumber(stats.pinnedRepos)}
          </span>
          <span class="stat-label">Active Projects</span>
        </div>
        <div class="stat-item" data-label="stars">
          <span class="stat-value" aria-label="${this.formatNumber(stats.totalStars)} total stars">
            ${this.formatNumber(stats.totalStars)}
          </span>
          <span class="stat-label">Total Stars</span>
        </div>
      `;

      this.statsContainer.innerHTML = html;

      // Add fade-in animation
      if (animate) {
        this.statsContainer.style.opacity = '0';
        this.statsContainer.style.transform = 'translateY(10px)';
        requestAnimationFrame(() => {
          this.statsContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          this.statsContainer.style.opacity = '1';
          this.statsContainer.style.transform = 'translateY(0)';
        });
      }
    },

    /**
     * Display fallback stats when API fails
     */
    displayFallback() {
      this.displayStats({
        contributions: 78,
        pinnedRepos: 6,
        totalStars: 67000,
        publicRepos: 78,
        followers: 0
      });
    },

    /**
     * Cleanup method
     */
    destroy() {
      if (this.abortController) {
        this.abortController.abort();
      }
      this.isLoading = false;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GitHubStats.init());
  } else {
    GitHubStats.init();
  }

  // Expose to global scope for external control
  window.GitHubStats = GitHubStats;

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => GitHubStats.destroy());
})();
