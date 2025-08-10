// Service Worker for caching
const CACHE_NAME = 'kevinten-blog-v1';
const urlsToCache = [
    '/',
    '/css/style.css',
    '/css/mobile.css',
    '/js/script.js',
    '/js/search.js',
    '/img/avatar.jpg',
    '/fonts/iconfont.woff',
    '/fonts/iconfont.ttf'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});