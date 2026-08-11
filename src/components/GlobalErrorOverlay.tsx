import { useState, useEffect } from 'react';
import { AlertOctagon, WifiOff } from 'lucide-react';
// `db`, `getDoc` und `doc` entfallen mit der Umstellung auf /api/health.
// Unter `noUnusedLocals` brächen sie sonst den Build.

export function GlobalErrorOverlay() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // ── BEFUND 10.08.2026 ──────────────────────────────────────────────
    // Hier stand `await getDoc(doc(db, 'system', 'health_check'))`, mit dem
    // Kommentar „Simulate Firebase connection check". Die Prüfung war nie
    // echt und konnte gar nicht gelingen: Für die Sammlung `system` gibt es
    // in firestore.rules keine Regel, und bei Deny-by-default heisst das
    // „No matching allow statements" — bei jedem Durchlauf, alle 30
    // Sekunden.
    //
    // Die Folge war schwerer als der Fehler selbst: Diese Komponente legt
    // sich bildschirmfüllend über die App. Wer Klar öffnete, sah
    // „Verbindung zum Server fehlgeschlagen" und kam nicht weiter — bei
    // einwandfreier Verbindung.
    //
    // Jetzt gegen `/api/health`, eine Route ohne Anmeldung und ohne Daten.
    // ZWEI Fehlversuche in Folge, bevor die Meldung erscheint: Ein
    // einzelner Aussetzer — Neustart des Servers, kurze Funklücke — darf
    // die Oberfläche nicht sperren.
    let fehlversuche = 0;
    const checkConnection = async () => {
      if (isOffline) return;
      try {
        const antwort = await fetch('/api/health', { cache: 'no-store' });
        if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
        fehlversuche = 0;
        setHasError(false);
      } catch (err) {
        fehlversuche += 1;
        console.warn(`Verbindungsprüfung fehlgeschlagen (${fehlversuche}/2):`, err);
        if (fehlversuche >= 2) {
          setHasError(true);
          setErrorMessage("Verbindung zum Server fehlgeschlagen. Bitte versuche es später erneut.");
        }
      }
    };
    
    const interval = setInterval(checkConnection, 30000);
    checkConnection();
    
    // Global error handler
    const handleError = (e: ErrorEvent) => {
      console.error("Global error caught:", e);
      // In a real app, send to Sentry here
      if (e.message.includes('fetch') || e.message.includes('network')) {
        setHasError(true);
        setErrorMessage("Ein Netzwerkfehler ist aufgetreten.");
      }
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleError);
      clearInterval(interval);
    };
  }, [isOffline]);

  if (!hasError && !isOffline) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-sm text-center shadow-xl">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          {isOffline ? (
            <WifiOff size={32} className="text-rose-600 dark:text-rose-400" />
          ) : (
            <AlertOctagon size={32} className="text-rose-600 dark:text-rose-400" />
          )}
        </div>
        <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
          {isOffline ? "Keine Internetverbindung" : "Systemfehler"}
        </h3>
        <p className="text-stone-500 dark:text-stone-400 mb-6">
          {isOffline 
            ? "Bitte überprüfe deine Netzwerkverbindung, um Klar weiter zu nutzen." 
            : errorMessage || "Ein unerwarteter Fehler ist aufgetreten. Wir arbeiten bereits an einer Lösung."}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors"
        >
          Neu laden
        </button>
      </div>
    </div>
  );
}
