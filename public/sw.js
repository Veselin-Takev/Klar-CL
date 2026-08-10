// BEFUND 10.08.2026 -- der Offline-Zwischenspeicher war nie in Betrieb.
//
// Hier stand '/manifest.json', // If we had one. Die Datei gibt es nicht.
// cache.addAll ist aber atomar: Schlaegt EIN Eintrag fehl, wird die ganze
// Zusage abgelehnt. Der install-Schritt scheiterte also bei jeder
// Registrierung, und es wurde NIE etwas zwischengespeichert.
//
// Sichtbar war davon nichts: Die Registrierung selbst gelingt, die Konsole
// meldete "SW registered". SyncBanner.tsx zeigt "Du bist offline" und es
// gibt eine offlineQueue -- die Oberflaeche verspricht also einen
// Offline-Betrieb, den es nicht gab. Dieselbe Fehlerklasse wie bei der
// Loeschung, der Meldung und der Verifizierung.
//
// Der Name ist auf v2 erhoeht, damit der alte, leere Speicher beim
// naechsten activate verworfen wird.
const CACHE_NAME = 'klar-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
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
    }).catch(() => {
      // BEFUND 10.08.2026: Hier fehlte jede Behandlung. Schlug der Netzabruf
      // fehl -- Server neu gestartet, Verbindung weg --, brach die Zusage ab.
      // In der Konsole erschien "Uncaught (in promise) TypeError: Failed to
      // fetch" aus sw.js:54, und die Seite bekam gar keine Antwort.
      //
      // Jetzt: erst im Speicher nachsehen, sonst eine ehrliche 503. Das ist
      // keine Offline-Faehigkeit -- die braeuchte eine eigene Ersatzseite --,
      // aber es ist eine Antwort statt eines stillen Abbruchs.
      return caches.match(request).then((zwischengespeichert) =>
        zwischengespeichert ||
        new Response('Offline und nicht im Zwischenspeicher.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }),
      );
    })
  );
});
