import { auth } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// P0-3 (Client-Seite) — das ID-Token wird an EINER Stelle angehängt
//
// Der Server ist über `app.use("/api", …)` an einer Stelle geschützt.
// Auf der Client-Seite hängt `fetchWithTimeout` in src/lib/api.ts das Token
// an — aber die direkten `fetch("/api/…")`-Aufrufe aus den Widgets gehen
// daran vorbei. Die würden ab sofort alle 401 bekommen.
//
// Diese Hülle um `window.fetch` schließt die Lücke an einer Stelle statt an
// vielen. Ein neu geschriebener Aufruf ist damit automatisch angemeldet,
// ohne dass jemand daran denken muss — genau das ist der Punkt.
//
// Abgrenzung: Fremde Adressen werden nicht angefasst; sonst ginge das Token
// bei jedem Bild von Unsplash mit. Ein bereits gesetzter Authorization-Header
// wird nicht überschrieben.
// ═══════════════════════════════════════════════════════════════════════════

function eigenerApiAufruf(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith('/api/')) return true;
  try {
    const p = new URL(url, window.location.origin);
    return p.origin === window.location.origin && p.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

let installiert = false;

export function installAuthFetch(): void {
  if (installiert || typeof window === 'undefined') return;
  installiert = true;
  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (!eigenerApiAufruf(input)) return original(input, init);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) {
      const user = auth.currentUser;
      // getIdToken() erneuert automatisch; ohne das wäre die App nach einer
      // Stunde abgemeldet.
      if (user) headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
    }
    return original(input, { ...init, headers });
  };
}
