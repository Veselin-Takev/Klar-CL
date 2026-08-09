const CACHE_NAME = 'klar-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json', // If we had one
];

// URLs containing these will be cached for offline
const DYNAMIC_CACHE_ROUTES = [
  '/api/system-health',
  '/api/date-ideas',
  '/api/date-checklist',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Exclude non-GET requests or Gemini APIs we don't want cached offline
  if (request.method !== 'GET') {
    // For POST APIs that we want offline (like coach tips), we can't easily intercept with sw cache
    // unless we parse body. Our client-side api.ts cache is better for that.
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        // Don't cache if not a valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // Clone the response
        const responseToCache = networkResponse.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return networkResponse;
      });
    })
  );
});
