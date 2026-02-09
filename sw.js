/**
 * Service Worker for KevinTen Personal Website
 * Provides offline caching and performance optimization
 */

const CACHE_NAME = 'kevinten-v9';
const RUNTIME_CACHE = 'runtime-v9';
const STATIC_CACHE = 'static-v9';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/css/theme.css',
  '/assets/js/app.js',
  '/assets/js/theme.js',
  '/assets/js/search.js',
  '/img/avatar.jpg'
];

// Assets to cache on demand
const CACHE_ASSETS = [
  '*.js',
  '*.css',
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.svg',
  '*.woff',
  '*.woff2'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all open clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle static assets - cache first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Handle HTML pages - stale while revalidate
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(networkFirst(request));
});

// Cache strategies
function cacheFirst(request) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) {
      return cachedResponse;
    }

    return fetch(request).then((networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        // Cache the network response
        const responseToCache = networkResponse.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
      }
      return networkResponse;
    });
  });
}

function networkFirst(request) {
  return caches.match(request).then((cachedResponse) => {
    // Return cached response immediately if available
    if (cachedResponse) {
      return cachedResponse;
    }

    // Otherwise fetch from network
    return fetch(request).then((networkResponse) => {
      // Cache successful network responses
      if (networkResponse && networkResponse.ok) {
        const responseToCache = networkResponse.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
        // If network fails, try to return cached response
        return caches.match(request);
      });
  });
}

function staleWhileRevalidate(request) {
  return caches.open(RUNTIME_CACHE).then((cache) => {
    return cache.match(request).then((cachedResponse) => {
      // Return cached response immediately
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Update cache with fresh response
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      });

      // Return cached response immediately, fetch in background
      return cachedResponse ? cachedResponse : fetchPromise;
    });
  });
}

// Check if request is for a static asset
function isStaticAsset(url) {
  const extensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2', '.ico'];
  return extensions.some(ext => url.pathname.endsWith(ext));
}

// Background sync for offline support
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-articles') {
    event.waitUntil(
      Promise.all([
        syncArticles(),
        syncCategories(),
        syncTags()
      ])
    );
  }
});

// Sync functions
async function syncArticles() {
  try {
    const response = await fetch('/api/articles/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const articles = await response.json();
      await updateArticleCache(articles);
    }
  } catch (error) {
    console.error('Failed to sync articles:', error);
  }
}

async function syncCategories() {
  try {
    const response = await fetch('/api/categories/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const categories = await response.json();
      await updateCategoryCache(categories);
    }
  } catch (error) {
    console.error('Failed to sync categories:', error);
  }
}

async function syncTags() {
  try {
    const response = await fetch('/api/tags/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const tags = await response.json();
      await updateTagCache(tags);
    }
  } catch (error) {
    console.error('Failed to sync tags:', error);
  }
}

// Cache update helpers
async function updateArticleCache(articles) {
  const cache = await caches.open(RUNTIME_CACHE);
  for (const article of articles) {
    const url = new URL(article.url, self.location.href).href;
    await cache.add(new Request(url));
  }
}

async function updateCategoryCache(categories) {
  const cache = await caches.open(RUNTIME_CACHE);
  for (const category of categories) {
    const url = new URL(category.url, self.location.href).href;
    await cache.add(new Request(url));
  }
}

async function updateTagCache(tags) {
  const cache = await caches.open(RUNTIME_CACHE);
  for (const tag of tags) {
    const url = new URL(tag.url, self.location.href).href;
    await cache.add(new Request(url));
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      Promise.all(
        event.data.urls.map((url) => {
          return caches.open(RUNTIME_CACHE).then((cache) => {
            return cache.add(new Request(url));
          });
        })
      )
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const title = event.data.title || 'KevinTen Blog';
    const options = {
      body: event.data.body || 'New content available',
      icon: event.data.icon || '/img/avatar.jpg',
      badge: event.data.badge || '1',
      data: event.data,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Periodic cache cleanup (every 24 hours)
setInterval(() => {
  cleanupCache();
}, 24 * 60 * 60 * 1000);

async function cleanupCache() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const date = response.headers.get('date');
        if (date) {
          const cacheDate = new Date(date).getTime();
          if (now - cacheDate > maxAge) {
            await cache.delete(request);
          }
        }
      }
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

// Log service worker lifecycle events
self.addEventListener('install', () => {
  console.log('[SW] Installing service worker...');
});

self.addEventListener('activate', () => {
  console.log('[SW] Activating service worker...');
});

self.addEventListener('fetch', (event) => {
  console.log('[SW] Fetching:', event.request.url);
});
