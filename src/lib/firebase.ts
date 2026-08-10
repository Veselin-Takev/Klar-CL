import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Lokaler Entwicklungsmodus. Schalter ist VITE_EMULATOR, gesetzt von dev:lokal.
// Projekt-ID demo-klar: verlangt keine Anmeldung und kann nie mit der echten
// Datenbank sprechen. Dieselbe ID benutzen die Regeltests.
const emulator = import.meta.env.VITE_EMULATOR === 'true';

const config = emulator
  ? { ...firebaseConfig, projectId: 'demo-klar' }
  : firebaseConfig;

const app = initializeApp(config);

// BEFUND 10.08.2026, im Browser bestaetigt: Hier stand fest verdrahtet
// 127.0.0.1. Im Browser-Codespace laeuft die Seite auf dem Rechner der
// bedienenden Person, die Emulatoren im Container. 127.0.0.1 zeigt dort auf
// die eigene Maschine, wo nichts laeuft -- ERR_CONNECTION_REFUSED.
// Aus ...-3000.app.github.dev wird ...-9099.app.github.dev, HTTPS auf 443.
const imCodespace =
  typeof window !== 'undefined' && /\.app\.github\.dev$/.test(window.location.hostname);

const emulatorHost = (port) =>
  imCodespace ? window.location.hostname.replace(/-\d+\./, `-${port}.`) : '127.0.0.1';

export const auth = getAuth(app);

// WARUM NICHT connectFirestoreEmulator IM CODESPACE: Die Funktion setzt ssl
// auf das Ergebnis von isCloudWorkstation(host) -- fuer .app.github.dev also
// false. Sie spraeche unverschluesselt gegen eine HTTPS-Adresse. Nachgesehen
// im Quelltext des firebase-js-sdk, nicht vermutet.
// experimentalForceLongPolling: Die Portweiterleitung vertraegt sich schlecht
// mit dem Streaming-Verfahren. Langsamer, aber es kommt an.
export const db = !emulator
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : imCodespace
    ? initializeFirestore(app, {
        host: emulatorHost(8080),
        ssl: true,
        experimentalForceLongPolling: true,
      })
    : getFirestore(app);

if (emulator) {
  connectAuthEmulator(
    auth,
    imCodespace ? `https://${emulatorHost(9099)}` : 'http://127.0.0.1:9099',
    { disableWarnings: true },
  );
  if (!imCodespace) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  console.info(
    '%cKlar laeuft gegen die lokalen Emulatoren (Projekt demo-klar). Keine echten Daten.',
    'background:#3f4a3c;color:#fff;padding:2px 6px;border-radius:4px',
  );
  console.info(
    imCodespace
      ? `Emulatoren ueber die Codespaces-Weiterleitung: Auth ${emulatorHost(9099)}, Firestore ${emulatorHost(8080)}. Beide Ports muessen auf Public stehen.`
      : 'Emulatoren ueber 127.0.0.1 -- Ports 9099 und 8080.',
  );
}
