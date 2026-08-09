import { useState } from "react";
import { Link } from "react-router";

// ═══════════════════════════════════════════════════════════════════════════
// DSG-02 — Altersangabe und Einwilligung
//
// Ein Dialog, zwei getrennte Schritte. Sie sind bewusst nicht zusammengelegt:
// Die Altersangabe ist Pflicht (ohne sie kein Konto), die Einwilligung ist
// freiwillig. Wer beides in einem Knopf bündelt, macht die Einwilligung
// unfreiwillig — und damit nach Art. 7 Abs. 2 DSGVO unwirksam.
//
// Was hier NICHT passiert:
//   · Kein „Alle akzeptieren" als hervorgehobener Knopf. Ablehnen muss
//     genauso leicht sein wie Zustimmen.
//   · Keine Vorauswahl der freiwilligen Zwecke. Ein vorangekreuztes Kästchen
//     ist keine Einwilligung (EuGH, Planet49).
//   · Kein Wegklicken ohne Entscheidung bei der Altersangabe.
// ═══════════════════════════════════════════════════════════════════════════

type Zwecke = { ki_auswertung: boolean; fehlerberichte: boolean };

interface Props {
  /** Wird aufgerufen, sobald Alter geprüft und Einwilligung gespeichert ist. */
  onFertig: () => void;
  /** Bereits volljährig bestätigt? Dann entfällt der erste Schritt. */
  alterBereitsGeprueft?: boolean;
}

