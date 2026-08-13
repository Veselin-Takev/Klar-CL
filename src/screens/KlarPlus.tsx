// ═══════════════════════════════════════════════════════════════════════════
// Klar+ — eine eigene Seite statt 600 px mitten in den Einstellungen
//
// ── WOZU ──────────────────────────────────────────────────────────────────
// Bis zum 14.08.2026 stand die Vergleichstabelle als acht Zeilen mal drei
// Spalten im Reiter „Einstellungen" der Profilseite — zwischen der
// Fokuszeit und der Erscheinungsbild-Wahl. Zwei Dinge stimmten daran nicht:
//
//   · Wer die Helligkeit umstellen will, scrollt an einem Verkaufsangebot
//     vorbei. Das ist die Bauform, die man von den Apps kennt, gegen die
//     Klar antritt.
//   · Der Knopf „Klar+ entdecken" hatte kein `onClick`. Er sah aus wie ein
//     Weg und war keiner. `/api/subscribe-klar-plus` antwortet mit HTTP 501,
//     weil die Zahlungsabwicklung fehlt (server.ts) — der Knopf hätte also
//     ohnehin nirgendwo hingeführt.
//
// Siehe klar/27-profilseite-layout, Abschnitte 9b und 9c.
//
// ── WAS HIER ANDERS IST ───────────────────────────────────────────────────
// · Die Inhalte stehen in `src/lib/klarPlus.ts` und werden dort geprüft.
//   Diese Datei rendert nur, was dort steht — sie erfindet keine Zeile.
// · Kein Kaufknopf, solange `BUCHBAR === false`. Stattdessen ein Satz, der
//   den Stand nennt. Ein Kaufknopf vor einer 501 ist eine Sackgasse mit
//   Beschriftung.
// · Die Tabelle hat `<th scope>` in beiden Richtungen. Ohne `scope` liest
//   eine Vorlesehilfe eine Zelle als „Häkchen" vor, ohne zu sagen, wozu.
// ═══════════════════════════════════════════════════════════════════════════
import { Link } from "react-router";
import { ArrowLeft, Check, Minus } from "lucide-react";
import {
  LEISTUNGEN,
  ACHSEN,
  ACHSEN_REIHENFOLGE,
  HINWEIS_NICHT_BUCHBAR,
  type Wert,
} from "../lib/klarPlus";

/** Eine Zelle. Symbole bekommen einen vorlesbaren Text daneben, nicht statt. */
function Feld({ wert, spalte }: { wert: Wert; spalte: string }) {
  if (wert.art === "ja") {
    return (
      <>
        <Check size={16} className="mx-auto text-accent" aria-hidden="true" />
        <span className="sr-only">in {spalte} enthalten</span>
      </>
    );
  }
  if (wert.art === "nein") {
    return (
      <>
        <Minus size={16} className="mx-auto text-muted" aria-hidden="true" />
        <span className="sr-only">in {spalte} nicht enthalten</span>
      </>
    );
  }
  return <span>{wert.text}</span>;
}

export default function KlarPlus() {
  return (
    <div className="min-h-[100dvh] bg-canvas px-6 py-8 mx-auto w-full max-w-2xl">
      <Link to="/profile" className="inline-flex items-center gap-2 text-muted mb-8">
        <ArrowLeft size={18} aria-hidden="true" />
        Zurück
      </Link>

      <h1 className="text-3xl font-serif text-ink mb-3">Klar+</h1>

      <p className="text-muted mb-6 leading-relaxed">
        Acht Kontakte am Tag gelten für alle — auch mit Klar+. Das Kontingent
        ist bei Klar kein Mangel, den man wegkaufen kann, sondern der Grund,
        warum die App anders funktioniert. Klar+ macht diese acht besser,
        nicht mehr.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-line-ui">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Vergleich: Klar ohne Abo und Klar+ — {LEISTUNGEN.length} Zeilen
          </caption>
          <thead>
            <tr className="border-b border-line-ui">
              <th scope="col" className="p-3 font-medium text-muted">
                Funktion
              </th>
              <th scope="col" className="p-3 font-semibold text-ink text-center w-24">
                Klar
              </th>
              <th scope="col" className="p-3 font-semibold text-accent text-center w-24 bg-accent-quiet">
                Klar+
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {LEISTUNGEN.map((l) => (
              <tr key={l.id}>
                <th scope="row" className="p-3 font-normal text-ink align-top">
                  {l.name}
                  {l.erklaerung && (
                    <span className="block text-xs text-muted mt-0.5">{l.erklaerung}</span>
                  )}
                </th>
                <td className="p-3 text-center text-ink align-top">
                  <Feld wert={l.frei} spalte="Klar" />
                </td>
                <td className="p-3 text-center text-ink align-top bg-accent-quiet">
                  <Feld wert={l.plus} spalte="Klar+" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wonach sich der Preis rechtfertigt — offen hingeschrieben, statt es
          dem Betrachter zu überlassen, es aus sechs Zeilen zu erschliessen. */}
      <h2 className="text-xl font-serif text-ink mt-10 mb-3">Wofür das Geld ist</h2>
      <ul className="space-y-2 mb-10">
        {ACHSEN_REIHENFOLGE.map((nr) => {
          const dazu = LEISTUNGEN.filter((l) => l.achse === nr);
          if (dazu.length === 0) return null;
          return (
            <li key={nr} className="text-ink">
              <span className="font-medium">{ACHSEN[nr]}</span>
              <span className="text-muted"> — {dazu.map((l) => l.name).join(", ")}</span>
            </li>
          );
        })}
      </ul>

      <div role="note" className="rounded-2xl border border-line-ui p-5">
        <p className="text-ink font-medium mb-1">Noch nicht buchbar</p>
        <p className="text-muted leading-relaxed">
          {HINWEIS_NICHT_BUCHBAR} Es gibt hier absichtlich keinen Kaufknopf:
          Die Zahlungsabwicklung ist nicht angebunden, und ein Knopf, der auf
          eine Fehlermeldung führt, wäre eine Sackgasse mit Beschriftung.
        </p>
      </div>
    </div>
  );
}
