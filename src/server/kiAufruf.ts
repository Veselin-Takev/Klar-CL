import {
  STRATEGIE,
  ZEITGRENZE_MS,
  VERSUCHE,
  klassifiziereKiFehler,
  lohntWiederholung,
  wartezeitMs,
  entscheideAntwort,
  erfolg,
} from './kiPolitik';
import type { Antwort, Ersatzstrategie, KiFehlerCode } from './kiPolitik';

// ═══════════════════════════════════════════════════════════════════════════
// Klar — der eine Weg, auf dem ein KI-Aufruf stattfindet
//
// ── BEFUND 11.08.2026, der schwerste des Projekts ─────────────────────────
// `kiPolitik.ts` — 330 Zeilen Regelwerk, 20 Tests, eine eigene Matrix mit 53
// zugeordneten Endpunkten — hatte NULL Aufrufer im Produktionscode. Eine
// Suche über den gesamten Baum, Testdateien ausgenommen, ergab 0 Treffer.
//
// Die 20 Tests bestehen, weil sie das Modul direkt aufrufen. Sie bewachen
// eine Regel, die im laufenden Betrieb nicht angewandt wurde. Damit war der
// Zustand schlechter als vor der Einführung: Es gab jetzt zusätzlich den
// Anschein, das Problem sei gelöst.
//
// Derselbe Fehlertyp wie `@ts-nocheck`, wie die Zeichenketten-Zähler und wie
// `expect(true).toBe(true)`: Eine Prüfung, die nichts ansieht, meldet nichts
// und sieht grün aus.
//
// ── WAS DIESE DATEI TUT ───────────────────────────────────────────────────
// Sie ist die einzige Stelle, an der ein KI-Aufruf ausgeführt wird. Sie
// bringt vier Dinge mit, die vorher an 50 von 55 Aufrufstellen fehlten:
//
//   1. ZEITGRENZE. Gemessen am 11.08.2026: 6 von 55 Aufrufen hatten eine.
//      Ein hängender Aufruf blockierte die Anfrage, bis der Client aufgab.
//   2. WIEDERHOLUNG. Gemessen: 0 von 55. Ein Kontingentfehler oder eine
//      Zeitüberschreitung ist oft beim zweiten Versuch weg.
//   3. JSON-PRÜFUNG. Gemessen: 51 `JSON.parse` auf Modellantworten. Gibt das
//      Modell statt JSON einen Satz zurück, lief das in einen SyntaxError —
//      der dann als „Serverfehler" beim Nutzer ankam.
//   4. DIE ERSATZREGEL. `entscheideAntwort` aus `kiPolitik.ts`, endlich im
//      Anfrageweg statt daneben.
//
// ── WAS SIE BEWUSST NICHT TUT ─────────────────────────────────────────────
// Sie kennt den Inhalt der Aufrufe nicht. Prompt, Modell und Konfiguration
// bleiben beim Endpunkt — dieses Modul entscheidet nur über Ablauf und
// Ausfall. Sonst wäre es der nächste Ort, an dem jeder etwas anbaut.
//
// Sie erfindet nichts. Ein `kuratiert`-Inhalt muss von der aufrufenden
// Stelle mitgegeben werden und ist dann von Menschen geschrieben; kommt
// keiner, wird ehrlich gescheitert.
// ═══════════════════════════════════════════════════════════════════════════

/** Was ein Aufruf zurückgibt: Text der Modellantwort, sonst nichts. */
export interface KiRohantwort {
  text?: string | null;
}

/**
 * Der eigentliche Aufruf, vom Endpunkt mitgegeben. Bekommt ein
 * `AbortSignal` und muss es an das SDK durchreichen — sonst greift die
 * Zeitgrenze zwar für uns, der Aufruf läuft aber im Hintergrund weiter.
 */
export type Aufruf = (signal: AbortSignal) => Promise<KiRohantwort>;

export interface Beiwerk {
  /** Für Endpunkte mit Strategie `zwischenspeicher`. */
  zwischenspeicher?: { daten: Record<string, unknown>; zeit: string } | null;
  /** Für Endpunkte mit Strategie `kuratiert`. Von Menschen geschrieben. */
  kuratiert?: Record<string, unknown> | null;
  /** Abweichende Zeitgrenze, etwa für erwartbar lange Auswertungen. */
  zeitgrenzeMs?: number;
  /** Erwartet der Endpunkt JSON? Dann wird geparst und geprüft. */
  json?: boolean;
}

/** Ergebnis eines Rohaufrufs — ohne Ersatzregel, nur Erfolg oder Fehlercode. */
export type Rohergebnis =
  | { ok: true; text: string }
  | { ok: false; code: KiFehlerCode };

/**
 * Führt den Aufruf aus: mit Zeitgrenze, mit Wiederholung, ohne Ersatzregel.
 * Für die seltenen Fälle, in denen der Endpunkt die Antwort selbst formen
 * muss. Im Normalfall nimmt man `beantworte`.
 */
