import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/react';

export function GlobalApiOverlay() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (e: any) => {
      const detail = e.detail;
      setErrorDetails(detail?.message || 'Verbindungsfehler');
      Sentry.captureException(new Error(detail?.message || 'API Error'), { extra: detail });
    };

    const handleRetryStart = () => {
      setIsRetrying(true);
    };

    const handleRetryEnd = () => {
      setIsRetrying(false);
      setErrorDetails(null);
    };

    window.addEventListener('klar_api_error', handleError);
    window.addEventListener('klar_api_retry_start', handleRetryStart);
    window.addEventListener('klar_api_retry_end', handleRetryEnd);

    return () => {
      window.removeEventListener('klar_api_error', handleError);
      window.removeEventListener('klar_api_retry_start', handleRetryStart);
      window.removeEventListener('klar_api_retry_end', handleRetryEnd);
    };
  }, []);

  return (
    <AnimatePresence>
      {(isRetrying || errorDetails) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 dark:bg-stone-100/90 text-white dark:text-stone-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3"
        >
          {isRetrying ? (
            <RefreshCw size={18} className="animate-spin text-brand dark:text-brand-light" />
          ) : (
            <AlertCircle size={18} className="text-rose-400" />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {isRetrying ? 'Wird neu versucht...' : 'Fehler aufgetreten'}
            </span>
            {!isRetrying && errorDetails && (
              <span className="text-[10px] opacity-80">{errorDetails}</span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
