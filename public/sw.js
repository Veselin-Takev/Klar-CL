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
// BEFUND 14.08.2026 -- der Name steht jetzt auf v3.
//
// v2 enthielt '/' und '/index.html'. Beide wurden ZUERST aus dem Speicher
// beantwortet (siehe `caches.match` vor `fetch` weiter unten). Damit hatte
// der Zwischenspeicher des Service Workers seine eigene, vom HTTP-Kopf
// voellig unabhaengige Kopie des Dokuments -- und die wurde nie erneuert,
// weil `activate` nur Speicher mit ANDEREM Namen loescht. `no-store` im
// Kopf der Antwort erreicht diese Kopie nicht.
//
// Der Sprung auf v3 wirft sie einmalig weg. Neu angelegt wird sie nicht:
// STATIC_ASSETS ist leer, und Navigationsanfragen laufen jetzt am Service
// Worker vorbei.
const CACHE_NAME = 'klar-cache-v3';

// Leer, mit Absicht.
//
// Frueher standen hier '/' und '/index.html'. Sie wurden hinterlegt, um
// "offline zu funktionieren" -- taten das aber nicht, weil es keine
// Ersatzseite gibt, und sorgten stattdessen dafuer, dass ein veraltetes
// Dokument samt veralteter Content-Security-Policy weiterlebte.
//
// Ein Eintrag, der nur schadet, gehoert nicht in eine Liste, die
// "Offline-Faehigkeit" heisst.
const STATIC_ASSETS = [];

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

// ══ WELCHE ANFRAGE DER SERVICE WORKER ANFASST ═══════════════════════════════
//
// BEFUND 14.08.2026: Bis hierher hat der Service Worker JEDE GET-Anfrage
// uebernommen, auch fremde. Das hatte zwei Folgen, und die zweite war die
// schwerere:
//
//   1. Es brachte nichts. Weiter unten steht `networkResponse.type !==
//      'basic'` -- fremde Antworten wurden also ohnehin nie abgelegt. Der
//      Umweg ueber den Service Worker war fuer sie reine Durchreiche.
//
//   2. Es hat die Content-Security-Policy verschaerft, ohne dass jemand
//      etwas geaendert haette. Ein `fetch()` AUS einem Service Worker faellt
//      unter `connect-src` -- unabhaengig davon, wofuer das Ergebnis gedacht
//      ist. Ein <script src="https://apis.google.com/js/api.js"> gehoert
//      eigentlich unter `script-src`, und dort war die Adresse erlaubt.
//      Durch die Uebernahme wurde daraus ein `connect-src`-Fall, und dort
//      stand sie nicht.
//
//      In der Konsole sah das so aus:
//
//        Fetch API cannot load https://apis.google.com/js/api.js?onload=...
//        Refused to connect because it violates the document's
//        Content Security Policy.                              @ sw.js:68
//        GET ... net::ERR_ABORTED 503 (Service Unavailable)
//        Error signing in with Google
//        FirebaseError: Firebase: Error (auth/internal-error)
//
//      Die 503 kommt aus dem `.catch()` weiter unten -- der abgelehnte
//      `fetch` wirft, im Speicher liegt nichts, also die Ersatzantwort.
//      `api.js` laedt nie, und die Google-Anmeldung scheitert.
//
// Der naheliegende Weg waere gewesen, `apis.google.com` zusaetzlich in
// `connect-src` einzutragen. Das haette diesen einen Fall behoben und die
// Ursache stehen gelassen: Jede weitere fremde Adresse muesste dann doppelt
// eingetragen werden -- einmal fuer ihre richtige Direktive, einmal fuer
// `connect-src`. Und jede vergessene faellt erst im Betrieb auf.
//
// Drittens: Navigationsanfragen. Das Dokument wurde ZUERST aus dem Speicher
// beantwortet. Damit war jede Verschaerfung der Sicherheitsregeln und jeder
// neue Bau fuer bestehende Besucher unerreichbar -- der Fehler, dessen
// Aufklaerung ueberhaupt hierher gefuehrt hat.

/**
 * Reine Entscheidung: Soll der Service Worker diese Anfrage uebernehmen?
 *
 * Absichtlich ohne Zugriff auf `self`, `caches` oder `Request` -- nur vier
 * Werte hinein, ein Wahrheitswert hinaus. Dadurch kann
 * scripts/sw-durchreiche.mjs diese Funktion herausloesen und AUSFUEHREN,
 * statt im Quelltext nach Zeichenketten zu suchen.
 *
 * @param {string} methode           request.method
 * @param {string} anfrageHerkunft   new URL(request.url).origin
 * @param {string} eigeneHerkunft    self.location.origin
 * @param {string} modus             request.mode
 * @returns {boolean}
 */
function sollAbfangen(methode, anfrageHerkunft, eigeneHerkunft, modus) {
  // Nur GET. Ein POST hat einen Rumpf, den wir nicht abgleichen koennen.
  if (methode !== 'GET') return false;

  // Fremde Herkunft nicht anfassen: bringt nichts (type !== 'basic') und
  // verschiebt die geltende CSP-Direktive nach `connect-src`.
  if (anfrageHerkunft !== eigeneHerkunft) return false;

  // Das Dokument nie aus dem Speicher zuerst. Es traegt die Verweise auf den
  // aktuellen Bau und die Sicherheitsregeln.
  if (modus === 'navigate') return false;

  return true;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!sollAbfangen(request.method, url.origin, self.location.origin, request.mode)) {
    return;
  }

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
