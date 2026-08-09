import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCcw, WifiOff } from 'lucide-react';
import { getQueuedActions, removeQueuedAction } from '../lib/offlineQueue';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

export function SyncBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncMessage, setSyncMessage] = useState('Daten synchronisiert');
  const [syncDetail, setSyncDetail] = useState('Neue Daten (z.B. Deep-Verbindungen) sind verfügbar. Die Ansicht wurde aktualisiert.');
  

  useEffect(() => {
    const handleSync = () => {
      setSyncMessage('Daten synchronisiert');
      setSyncDetail('Neue Daten sind verfügbar. Die Ansicht wurde aktualisiert.');
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 5000);
    };
    window.addEventListener('klar-in-app-notification', handleSync);
    return () => window.removeEventListener('klar-in-app-notification', handleSync);
  }, []);

  const calculateSize = (actions: any[]) => {
    const jsonString = JSON.stringify(actions);
    const bytes = new Blob([jsonString]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  useEffect(() => {
    let checkInterval: any;
    let offlineTimestamp: number | null = !navigator.onLine ? performance.now() : null;

    const checkOfflineQueueSize = async () => {
      if (!navigator.onLine) {
        const actions = await getQueuedActions();
        if (actions.length > 0) {
          const size = calculateSize(actions);
          
          setIsOffline(true);
          setSyncMessage('Du bist offline');
          setSyncDetail(`${actions.length} Aktionen (${size}) in der Warteschlange. Werden synchronisiert, sobald du wieder online bist.`);
          setIsVisible(true);
        }
      }
    };

    if (!navigator.onLine) {
      checkOfflineQueueSize();
      checkInterval = setInterval(checkOfflineQueueSize, 10000); // Check every 10s
    }

    const processQueue = async () => {
      if (offlineTimestamp !== null) {
        const duration = performance.now() - offlineTimestamp;
        console.log(`[Performance Marker] Offline phase duration: ${duration.toFixed(2)}ms`);
        offlineTimestamp = null;
      }

      setIsOffline(false);
      const actions = await getQueuedActions();
      if (actions.length === 0) return;
      
      setIsSyncing(true);
      setSyncMessage('Synchronisiere Offline-Aktionen...');
      setSyncDetail(`${actions.length} Aktion(en) (${calculateSize(actions)}) werden verarbeitet.`);
      setIsVisible(true);
      
      try {
        for (const action of actions) {
          if (action.type === 'SEND_MESSAGE') {
            await addDoc(collection(db, 'chats', action.payload.chatId, 'messages'), action.payload.message);
          } else if (action.type === 'LIKE_PROFILE') {
            await updateDoc(doc(db, 'connections', action.payload.connectionId), {
              liked: true,
              timestamp: action.timestamp
            });
          }
          await removeQueuedAction(action.id);
        }
        setSyncMessage('Synchronisation erfolgreich');
        setSyncDetail('Alle Offline-Aktionen wurden erfolgreich hochgeladen.');
      } catch (error) {
        console.error("Failed to sync offline actions", error);
        setSyncMessage('Synchronisation fehlgeschlagen');
        setSyncDetail('Einige Aktionen konnten nicht synchronisiert werden.');
      } finally {
        setIsSyncing(false);
        setTimeout(() => setIsVisible(false), 5000);
      }
    };

    const handleOnline = () => {
      clearInterval(checkInterval);
      processQueue();
    };

    const handleOffline = () => {
      if (offlineTimestamp === null) {
        offlineTimestamp = performance.now();
      }
      checkOfflineQueueSize();
      checkInterval = setInterval(checkOfflineQueueSize, 10000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (navigator.onLine) {
      processQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-4 right-4 z-50 mx-auto max-w-md text-white dark:text-stone-900 rounded-2xl p-4 shadow-md flex items-start gap-3 ${
            isOffline 
              ? 'bg-amber-600 dark:bg-amber-400' 
              : 'bg-stone-900/90 dark:bg-stone-100/90'
          }`}
          role="alert"
          aria-live="assertive"
        >
          <div className="p-2 bg-white/10 dark:bg-black/10 rounded-full shrink-0">
            {isOffline ? (
              <WifiOff size={16} />
            ) : isSyncing ? (
              <RefreshCcw size={16} className="animate-spin" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse block"></span>
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="text-sm font-semibold mb-1">{syncMessage}</h3>
            <p className="text-xs text-white/80 dark:text-black/60">
              {syncDetail}
            </p>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1.5 shrink-0 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors"
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
