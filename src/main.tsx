import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { installAuthFetch } from './lib/authFetch';
import './index.css';
import * as Sentry from '@sentry/react';

// P0-3: Muss VOR dem ersten Rendern laufen — die Widgets schicken ihre erste
// Anfrage bereits im ersten useEffect. Wäre die Hülle danach installiert,
// liefe genau dieser Aufruf ohne Token.
installAuthFetch();

// ═══════════════════════════════════════════════════════════════════════════
// DSG-05 (Final Audit 08.08.2026) — Session Replay entfernt
//
// BEFUND: Hier stand `Sentry.replayIntegration()` mit
// `replaysSessionSampleRate: 0.1` und `replaysOnErrorSampleRate: 1.0`.
// Session Replay zeichnet den gerenderten DOM auf — in dieser App also
// Gespraechsverlaeufe, Profiltexte und Journaleintraege. Ohne Maskierung,
// ohne Einwilligung, ohne AVV mit Sentry. Bei jedem Fehler wurde eine
// vollstaendige Aufzeichnung uebertragen.
//
// ENTSCHIEDEN (09.08.2026): Aufzeichnung ersatzlos entfernt statt maskiert.
// Maskierung waere weiterhin einwilligungspflichtig und braeuchte einen
// Auftragsverarbeitungsvertrag; in einer App mit intimen Gespraechen steht
// der Nutzen dazu in keinem Verhaeltnis. Fehlerberichte bleiben — sie
// enthalten Stapel und Meldung, nicht den Bildschirm.
//
// `beforeSend` entfernt zusaetzlich, was ueber die Meldung hinausgeht.
// Die Fehlermeldung selbst kann Nutzertext enthalten (DSG-06); das ist
// hier nicht abschliessend geloest, nur eingegrenzt.
// ═══════════════════════════════════════════════════════════════════════════
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0,
  enabled: import.meta.env.PROD,
  sendDefaultPii: false,
  beforeSend(event) {
    // GEGENPRÜFUNG 09.08.2026 — drei Fehler in der ersten Fassung:
    //
    //   1. Ohne Einwilligung wurde trotzdem gesendet. Der Dialog bot
    //      „Fehlerberichte" zur Wahl an, die Wahl hatte keine Wirkung.
    //   2. Der Kommentar nannte `/chat/<uid>` als Risiko und entfernte dann
    //      nur den Abfrageteil — der Pfad mit der Kennung blieb stehen.
    //   3. `breadcrumbs` blieben unangetastet. Dort landen Konsolenausgaben
    //      und vollständige Fetch-Adressen, also genau das Material, das
    //      oben entfernt wurde.
    //
    // Ohne ausdrückliches „ja" wird nichts gesendet. Der Standard ist Nein.
    try {
      if (localStorage.getItem("klar_einw_fehlerberichte") !== "ja") return null;
    } catch {
      return null;   // kein Zugriff auf die Entscheidung → nicht senden
    }

    if (event.request?.url) {
      try {
        const u = new URL(event.request.url);
        // Kennungen aus dem Pfad ersetzen: /chat/abc123 → /chat/:id
        const pfad = u.pathname.replace(/\/[A-Za-z0-9_-]{12,}(?=\/|$)/g, '/:id');
        event.request.url = u.origin + pfad;
      } catch { /* unveraenderte Adresse ist weniger schlimm als ein Absturz hier */ }
    }
    delete event.request?.cookies;
    delete event.request?.data;
    delete event.user;
    // Breadcrumbs enthalten Konsolentexte und volle Adressen. Für die
    // Fehlersuche ist der Stapel das Wesentliche.
    event.breadcrumbs = [];
    return event;
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 p-6 text-center">
        <h2 className="text-2xl font-serif text-stone-900 mb-2">Ein Fehler ist aufgetreten</h2>
        <p className="text-stone-600">Wir haben das Problem protokolliert und kümmern uns darum.</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-stone-900 text-white rounded-xl">Neu laden</button>
      </div>
    }>
      <ThemeProvider><App /></ThemeProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);


// BEFUND 10.08.2026, teuer bezahlt: Im Entwicklungsmodus lieferte der
// Service Worker alte Bausteine aus. Eine korrigierte firebase.ts und ein
// korrigiertes Dashboard.tsx lagen im Repo, im Browser lief weiter die alte
// Fassung -- die Konsole zeigte Zeilennummern, die es nicht mehr gab. Bis
// das auffiel, verging eine Stunde.
//
// Deshalb: Registrierung nur im gebauten Stand. Beim Entwickeln wird eine
// vorhandene Registrierung aktiv entfernt und der Speicher geleert, damit
// dieselbe Falle nicht ein zweites Mal zuschnappt.
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((alle) => {
      for (const r of alle) {
        void r.unregister();
      }
      if (alle.length > 0) {
        console.info(
          'Entwicklungsmodus: Service Worker entfernt. Einmal neu laden, ' +
            'dann laeuft garantiert der aktuelle Stand.',
        );
      }
    });
    if ('caches' in window) {
      void caches.keys().then((namen) => namen.forEach((n) => caches.delete(n)));
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((fehler) => console.warn('SW-Registrierung fehlgeschlagen:', fehler));
    });
  }
}
