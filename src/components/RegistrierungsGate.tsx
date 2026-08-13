// ═══════════════════════════════════════════════════════════════════════════
// Registrierungs-Gate — was ein Gast sieht, wenn er etwas tun will
//
// ── WOZU ──────────────────────────────────────────────────────────────────
// Seit dem 14.08.2026 antwortet der Server auf Handlungen, die eine
// Interaktion mit anderen Menschen auslösen, mit HTTP 403 und dem Code
// `konto_erforderlich` (`src/server/gastrechte.ts`). Ohne diesen Dialog
// bliebe davon nur eine rote Zeile in der Konsole — die Person tippt auf
// „Icebreaker" und es passiert nichts.
//
// ── WARUM EIN EREIGNIS UND KEIN PROP ──────────────────────────────────────
// Der Auslöser kann an 116 Stellen entstehen. `authFetch` erkennt ihn an
// EINER Stelle und meldet ihn als Ereignis; dieser Dialog hört zu. Damit
// muss keine der 116 Stellen etwas davon wissen — dieselbe Begründung wie
// beim Anhängen des Anmeldetokens.
//
// ── WAS ER NICHT TUT ──────────────────────────────────────────────────────
// Er meldet niemanden um und legt kein Konto an. Er erklärt, warum es hier
// nicht weitergeht, und bietet den Weg an. Ein Dialog, der ungefragt
// abmeldet, würde einem Gast seine Sitzung nehmen — und damit das, was er
// gerade angesehen hat.
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
// Das Projekt benutzt react-router v8. Dort ist react-router-dom
// aufgegangen; ein Import daraus schlaegt mit TS2307 fehl. Alle 14 anderen
// Stellen im Projekt importieren aus "react-router" — meine war die einzige
// Abweichung, und der Typecheck hat sie sofort gefunden.
import { useNavigate } from "react-router";

const VORGABE_TEXT =
  "Erstelle in wenigen Sekunden ein kostenloses Konto, um mit diesem Profil in Kontakt zu treten.";

export function RegistrierungsGate() {
  const [offen, setOffen] = useState(false);
  const [grund, setGrund] = useState<string>(VORGABE_TEXT);
  const navigate = useNavigate();

  useEffect(() => {
    const beiEreignis = (e: Event) => {
      const detail = (e as CustomEvent).detail as { grund?: string } | undefined;
      setGrund(detail?.grund || VORGABE_TEXT);
      setOffen(true);
    };
    window.addEventListener("klar_konto_erforderlich", beiEreignis);
    return () => window.removeEventListener("klar_konto_erforderlich", beiEreignis);
  }, []);

  if (!offen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-titel"
    >
      <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-xl border border-stone-100 dark:border-stone-800">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light flex items-center justify-center shrink-0">
            <UserPlus size={22} aria-hidden="true" />
          </div>
          <button
            onClick={() => setOffen(false)}
            className="p-2 -mr-2 -mt-2 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Hinweis schliessen"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <h2 id="gate-titel" className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-2">
          Dafür brauchst du ein Konto
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">{grund}</p>

        {/* Ehrlich benennen, was bleibt und was nicht. Ein Gastzugang ist
            beim naechsten Besuch weg; das gehoert hierhin und nicht ins
            Kleingedruckte. */}
        <p className="text-xs text-stone-400 dark:text-stone-500 mb-5">
          Als Gast kannst du Profile ansehen und die Werkzeuge ausprobieren.
          Dein Gastzugang endet, wenn du die App schliesst.
        </p>

        <button
          onClick={() => {
            setOffen(false);
            navigate("/");
          }}
          className="w-full py-4 bg-brand text-white rounded-2xl font-medium text-lg flex items-center justify-center gap-3 hover:bg-brand-dark transition-colors shadow-sm"
        >
          <UserPlus size={20} aria-hidden="true" />
          Kostenloses Konto erstellen
        </button>

        <button
          onClick={() => setOffen(false)}
          className="w-full mt-2 py-3 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 text-sm"
        >
          Weiter als Gast
        </button>
      </div>
    </div>
  );
}

export default RegistrierungsGate;
