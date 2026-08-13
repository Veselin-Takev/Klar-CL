// ═══════════════════════════════════════════════════════════════════════════
// Übersetzung von Nachrichten — die einzige Stelle, an der übersetzt wird
//
// ── BEFUND 14.08.2026, DER DIESEN UMBAU AUSGELÖST HAT ─────────────────────
// Die alte `translateMessage` gab bei JEDEM Fehler den Originaltext zurück:
//
//     } catch (err) {
//       console.warn("Übersetzung nicht möglich, zeige Originaltext:", err);
//       resolve(text);          // <- ununterscheidbar vom Erfolg
//     }
//
// Der Aufrufer konnte damit nicht erkennen, ob übersetzt wurde oder nicht.
// `MessageBubble` behalf sich mit `res !== original` — was jede Nachricht,
// die bereits in der Zielsprache stand, faelschlich als „fehlgeschlagen"
// meldete, und jeden echten Fehler als „war schon richtig" durchgehen liess.
//
// Das ist dieselbe Regel, die am 10.08. auf dem Server durchgesetzt wurde:
// **Ein Ersatzwert, der vom echten Ergebnis nicht zu unterscheiden ist,
// verbirgt den Fehler, den er behandelt.** Deshalb gibt es hier jetzt ein
// Ergebnis mit `ok`, genau wie `herkunft` in `kiPolitik.ts`.
//
// ── DIE AUSTAUSCHBARE STELLE ──────────────────────────────────────────────
// `uebersetze()` ist die EINZIGE Stelle in der App, die einen
// Übersetzungsdienst aufruft. Das ist Absicht und wird gebraucht:
// Ende-zu-Ende-Verschlüsselung der Chats ist geplant (Entscheidung vom
// 14.08.2026). Sobald der Server den Klartext nicht mehr sieht, kann er
// nicht mehr übersetzen — dann tritt an dieser Stelle eine Übersetzung im
// Gerät an die Stelle des Serveraufrufs. Alles darüber, die gesamte
// Oberfläche, bleibt unverändert.
//
// Damit das so bleibt: **Nirgendwo sonst `/api/translate` aufrufen.**
//
// ── WAS BEWUSST NICHT PASSIERT ────────────────────────────────────────────
// Kein Zwischenspeicher ausserhalb dieser Sitzung. Die `Map` unten lebt im
// Arbeitsspeicher und ist beim Neuladen weg. Übersetzte Nachrichten auf dem
// Server oder im localStorage zu hinterlegen waere bei geplanter
// Ende-zu-Ende-Verschluesselung genau das, was man dann nicht mehr will.
// ═══════════════════════════════════════════════════════════════════════════

export interface Uebersetzung {
  /** Der Text, der angezeigt werden darf. Bei `ok: false` der Originaltext. */
  text: string;
  /** Wurde tatsächlich übersetzt? Nur dann darf „übersetzt" drangeschrieben
   *  werden. */
  ok: boolean;
  /** Menschenlesbarer Grund, wenn es nicht geklappt hat. Kommt nach
   *  Möglichkeit vom Server — der weiss mehr als wir. */
  grund?: string;
}

const speicher = new Map<string, Uebersetzung>();
const laufend = new Map<string, Promise<Uebersetzung>>();

/**
 * Übersetzt einen Text in die genannte Sprache.
 *
 * @param text  Der Originaltext. Leerer Text wird nicht verschickt.
 * @param zielsprache  Lesbarer Name, z. B. "Englisch" — so erwartet es
 *                     `/api/translate` (server.ts:2427).
 */
export async function uebersetze(text: string, zielsprache: string): Promise<Uebersetzung> {
  if (!text.trim()) return { text, ok: false, grund: 'Kein Text.' };

  const schluessel = `${zielsprache}:${text}`;
  const bekannt = speicher.get(schluessel);
  if (bekannt) return bekannt;
  const inArbeit = laufend.get(schluessel);
  if (inArbeit) return inArbeit;

  const versprechen = (async (): Promise<Uebersetzung> => {
    try {
      // Einfaches `fetch` genügt: `installAuthFetch()` (main.tsx:12) ersetzt
      // beim Start `window.fetch` und hängt das Anmeldetoken an jeden
      // eigenen `/api`-Aufruf an. Ein zusätzlicher Header hier wäre eine
      // zweite Stelle für dieselbe Sache.
      const antwort = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: zielsprache }),
      });

      const daten = await antwort.json().catch(() => ({}) as Record<string, unknown>);

      if (!antwort.ok) {
        // Die Meldung des Servers mitnehmen, statt sie durch eine eigene zu
        // ersetzen. „Translation API returned an error" hat monatelang
        // verschwiegen, dass es ein 400 wegen falscher Feldnamen war.
        const grund =
          typeof daten['error'] === 'string'
            ? (daten['error'] as string)
            : `Übersetzung: HTTP ${antwort.status}`;
        return { text, ok: false, grund };
      }

      const uebersetzt = daten['translatedText'];
      if (typeof uebersetzt !== 'string' || !uebersetzt.trim()) {
        return { text, ok: false, grund: 'Es kam kein Ergebnis zurück.' };
      }

      const ergebnis: Uebersetzung = { text: uebersetzt, ok: true };
      speicher.set(schluessel, ergebnis);
      return ergebnis;
    } catch (fehler) {
      // `warn`, nicht `error`: Der Fall ist behandelt — der Originaltext
      // wird angezeigt, und der Aufrufer weiss es an `ok: false`.
      console.warn('Übersetzung nicht möglich, zeige Originaltext:', fehler);
      return {
        text,
        ok: false,
        grund: fehler instanceof Error ? fehler.message : 'Netzwerkfehler.',
      };
    } finally {
      laufend.delete(schluessel);
    }
  })();

  laufend.set(schluessel, versprechen);
  return versprechen;
}
