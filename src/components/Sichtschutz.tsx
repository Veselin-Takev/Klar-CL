import { useEffect, useRef, useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// Sichtschutz — den Bildschirm sofort verdecken
//
// ── BEFUND 11.08.2026 ─────────────────────────────────────────────────────
// Die Sperre existierte, war aber nicht einschaltbar. In `Dashboard.tsx`
// standen `useState(false)`, ein vollständiger Sperrbildschirm und ein
// Knopf `setIsLocked(false)`. `setIsLocked(true)` kam im ganzen Projekt
// nicht vor — in der Historie dieses Repos nie. Neunter Fall derselben
// Sorte: Der Bildschirm ist da, nur öffnet ihn niemand.
//
// Drei Dinge sind beim Wiederherstellen bewusst anders:
//
// 1. NICHT IM DASHBOARD, SONDERN ÜBER ALLEM. Die alte Sperre deckte einen
//    von vier Bildschirmen ab. Die schutzbedürftigen Inhalte stehen aber in
//    den Gesprächen, nicht auf dem Dashboard. Ein Sichtschutz, der den Chat
//    offen lässt, ist keiner.
//
// 2. VERDECKEN STATT WEICHZEICHNEN. Weichgezeichneter Text bleibt aus dem
//    richtigen Winkel und auf einem Bildschirmfoto lesbar, und die
//    Restform verrät bereits, dass da ein Gesprächsverlauf steht. Eine
//    deckende Fläche lässt keine Auslegung zu.
//
// 3. KEIN VERSPRECHEN, DAS NICHT EINGELÖST WIRD. Der alte Text lautete
//    „Bitte entsperren (PIN / FaceID)" — der Knopf hiess „Entsperren
//    (Demo)" und entsperrte ohne jede Prüfung. Das ist derselbe Fall wie
//    „End-to-End gesichert" im Login, das am 09.08.2026 wegen § 5 UWG
//    entfernt wurde. Hier steht jetzt, was es wirklich ist.
//
// ── WAS DIESE FUNKTION LEISTET UND WAS NICHT ──────────────────────────────
// Sie schützt vor dem Blick über die Schulter: im Zug, im Wartezimmer, wenn
// jemand den Raum betritt. Sie schützt NICHT vor jemandem, der das
// entsperrte Gerät in der Hand hält — ein Tipp genügt zum Entsperren. Das
// steht so auch auf dem Bildschirm, damit niemand mehr hineinliest, als da
// ist. Entschieden am 11.08.2026 gemeinsam mit dem Auftraggeber.
// ═══════════════════════════════════════════════════════════════════════════

/** Von überall auslösbar, ohne die Komponente durchreichen zu müssen.
 *  Dasselbe Muster wie `KONTINGENT_AKTUALISIEREN` in KontingentAnzeige.tsx. */
export const SICHTSCHUTZ_EIN = 'klar:sichtschutz';

/** Sichtschutz aus beliebigem Code aktivieren. */
export function aktiviereSichtschutz(): void {
  window.dispatchEvent(new Event(SICHTSCHUTZ_EIN));
}

export function Sichtschutz() {
  const [aktiv, setAktiv] = useState(false);
  const entsperrenRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const ein = () => setAktiv(true);

    // Beim Verlassen der App verdecken. Das ist der eigentliche Fall: Das
    // Gerät wird weggelegt, jemand nimmt es hoch. `visibilitychange` löst
    // beim Wechsel des Tabs, beim Sperren des Geräts und beim Wechsel in
    // eine andere App aus.
    //
    // ABSICHTLICH NUR IN EINE RICHTUNG: Beim Zurückkommen wird NICHT
    // automatisch entsperrt. Sonst wäre die Sperre wirkungslos, sobald das
    // Betriebssystem die Seite kurz in den Hintergrund schiebt.
    const beiSichtwechsel = () => {
      if (document.visibilityState === 'hidden') setAktiv(true);
    };

    window.addEventListener(SICHTSCHUTZ_EIN, ein);
    document.addEventListener('visibilitychange', beiSichtwechsel);
    return () => {
      window.removeEventListener(SICHTSCHUTZ_EIN, ein);
      document.removeEventListener('visibilitychange', beiSichtwechsel);
    };
  }, []);

  // Der Fokus muss auf den Entsperren-Knopf. Ohne das bliebe er im
  // verdeckten Inhalt stehen — mit Tastatur oder Screenreader wäre der
  // Bildschirm dann verdeckt, aber weiter bedienbar.
  useEffect(() => {
    if (aktiv) entsperrenRef.current?.focus();
  }, [aktiv]);

  if (!aktiv) {
    return (
      <button
        onClick={() => setAktiv(true)}
        // Immer erreichbar, ohne einen Inhalt zu verdecken. Links unten,
        // weil rechts unten in dieser App der Fehler-Testknopf und die
        // Navigationsleiste sitzen.
        className="fixed bottom-24 left-4 z-40 p-3 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-lg hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
        aria-label="Bildschirm verdecken"
        title="Bildschirm verdecken"
      >
        <EyeOff size={20} />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bildschirm verdeckt"
      // z-[300] liegt über allem: über der Navigationsleiste (z-40), über
      // dem Filter-Auszug (z-[200]) und über GlobalErrorOverlay (z-[100]).
      // Ein Sichtschutz, über den sich etwas legen kann, ist keiner.
      className="fixed inset-0 z-[300] bg-stone-900 flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mb-5">
        <EyeOff size={28} className="text-stone-300" />
      </div>

      <h2 className="text-xl font-serif text-white mb-2">Bildschirm verdeckt</h2>

      <p className="text-sm text-stone-300 max-w-xs mb-1">
        Niemand sieht, was du gerade liest.
      </p>
      {/* Der zweite Satz ist die Einschränkung. Er steht bewusst hier und
          nicht in einer Hilfeseite: Wer sich auf den Schutz verlässt, soll
          zugleich sehen, wo er endet. */}
      <p className="text-xs text-stone-400 max-w-xs mb-8">
        Ein Tipp genügt zum Aufdecken — das schützt vor fremden Blicken,
        nicht vor jemandem, der dein entsperrtes Gerät in der Hand hat.
      </p>

      <button
        ref={entsperrenRef}
        onClick={() => setAktiv(false)}
        className="px-8 py-3 bg-brand text-white rounded-full font-medium shadow-lg flex items-center gap-2"
      >
        <Eye size={18} /> Wieder anzeigen
      </button>
    </div>
  );
}
