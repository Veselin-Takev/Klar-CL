import { auth } from './firebase';

export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}


const CACHE_EXPIRY_MS = 15 * 60 * 1000; // 15 mins

/** Zwei verschiedene Hashverfahren plus Laenge — siehe FE-08 unten. */
function hashPaar(text: string): string {
  let a = 5381, b = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = ((a << 5) + a + c) | 0;          // djb2
    b = (c + (b << 6) + (b << 16) - b) | 0;  // sdbm
  }
  return `${(a >>> 0).toString(36)}-${(b >>> 0).toString(36)}-${text.length}`;
}

/** FE-08, zweite Haelfte: Der Cache wuchs unbegrenzt. Ist das Kontingent
 *  des Browsers voll, wirft `setItem` — und zwar ueberall in der App, nicht
 *  nur hier. Deshalb wird beim Schreiben aufgeraeumt. */
function cacheAufraeumen(): void {
  try {
    const eintraege: { k: string; t: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("klar_api_cache_")) continue;
      try {
        const { timestamp } = JSON.parse(localStorage.getItem(k) || "{}");
        eintraege.push({ k, t: Number(timestamp) || 0 });
      } catch { localStorage.removeItem(k); }
    }
    // Abgelaufenes zuerst, danach die aeltesten, bis hoechstens 50 bleiben.
    const jetzt = Date.now();
    eintraege
      .filter((e) => jetzt - e.t > CACHE_EXPIRY_MS)
      .forEach((e) => localStorage.removeItem(e.k));
    const frisch = eintraege.filter((e) => jetzt - e.t <= CACHE_EXPIRY_MS).sort((x, y) => x.t - y.t);
    while (frisch.length > 50) {
      const aeltester = frisch.shift();
      if (aeltester) localStorage.removeItem(aeltester.k);
    }
  } catch { /* Aufraeumen darf nie der Grund fuer einen Fehler sein */ }
}

export async function fetchWithCache(resource: RequestInfo, options: RequestInit & { timeout?: number } = {}) {
  // Only cache POST requests that have a body
  if (options.method === 'POST' && options.body && typeof options.body === 'string') {
    const bodyStr = options.body;
    // Don't cache chats or journals directly
    if (!resource.toString().includes('/api/chat') && !resource.toString().includes('/api/dating-journal')) {
      // ── FE-08 (Final Audit 08.08.2026) ────────────────────────────────
      // BEFUND: Der Schluessel war ein 32-Bit-Hash ueber den Rumpf. Bei
      // zwei verschiedenen Anfragen mit gleichem Hash bekommt die zweite
      // die Antwort der ersten — in dieser App also die KI-Auswertung
      // einer FREMDEN Bio oder eines fremden Journals. Selten, aber die
      // Folge waere eine Datenpanne, kein Anzeigefehler.
      //
      // Jetzt zwei unabhaengige Hashes plus die Laenge. Eine Kollision
      // muesste in beiden Verfahren UND in der Laenge zusammenfallen.
      // Sauberer waere SHA-256 ueber crypto.subtle — das ist asynchron und
      // haette diese Funktion umgebaut; der Aufwand steht hier nicht dafuer.
      const cacheKey = `klar_api_cache_${resource}_${hashPaar(bodyStr)}`;
      
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
            // FUN-02 (Final Audit 08.08.2026): Hier stand ein nachgebautes
            // Antwortobjekt mit nur `ok` und `json`. Die Aufrufer benutzen
            // aber auch `.text()` — beim ersten Aufruf ging es (echte
            // Response), beim zweiten warf es
            //   „response.text is not a function".
            // Ein Fehler, der erst nach 15 Minuten Cache-Laufzeit auftritt
            // und deshalb beim Ausprobieren nie erscheint.
            //
            // Jetzt eine echte Response: `.json()`, `.text()`, `.ok`,
            // `.status`, `.clone()` und alles Weitere kommen vom Browser.
            return new Response(JSON.stringify(data), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch(e) {}
      }
      
      const response = await fetchWithTimeout(resource, options);
      if (response.ok) {
        const cloned = response.clone();
        cloned.json().then(data => {
          cacheAufraeumen();
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
          } catch {
            // Kontingent voll trotz Aufraeumen: lieber ohne Cache
            // weiterarbeiten als die Anfrage scheitern lassen.
          }
        }).catch(() => {});
      }
      return response;
    }
  }
  return fetchWithTimeout(resource, options);
}

export async function fetchWithTimeout(resource: RequestInfo, options: RequestInit & { timeout?: number, retries?: number } = {}): Promise<Response> {
  const { timeout = 60000, retries = 2 } = options;
  let attempt = 0;
  
  while (attempt <= retries) {
    const token = await getAuthToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    options.headers = headers;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      if (attempt > 0) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('klar_api_retry_start'));
        }
      }
      
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal
      });
      
      if (attempt > 0 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('klar_api_retry_end'));
      }
      
      if (!response.ok && response.status >= 500 && attempt < retries) {
         // Force retry on 5xx errors
         throw new Error(`Server error: ${response.status}`);
      }
      
      return response;
    } catch (error: any) {
      clearTimeout(id);
      
      if (attempt >= retries) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('klar_api_retry_end'));
          window.dispatchEvent(new CustomEvent('klar_api_error', { 
            detail: { message: error.message || 'Netzwerkfehler', url: resource.toString() } 
          }));
        }
        
        if (error.name === 'AbortError') {
          throw new Error('Zeitüberschreitung bei der Server-Anfrage. Bitte versuche es später nochmal.');
        }
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));
      attempt++;
    } finally {
      clearTimeout(id);
    }
  }
  
  throw new Error("Unreachable");
}

