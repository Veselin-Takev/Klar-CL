import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// ═══════════════════════════════════════════════════════════════════════════
// Lokaler Entwicklungsmodus (09.08.2026)
//
// WOZU: Die App ist bis heute nie mit Datenbank gelaufen. Der Server ruft
// `initializeApp()` ohne Zugangsdaten; im Codespace gibt es keine
// Application Default Credentials, also scheitert jeder Firestore-Zugriff.
// Seit der Altersprüfung (DSG-02) ist das sperrend: Ohne Schreibzugriff kann
// `isAdult` nicht gesetzt werden, das Gate öffnet nie, und kein einziger
// KI-Endpunkt ist erreichbar.
//
// Mit `npm run dev:lokal` laufen Auth und Firestore als Emulator. Kein
// Konto, keine Kosten, keine echten Daten — und der ganze Weg von der
// Anmeldung über die Altersangabe bis zum KI-Coach ist begehbar.
//
// WARUM `demo-klar` STATT DER ECHTEN PROJEKT-ID: Bei einer ID mit dem
// Präfix `demo-` verlangt die Firebase-CLI keine Anmeldung und kann
// garantiert nie mit der echten Datenbank sprechen. Dieselbe ID benutzen
// die Regeltests — ein Versehen, das Testdaten in die Produktion schreibt,
// ist damit ausgeschlossen.
//
// Der Schalter ist `VITE_EMULATOR`, gesetzt vom Skript `dev:lokal`.
// Ohne ihn verhält sich diese Datei wie vorher.
// ═══════════════════════════════════════════════════════════════════════════

const emulator = import.meta.env.VITE_EMULATOR === 'true';

const config = emulator
  ? { ...firebaseConfig, projectId: 'demo-klar' }
  : firebaseConfig;

const app = initializeApp(config);

// Im Emulatorbetrieb die Standarddatenbank — eine benannte Datenbank gibt es
// dort nicht.
export const db = emulator
  ? getFirestore(app)
  : getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export const auth = getAuth(app);

if (emulator) {
  // In Codespaces liegen die Emulatoren hinter der Portweiterleitung, sind
  // aus dem Browser aber unter localhost erreichbar, weil VS Code den Port
  // durchreicht.
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  // Deutlich sichtbar in der Konsole: Es ist nicht die echte Datenbank.
  console.info(
    '%cKlar läuft gegen die lokalen Emulatoren (Projekt demo-klar). Keine echten Daten.',
    'background:#3f4a3c;color:#fff;padding:2px 6px;border-radius:4px',
  );
}
