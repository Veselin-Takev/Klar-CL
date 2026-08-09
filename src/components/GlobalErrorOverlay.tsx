import { useState, useEffect } from 'react';
import { AlertOctagon, WifiOff } from 'lucide-react';
import { db } from '../lib/firebase';
import { getDoc, doc } from 'firebase/firestore';

export function GlobalErrorOverlay() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Simulate Firebase connection check
    const checkConnection = async () => {
      try {
        if (!isOffline) {
          await getDoc(doc(db, 'system', 'health_check'));
          setHasError(false);
        }
      } catch (err) {
        console.error("Firebase connection error:", err);
        setHasError(true);
        setErrorMessage("Verbindung zum Server fehlgeschlagen. Bitte versuche es später erneut.");
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