export async function rufeKi(aufruf: Aufruf, zeitgrenzeMs = ZEITGRENZE_MS): Promise<Rohergebnis> {
  let letzter: KiFehlerCode = 'ki_fehler';

  for (let versuch = 1; versuch <= VERSUCHE; versuch++) {
    const abbruch = new AbortController();
    // BEFUND beim ersten Testlauf 11.08.2026: Hier stand zusätzlich
    // `uhr.unref()`, und weiter unten dasselbe am Wartezeitgeber. Ein
    // abgemeldeter Zeitgeber hält die Ereignisschleife nicht am Leben —
    // beim Wartezeitgeber führte das dazu, dass der Prozess ausstieg,
    // während die Wiederholung noch wartete. Die Testausgabe lautete
    // „Promise resolution is still pending but the event loop has already
    // resolved". Aufgefallen nur, weil der Test tatsächlich gelaufen ist.
    //
    // Kein `unref` mehr: Der Abbruchzeitgeber wird im `finally` ohnehin
    // gelöscht, der Wartezeitgeber läuft höchstens vier Sekunden.
    const uhr: ReturnType<typeof setTimeout> = setTimeout(() => abbruch.abort(), zeitgrenzeMs);

    try {
      const roh = await aufruf(abbruch.signal);
      const text = typeof roh?.text === 'string' ? roh.text.trim() : '';
      if (text.length === 0) {
        // Eine leere Antwort ist kein Erfolg. Vorher wurde daraus an
        // mehreren Stellen ein leeres Objekt und damit eine „Auswertung".
        letzter = 'ki_leer';
      } else {
        return { ok: true, text };
      }
    } catch (e) {
      letzter = abbruch.signal.aborted ? 'ki_zeitueberschreitung' : klassifiziereKiFehler(e);
    } finally {
      clearTimeout(uhr);
    }

    if (versuch < VERSUCHE && lohntWiederholung(letzter)) {
      await new Promise((f) => setTimeout(f, wartezeitMs(versuch)));
      continue;
    }
    break;
  }

  return { ok: false, code: letzter };
}

/**
 * Schneidet die Zäune weg, die Modelle gern um JSON legen:
 * ```
 * ```json
 * { … }
 * ```
 * ```
 * Das war bisher an 51 Stellen die häufigste Ursache für einen
 * `SyntaxError` in `JSON.parse`.
 */
export function schaeleJson(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '').trim();
  }
  // Manche Antworten stellen einen Satz voran. Wenn ein Objekt oder Array
  // erkennbar ist, wird davon ausgegangen — sonst bleibt der Text, wie er
  // ist, und `JSON.parse` scheitert regulär.
  const ersteKlammer = t.search(/[[{]/);
  if (ersteKlammer > 0) {
    const letzte = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
    if (letzte > ersteKlammer) t = t.slice(ersteKlammer, letzte + 1);
  }
  return t;
}

/**
 * Der Normalfall. Führt den Aufruf aus und liefert eine fertige Antwort —
 * bei Erfolg mit `herkunft: 'ki'`, bei Ausfall nach der in `kiPolitik.ts`
 * für diesen Endpunkt hinterlegten Strategie.
 *
 * Der Endpunktname muss in `STRATEGIE` stehen. Fehlt er, wird bewusst
 * `kein_ersatz` angenommen — die strengste Regel — und zusätzlich gewarnt.
 * `scripts/kiErsatzPruefung.mjs` fängt den Fall schon vor dem Start ab.
 */
export async function beantworte(
  endpunkt: string,
  aufruf: Aufruf,
  beiwerk: Beiwerk = {},
): Promise<Antwort> {
  const strategie: Ersatzstrategie = STRATEGIE[endpunkt] ?? 'kein_ersatz';
  if (!STRATEGIE[endpunkt]) {
    console.warn(
      `[kiAufruf] Endpunkt "${endpunkt}" steht nicht in kiPolitik.STRATEGIE. ` +
        'Es gilt kein_ersatz. Eintrag ergaenzen.',
    );
  }

  const ergebnis = await rufeKi(aufruf, beiwerk.zeitgrenzeMs);

  if (ergebnis.ok) {
    if (beiwerk.json === false) return erfolg({ text: ergebnis.text });
    try {
      const daten = JSON.parse(schaeleJson(ergebnis.text)) as unknown;
      if (daten === null || typeof daten !== 'object') {
        // Eine Zahl oder ein Wahrheitswert ist zwar gültiges JSON, aber
        // keine Auswertung. Das als Ergebnis durchzulassen hiesse, eine
        // Antwort zu behaupten, die es nicht gibt.
        return entscheideAntwort(
          strategie,
          'ki_ungueltig',
          beiwerk.zwischenspeicher ?? null,
          beiwerk.kuratiert ?? null,
        );
      }
      return erfolg(daten as Record<string, unknown>);
    } catch {
      return entscheideAntwort(
        strategie,
        'ki_ungueltig',
        beiwerk.zwischenspeicher ?? null,
        beiwerk.kuratiert ?? null,
      );
    }
  }

  return entscheideAntwort(
    strategie,
    ergebnis.code,
    beiwerk.zwischenspeicher ?? null,
    beiwerk.kuratiert ?? null,
  );
}

/**
 * Prüft den Schlüssel, bevor überhaupt ein Aufruf versucht wird.
 * Gemessen am 11.08.2026: 5 von 55 Aufrufstellen taten das. Die übrigen 50
 * liefen in einen SDK-Fehler, dessen Text je nach Version anders lautet.
 */
export function schluesselFehlt(): boolean {
  const s = process.env.GEMINI_API_KEY;
  return typeof s !== 'string' || s.trim().length === 0;
}

/** Antwort für den Fall „kein Schlüssel", nach derselben Strategietabelle. */
export function ohneSchluessel(endpunkt: string, beiwerk: Beiwerk = {}): Antwort {
  return entscheideAntwort(
    STRATEGIE[endpunkt] ?? 'kein_ersatz',
    'ki_kein_schluessel',
    beiwerk.zwischenspeicher ?? null,
    beiwerk.kuratiert ?? null,
  );
}
