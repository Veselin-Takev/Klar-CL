const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

export async function translateMessage(text: string, targetLang: string): Promise<string> {
  if (!text.trim()) return text;
  
  const cacheKey = `${targetLang}:${text}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  
  if (pending.has(cacheKey)) {
    return pending.get(cacheKey)!;
  }

  const promise = new Promise<string>((resolve) => {
    // Basic debounce/delay logic
    setTimeout(async () => {
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // BEFUND 10.08.2026: Hier stand { q, target, source } -- die
          // Feldnamen der Google-Translate-API v2. Der eigene Server erwartet
          // text und targetLanguage, pruefte if (!text) und antwortete
          // deshalb auf JEDE Uebersetzung mit 400.
          //
          // Sichtbar war das nicht: Der catch unten gibt den Originaltext
          // zurueck, und in der Oberflaeche stand nur "Uebersetzung
          // fehlgeschlagen" -- dieselbe Anzeige wie bei einem Netzproblem.
          body: JSON.stringify({ text, targetLanguage: targetLang }),
        });

        if (!response.ok) {
          const daten = await response.json().catch(() => ({}));
          // Die Meldung des Servers mitnehmen, statt sie durch eine eigene
          // zu ersetzen. "Translation API returned an error" hat monatelang
          // verschwiegen, dass es ein 400 wegen falscher Feldnamen war.
          throw new Error(daten.error || `Übersetzung: HTTP ${response.status}`);
        }

        const data = await response.json();
        const result = data.translatedText || text;
        cache.set(cacheKey, result);
        resolve(result);
      } catch (err) {
        // warn, nicht error: Der Fall ist behandelt -- der Originaltext wird
        // angezeigt. Rot in der Konsole gehoert Dingen, die kaputt sind.
        console.warn("Übersetzung nicht möglich, zeige Originaltext:", err);
        resolve(text);
      } finally {
        pending.delete(cacheKey);
      }
    }, 300); // 300ms debounce buffer
  });

  pending.set(cacheKey, promise);
  return promise;
}
