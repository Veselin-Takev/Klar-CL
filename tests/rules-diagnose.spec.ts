// ═══════════════════════════════════════════════════════════════════════════
// DIAGNOSE — der `evaluation error` in firestore.rules
//
// ── DIES IST KEINE PRÜFUNG ────────────────────────────────────────────────
// Diese Datei behauptet NICHTS und schlägt NICHT fehl. Sie stellt einen im
// Browser beobachteten Fall nach und schreibt auf, was der Emulator dazu
// sagt. Sie hängt deshalb NICHT in `npm run verify` — sie wird einmal von
// Hand gestartet:
//
//     npm run test:rules-diagnose
//
// Grund für diese Form: Ich kann sie in meiner Umgebung nicht ausführen (kein
// Emulator, `npm install` gesperrt). Ein Test, der behauptet und den ich nie
// laufen liess, wäre eine Vermutung mit grünem Anstrich. Ein Protokoll, das
// nur berichtet, ist ehrlich — und liefert genau die Angabe, die fehlt.
//
// ── DER BEOBACHTETE FALL (14.08.2026, Browser-Konsole) ────────────────────
//
//   Could not save theme to Firestore FirebaseError: PERMISSION_DENIED:
//   evaluation error at L169:24 for 'create' @ L169,
//   false for 'update' @ L181, false for 'update' @ L181
//
// Ausgelöst von `ThemeProvider.tsx` mit
//
//   setDoc(doc(db, 'users', uid), { theme: 'dark' }, { merge: true })
//
// auf ein Dokument, das es NOCH NICHT GAB. Firestore wertet ein `merge` auf
// ein fehlendes Dokument als `create` — deshalb landet der Aufruf in der
// `allow create`-Regel (Zeile 169) und nicht in `allow update` (181).
//
// ── WARUM DAS WICHTIGER IST ALS DER GAST-FALL ─────────────────────────────
// `evaluation error` ist NICHT dasselbe wie `false`. `false` heisst: Die
// Regel hat entschieden und abgelehnt. `evaluation error` heisst: Die Regel
// ist beim Rechnen abgestürzt. Eine abgestürzte Regel lehnt zwar ebenfalls
// ab — aber aus dem falschen Grund, und man weiss nicht, wann sie das nächste
// Mal an anderer Stelle abstürzt.
//
// Vor allem: Der Fall hängt NICHT am Gastkonto. Er kann jedes Konto beim
// allerersten Teil-Schreibvorgang treffen. Genau das prüft Abschnitt 2.
//
// ── WAS DIESE DATEI EINGRENZT ─────────────────────────────────────────────
//   1. Gast, Teil-Schreibvorgang auf fehlendes Dokument   (der beobachtete)
//   2. ANGEMELDET, derselbe Vorgang                        (die eigentliche Frage)
//   3. ANGEMELDET, vollständiges Anlegen                   (Gegenstück)
//   4. ANGEMELDET, `theme` auf VORHANDENES Dokument        (Gegenstück)
//
// Ergibt 2 einen Fehler und 3 einen Erfolg, liegt es am Teil-Schreibvorgang
// ohne die Pflichtfelder aus `isValidUser` — und der Wortlaut aus dem
// Protokoll sagt, an welcher Teilbedingung.
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

before(async () => {
  const [wirt, hafen] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':');
  env = await initializeTestEnvironment({
    projectId: 'demo-klar',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: wirt || '127.0.0.1',
      port: Number(hafen) || 8080,
    },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

/**
 * Führt einen Schreibvorgang aus und PROTOKOLLIERT das Ergebnis.
 * Wirft nie — der Zweck ist die Auskunft, nicht das Urteil.
 */
async function protokolliere(name: string, tuWas: () => Promise<unknown>): Promise<void> {
  try {
    await tuWas();
    console.log(`\n  [${name}]\n    ERGEBNIS: durchgelassen\n`);
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler);
    const art = /evaluation error/i.test(meldung)
      ? 'REGEL ABGESTUERZT (evaluation error)'
      : /PERMISSION_DENIED|permission-denied/i.test(meldung)
        ? 'sauber abgelehnt'
        : 'anderer Fehler';
    console.log(`\n  [${name}]\n    ERGEBNIS: ${art}\n    WORTLAUT: ${meldung}\n`);
  }
}

describe('Diagnose: Teil-Schreibvorgang auf ein fehlendes Nutzerdokument', () => {
  // 1 — der beobachtete Fall. Gast, `merge` auf ein Dokument, das es nicht
  //     gibt. Erwartet wird eine Ablehnung (GAST-01). Die Frage ist, OB sie
  //     sauber ist oder ein Absturz.
  it('1 · Gast schreibt nur `theme` (Dokument fehlt)', async () => {
    const gast = env.authenticatedContext('gast', {
      firebase: { sign_in_provider: 'anonymous' },
    }).firestore();
    await protokolliere('1 Gast, nur theme, Dokument fehlt', () =>
      setDoc(doc(gast, 'users/gast'), { theme: 'dark' }, { merge: true }),
    );
  });

  // 2 — DIE EIGENTLICHE FRAGE. Ein normal angemeldetes Konto, derselbe
  //     Vorgang. Trifft es auch hier, ist es kein Gast-Thema.
  it('2 · Angemeldetes Konto schreibt nur `theme` (Dokument fehlt)', async () => {
    const anna = env.authenticatedContext('anna', {
      firebase: { sign_in_provider: 'password' },
    }).firestore();
    await protokolliere('2 Angemeldet, nur theme, Dokument fehlt', () =>
      setDoc(doc(anna, 'users/anna'), { theme: 'dark' }, { merge: true }),
    );
  });

  // 3 — Gegenstück: vollständiges Anlegen mit allen Pflichtfeldern.
  //     Gelingt das, liegt es am fehlenden Pflichtfeld und nicht am
  //     Anlegen an sich.
  it('3 · Angemeldetes Konto legt vollstaendig an', async () => {
    const anna = env.authenticatedContext('anna', {
      firebase: { sign_in_provider: 'password' },
    }).firestore();
    await protokolliere('3 Angemeldet, vollstaendiges create', () =>
      setDoc(doc(anna, 'users/anna'), {
        uid: 'anna',
        createdAt: '2026-08-14',
        updatedAt: '2026-08-14',
        theme: 'dark',
      }),
    );
  });

  // 4 — Gegenstück: `theme` auf ein VORHANDENES Dokument. `theme` steht in
  //     der erlaubten Liste von `isValidUserUpdate`; das muss gelingen.
  //     Tut es das nicht, ist DAT-07 nicht vollstaendig behoben.
  it('4 · Angemeldetes Konto aendert `theme` am vorhandenen Dokument', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/anna'), {
        uid: 'anna',
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01',
      });
    });
    const anna = env.authenticatedContext('anna', {
      firebase: { sign_in_provider: 'password' },
    }).firestore();
    await protokolliere('4 Angemeldet, theme am vorhandenen Dokument', () =>
      setDoc(doc(anna, 'users/anna'), { theme: 'dark', updatedAt: '2026-08-14' }, { merge: true }),
    );
  });
});