export async function askAICoach(prompt: string, context?: string): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify({ prompt, context }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  const data = await response.text().then(text => text ? JSON.parse(text) : {});
  return data.text;
}

export async function fetchDateIdeas(interests: string): Promise<{title: string, description: string}[]> {
  const response = await fetchWithCache('/api/date-ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interests }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  const data = await response.text().then(text => text ? JSON.parse(text) : {});
  return data.ideas || [];
}

export async function fetchProfileSummary(userInterests: string[], profileName: string, profileInterests: string[], profileBio: string): Promise<string> {
  const response = await fetchWithCache('/api/profile-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userInterests,
      profileName,
      profileInterests,
      profileBio
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  const data = await response.text().then(text => text ? JSON.parse(text) : {});
  return data.summary || "";
}

export async function parseProfileImport(textData: string): Promise<{ bio: string, interests: string[] }> {
  const response = await fetchWithCache('/api/parse-profile-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textData }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  return await response.text().then(text => text ? JSON.parse(text) : {});
}

export async function optimizeProfileApi(bio: string, interests: string[]): Promise<{ optimizedBio: string, suggestedInterests: string[] }> {
  const response = await fetchWithCache('/api/optimize-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bio, interests }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  return await response.text().then(text => text ? JSON.parse(text) : {});
}

export async function fetchDateChecklist(interests: string[]): Promise<{category: "Outfit & Grooming" | "Mindset" | "Gespräch", text: string}[]> {
  const response = await fetchWithCache('/api/date-checklist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interests }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  const data = await response.text().then(text => text ? JSON.parse(text) : {});
  return data.items || [];
}

export async function fetchDateArchiveAnalysis(reflections: any[]): Promise<{patterns: string[], learning: string}> {
  const response = await fetchWithCache('/api/date-archive-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reflections }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  const data = await response.text().then(text => text ? JSON.parse(text) : {});
  return { patterns: data.patterns || [], learning: data.learning || "" };
}

export async function fetchDatingSuccessScore(reflections: any[]): Promise<{scores: {category: string, score: number}[], insight: string, trend?: {name: string, score: number}[]}> {
  const response = await fetchWithCache('/api/dating-success-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reflections }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  const data = await response.text().then(text => text ? JSON.parse(text) : {});
  return { scores: data.scores || [], insight: data.insight || "", trend: data.trend || [] };
}

export async function fetchCompatibilityRadar(userInterests: string[], verbindungen: any[]): Promise<{subject: string, A: number}[]> {
  const response = await fetchWithCache('/api/compatibility-radar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInterests, verbindungen }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  const data = await response.text().then(text => text ? JSON.parse(text) : {});
  return data.data || [];
}

export async function fetchMatchContextAnalysis(reflections: any[]): Promise<{topics: {name: string, reason: string, score: number}[]}> {
  const response = await fetchWithCache('/api/verbindung-context-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reflections }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  return await response.text().then(text => text ? JSON.parse(text) : {});
}

export async function fetchSmartVibeMap(reflections: any[]): Promise<{locations: {name: string, vibe: string, reason: string}[]}> {
  const response = await fetchWithCache('/api/smart-vibe-map', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reflections }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  return await response.text().then(text => text ? JSON.parse(text) : {});
}

export async function fetchIcebreaker(userInterests: string[], verbindungContext: any): Promise<{icebreaker: string, reasoning: string}> {
  const response = await fetchWithCache('/api/icebreaker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInterests, verbindungContext }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  return await response.text().then(text => text ? JSON.parse(text) : {});
}

export async function fetchSmartDatePlanner(weather: string, availability: string, verbindungContext: any, location?: string | null): Promise<{suggestions: {title: string, description: string, type: string}[]}> {
  const response = await fetchWithCache('/api/smart-date-planner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weather, availability, verbindungContext, location }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  return await response.text().then(text => text ? JSON.parse(text) : {});
}

export async function fetchCityTrendRadar(location?: string | null): Promise<{trends: {name: string, description: string, vibe: string}[]}> {
  const response = await fetchWithCache('/api/city-trend-radar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location }),
  });
  
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  
  return await response.text().then(text => text ? JSON.parse(text) : {});
}

export async function fetchDateSummary(reflection: any): Promise<{moments: string[], learnings: string[]}> {
  const response = await fetchWithCache('/api/date-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reflection }),
  });
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  return response.text().then(text => text ? JSON.parse(text) : {});
}

export async function fetchReflectionQuestions(rating: number, verbindungName: string): Promise<string[]> {
  const response = await fetchWithCache('/api/reflection-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, verbindungName }),
  });
  if (!response.ok) {
    const errorData = await response.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
    throw new Error(errorData.error || 'Fehler bei der KI-Verarbeitung.');
  }
  const data = await response.text().then(text => text ? JSON.parse(text) : {});
  return data.questions || [];
}

export async function verifyPhoto(photoUrl: string) {
  const token = await getAuthToken();
  const res = await fetch("/api/verify-photo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ photoUrl })
  });
  if (!res.ok) throw new Error("Failed to verify photo");
  return await res.json();
}

export async function subscribeKlarPlus() {
  const token = await getAuthToken();
  const res = await fetch("/api/subscribe-klar-plus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error("Failed to subscribe");
  return await res.json();
}
