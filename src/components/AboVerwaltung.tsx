import { useEffect, useState } from "react";
import { aboStatus, kuendige, widerrufe, type AboStatus } from "../lib/klar";

// ═══════════════════════════════════════════════════════════════════════════
// P1 — § 312k BGB (Kündigung) und § 356a BGB (Widerruf)
//
// Zwei verschiedene Rechte mit zwei verschiedenen Folgen. Der Widerruf
// beseitigt den Vertrag rückwirkend, die Kündigung beendet ihn für die
// Zukunft. Sie dürfen NICHT zu einem Weg zusammengefasst werden.
//
// § 312k Abs. 1: unmittelbar und leicht zugänglich, ohne Zwischenschritte.
// Fehlt die Schaltfläche oder ist sie nicht ordnungsgemäß, ist der Vertrag
// nach Abs. 6 jederzeit fristlos kündbar — der Anbieter verliert nicht nur
// einen Prozessschritt, sondern die Vertragsbindung.
//
// Deshalb hier: kein Rückhaltebildschirm, kein Rabattangebot, keine Umfrage
// davor. Der Grund ist freiwillig und wird NACH der Bestätigung gefragt.
// ═══════════════════════════════════════════════════════════════════════════

export function AboVerwaltung() {
  const [stand, setStand] = useState<AboStatus | null>(null);
  const [laeuft, setLaeuft] = useState<"kuendigung" | "widerruf" | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);

  async function laden() {
    try { setStand(await aboStatus()); } catch { setStand(null); }
  }
  useEffect(() => { void laden(); }, []);

  if (!stand) return null;

  async function ausfuehren(was: "kuendigung" | "widerruf") {
    setFehler(null); setErfolg(null); setLaeuft(was);
    try {
      if (was === "kuendigung") {
        const r = await kuendige();
        setErfolg(r.paidUntil
          ? `Gekündigt. Dein Zugang bleibt bis ${new Date(r.paidUntil).toLocaleDateString("de-DE")} bestehen.`
          : "Gekündigt.");
      } else {
        const r = await widerrufe();
        setErfolg(`Widerrufen. Der Vertrag endet sofort (${new Date(r.endetAm).toLocaleDateString("de-DE")}); der gezahlte Betrag wird erstattet.`);
      }
      await laden();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Das hat nicht geklappt.");
    } finally {
      setLaeuft(null);
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700">
      <h4 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4">Vertrag</h4>

      <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl mb-3">
        <span className="text-sm text-stone-700 dark:text-stone-300">Aktueller Plan</span>
        <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
          {stand.plan === "plus" ? "Klar Plus" : "Klar (kostenfrei)"}
        </span>
      </div>

      {erfolg ? <p role="status" className="mb-3 text-sm text-stone-700 dark:text-stone-300">{erfolg}</p> : null}
      {fehler ? <p role="alert" className="mb-3 text-sm text-red-700 dark:text-red-300">{fehler}</p> : null}

      {stand.plan === "plus" && !stand.cancelledAt ? (
        <button
          onClick={() => ausfuehren("kuendigung")}
          disabled={laeuft !== null}
          className="w-full min-h-11 px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-600 text-sm font-medium text-stone-800 dark:text-stone-200 mb-3 disabled:opacity-60"
        >
          {laeuft === "kuendigung" ? "Wird gekündigt …" : "Vertrag kündigen"}
        </button>
      ) : null}

      {stand.cancelledAt ? (
        <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
          Gekündigt am {new Date(stand.cancelledAt).toLocaleDateString("de-DE")}.
          {stand.paidUntil ? ` Zugang bis ${new Date(stand.paidUntil).toLocaleDateString("de-DE")}.` : ""}
        </p>
      ) : null}

      {/* Eigenständige Pflicht seit 19.06.2026 — nicht dieselbe Schaltfläche
          wie die Kündigung, weil die Rechtsfolge eine andere ist. */}
      {stand.widerrufMoeglich ? (
        <>
          <button
            onClick={() => ausfuehren("widerruf")}
            disabled={laeuft !== null}
            className="w-full min-h-11 px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-600 text-sm font-medium text-stone-800 dark:text-stone-200 disabled:opacity-60"
          >
            {laeuft === "widerruf" ? "Wird widerrufen …" : "Vertrag widerrufen"}
          </button>
          <p className="mt-2 text-xs text-stone-500">
            Widerruf ist innerhalb von 14 Tagen ab Vertragsschluss möglich und
            beendet den Vertrag rückwirkend. Danach bleibt die Kündigung.
          </p>
        </>
      ) : null}
    </div>
  );
}
