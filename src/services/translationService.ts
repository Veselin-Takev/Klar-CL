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
          body: JSON.stringify({ q: text, target: targetLang, source: "auto" })
        });
        
        if (!response.ok) {
          throw new Error("Translation API returned an error");
        }
        
        const data = await response.json();
        const result = data.translatedText || text;
        cache.set(cacheKey, result);
        resolve(result);
      } catch (err) {
        console.error("Translation fallback to original:", err);
        resolve(text);
      } finally {
        pending.delete(cacheKey);
      }
    }, 300); // 300ms debounce buffer
  });

  pending.set(cacheKey, promise);
  return promise;
}