export function EinwilligungUndAlter({ onFertig, alterBereitsGeprueft = false }: Props) {
  const [schritt, setSchritt] = useState<"alter" | "einwilligung">(
    alterBereitsGeprueft ? "einwilligung" : "alter",
  );
  const [geburtsdatum, setGeburtsdatum] = useState("");
  const [zwecke, setZwecke] = useState<Zwecke>({ ki_auswertung: false, fehlerberichte: false });
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  async function alterSenden(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setLaeuft(true);
    try {
      const res = await fetch("/api/account/alter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geburtsdatum }),
      });
      const daten = await res.json();
      if (!res.ok) { setFehler(daten.error ?? "Die Angabe konnte nicht geprüft werden."); return; }
      setSchritt("einwilligung");
    } catch {
      setFehler("Keine Verbindung. Bitte später erneut versuchen.");
    } finally {
      setLaeuft(false);
    }
  }

  async function einwilligungSenden(gewaehlt: Zwecke) {
    setFehler(null);
    setLaeuft(true);
    try {
      const res = await fetch("/api/einwilligung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zwecke: gewaehlt }),
      });
      if (!res.ok) {
        const daten = await res.json().catch(() => ({}));
        setFehler(daten.error ?? "Die Einwilligung konnte nicht gespeichert werden.");
        return;
      }
      // Sentry startet beim Laden der Seite, lange vor der Anmeldung, und
      // kann den Serverstand nicht abfragen. Deshalb wird die Entscheidung
      // zusätzlich lokal hinterlegt; `beforeSend` in main.tsx wertet sie aus.
      // Der verbindliche Stand bleibt der auf dem Server.
      try {
        localStorage.setItem("klar_einw_fehlerberichte", gewaehlt.fehlerberichte ? "ja" : "nein");
      } catch { /* privater Modus — dann bleibt es beim Standard „nein" */ }
      onFertig();
    } catch {
      setFehler("Keine Verbindung. Bitte später erneut versuchen.");
    } finally {
      setLaeuft(false);
    }
  }

  // Grenze für das Eingabefeld: heute. Verhindert Tippfehler, ersetzt aber
  // nicht die serverseitige Prüfung — der Client entscheidet hier nichts.
  const heute = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-[100dvh] bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {schritt === "alter" ? (
          <form onSubmit={alterSenden}>
            <h1 className="text-3xl font-serif text-ink mb-3">Wie alt bist du?</h1>
            <p className="text-muted mb-6">
              Klar ist ab 18. Wir fragen einmal und speichern die Angabe.
            </p>

            <label htmlFor="geb" className="block text-ink mb-2">
              Geburtsdatum
            </label>
            <input
              id="geb"
              type="date"
              required
              max={heute}
              value={geburtsdatum}
              onChange={(e) => setGeburtsdatum(e.target.value)}
              aria-describedby={fehler ? "geb-fehler" : undefined}
              className="w-full p-4 rounded-2xl border border-line-ui bg-surface text-ink mb-2"
            />

            {fehler && (
              <p id="geb-fehler" role="alert" className="text-base mb-2 text-warn">
                {fehler}
              </p>
            )}

            {/* GEGENPRÜFUNG 09.08.2026: Hier stand `text-white`. Auf dem
                Akzent des Dunkelmodus (#a9bda5) ergibt Weiß 2,00 : 1 — der
                einzige Pflichtknopf der Pflichtstrecke wäre unlesbar
                gewesen. `check-kontrast.mjs` hat es nicht gemeldet, weil es
                Tokenpaare prüft und ich eine feste Farbe benutzt hatte.
                `text-on-accent` ist hell 9,31 : 1 und dunkel 8,94 : 1. */}
            <button
              type="submit"
              disabled={laeuft || !geburtsdatum}
              className="w-full py-4 mt-4 rounded-2xl bg-accent text-on-accent font-medium disabled:opacity-50"
            >
              {laeuft ? "Wird geprüft…" : "Weiter"}
            </button>
          </form>
        ) : (
          <div>
            <h1 className="text-3xl font-serif text-ink mb-3">Womit bist du einverstanden?</h1>
            <p className="text-muted mb-6">
              Beides ist freiwillig und jederzeit widerrufbar. Klar funktioniert
              auch, wenn du nichts davon auswählst.
            </p>

            <div className="space-y-3 mb-6">
              <Kasten
                id="ki"
                titel="KI-Auswertung"
                text="Deine Bio, deine Werte und dein Profilbild werden von Google Gemini ausgewertet, um Vorschläge zu verbessern."
                an={zwecke.ki_auswertung}
                setzen={(v) => setZwecke((z) => ({ ...z, ki_auswertung: v }))}
              />
              <Kasten
                id="fehler"
                titel="Fehlerberichte"
                text="Wenn etwas abstürzt, wird die Fehlermeldung an Sentry übertragen. Ohne Bildschirmaufzeichnung."
                an={zwecke.fehlerberichte}
                setzen={(v) => setZwecke((z) => ({ ...z, fehlerberichte: v }))}
              />
            </div>

            <p className="text-muted text-base mb-6">
              Einzelheiten in der{" "}
              <Link to="/rechtstexte/datenschutz" className="underline text-ink">Datenschutzerklärung</Link>
              {" "}und den{" "}
              <Link to="/rechtstexte/agb" className="underline text-ink">AGB</Link>.
            </p>

            {fehler && (
              <p role="alert" className="text-base mb-3 text-warn">
                {fehler}
              </p>
            )}

            {/* Beide Knöpfe gleich gewichtet. Ein hervorgehobenes
                „Alle akzeptieren" neben einem blassen „Ablehnen" wäre eine
                Steuerung der Entscheidung, keine Auswahl. */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={laeuft}
                onClick={() => einwilligungSenden({ ki_auswertung: false, fehlerberichte: false })}
                className="py-4 rounded-2xl border border-line-ui text-ink font-medium disabled:opacity-50"
              >
                Nichts davon
              </button>
              <button
                type="button"
                disabled={laeuft}
                onClick={() => einwilligungSenden(zwecke)}
                className="py-4 rounded-2xl border border-line-ui text-ink font-medium disabled:opacity-50"
              >
                Auswahl speichern
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Kasten({
  id, titel, text, an, setzen,
}: { id: string; titel: string; text: string; an: boolean; setzen: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex gap-3 items-start rounded-2xl border border-line-ui p-4 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={an}
        onChange={(e) => setzen(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0"
      />
      <span>
        <span className="block text-ink font-medium">{titel}</span>
        <span className="block text-muted text-base">{text}</span>
      </span>
    </label>
  );
}

export default EinwilligungUndAlter;
