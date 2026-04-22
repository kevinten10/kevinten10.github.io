/**
 * Service Worker for KevinTen Personal Website
 * Provides offline caching and performance optimization
 * @version 30
 */

const SW_VERSION = '33';
const CACHE_NAME = `kevinten-v${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-v${SW_VERSION}`;
const STATIC_CACHE = `static-v${SW_VERSION}`;

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/main.css?v=31',
  '/assets/css/theme.css?v=31',
  '/assets/css/comments.css?v=1',
  '/assets/css/ai-assistant.css?v=1',
  '/assets/js/observer-manager.js?v=31',
  '/assets/js/app.js?v=31',
  '/assets/js/theme.js?v=31',
  '/assets/js/animations.js?v=31',
  '/assets/js/bento-interactions.js?v=31',
  '/assets/js/mobile-nav.js?v=31',
  '/assets/js/github-stats.js?v=31',
  '/assets/js/project-modal.js?v=31',
  '/assets/js/gallery.js?v=31',
  '/assets/js/i18n.js?v=31',
  '/assets/js/comments.js?v=1',
  '/assets/js/analytics.js?v=1',
  '/assets/js/ai-assistant.js?v=1',
  '/img/avatar.jpg'
];

// Assets to cache on demand
const CACHE_EXTENSIONS = [
  '.js', '.css', '.png', '.jpg', '.jpeg', '.svg',
  '.woff', '.woff2', '.ico', '.webp'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v' + SW_VERSION);
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
  console.log('[SW] Activating service worker v' + SW_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that doesn't match our current version
          if (cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== STATIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Clean up stale cache entries
      cleanupCache();
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
    // If network fails, fall back to cache
    return caches.match(request);
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
  return CACHE_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
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

// Cache cleanup - remove stale entries
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
            console.log('[SW] Cleaned up stale cache entry:', request.url);
          }
        }
      }
    }
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}
