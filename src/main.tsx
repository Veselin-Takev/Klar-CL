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

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: import.meta.env.PROD,
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


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered: ', registration);
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
