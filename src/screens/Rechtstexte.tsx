import { Link, useParams } from "react-router";
import { ArrowLeft, AlertTriangle } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// DSG-02 — Erreichbare Rechtstexte
//
// BEFUND (Final Audit 08.08.2026): Datenschutzerklärung und AGB waren aus
// der App nicht erreichbar. `Onboarding.tsx:80` band den Text ein, ohne
// Verweis; `Profile.tsx:1567` hatte Schaltflächen ohne `onClick`. Art. 13
// DSGVO verlangt, dass die Information zum Zeitpunkt der Erhebung vorliegt.
//
// DIESE SEITEN ENTHALTEN KEINEN RECHTSTEXT. Sie enthalten den Hinweis, dass
// keiner vorliegt. Das ist Absicht: Ein von mir verfasster Text sähe fertig
// aus, wäre aber ungeprüft — und ungeprüfte Rechtstexte, die fertig
// aussehen, werden übernommen. Ein sichtbarer Platzhalter erzeugt Druck,
// ein plausibler Text erzeugt Sicherheitsgefühl. Der Druck ist hier das
// Nützlichere.
//
// Was hineingehört, steht in der Verarbeitungsübersicht darunter — sie ist
// aus dem Code erhoben und damit belastbar.
// ═══════════════════════════════════════════════════════════════════════════

type Verarbeitung = {
  zweck: string;
  daten: string;
  grundlage: string;
  empfaenger: string;
  dauer: string;
};

/** Erhoben aus dem Code, Stand 09.08.2026. Keine Rechtsberatung — eine
 *  Bestandsaufnahme, die eine Fachstelle als Ausgangspunkt nehmen kann. */
const VERARBEITUNGEN: Verarbeitung[] = [
  {
    zweck: "Konto und Anmeldung",
    daten: "E-Mail, Anzeigename, Kennung; bei Google-Anmeldung Profilbild",
    grundlage: "Art. 6 Abs. 1 lit. b — Vertrag",
    empfaenger: "Firebase Authentication (Google)",
    dauer: "bis zur Löschung des Kontos",
  },
  {
    zweck: "Profil und Vorschläge",
    daten: "Name, Bio, Interessen, Ziel, Verifizierungsstatus",
    grundlage: "Art. 6 Abs. 1 lit. b",
    empfaenger: "Firestore (Google)",
    dauer: "bis zur Löschung des Kontos",
  },
  {
    zweck: "Altersprüfung",
    daten: "Geburtsdatum, Zeitpunkt der Prüfung",
    grundlage: "Art. 6 Abs. 1 lit. c — rechtliche Verpflichtung (Jugendschutz)",
    empfaenger: "Firestore",
    dauer: "bis zur Löschung des Kontos",
  },
  {
    zweck: "Gespräche",
    daten: "Nachrichteninhalte, Zeitpunkte, Beteiligte",
    grundlage: "Art. 6 Abs. 1 lit. b",
    empfaenger: "Firestore",
    dauer: "bis zur Löschung des Kontos",
  },
  {
    zweck: "Verifizierung",
    daten: "Verifizierungsfoto, vorgegebene Geste",
    grundlage: "Art. 6 Abs. 1 lit. f — berechtigtes Interesse (Schutz vor Fälschungen)",
    empfaenger: "Firebase Storage",
    dauer: "30 Tage nach der Prüfung — Umsetzung steht aus",
  },
  {
    zweck: "Meldungen und Moderation",
    daten: "Meldegrund, Beschreibung, gemeldeter Inhalt",
    grundlage: "Art. 6 Abs. 1 lit. c — DSA Art. 16",
    empfaenger: "Firestore",
    dauer: "nach Abschluss der Prüfung, Nachweisfristen beachten",
  },
  {
    zweck: "KI-Auswertung (Vorschlagstexte, Profilprüfung)",
    daten: "Bio, Werte, Profilbild, je nach Funktion Gesprächsinhalte",
    grundlage: "Art. 6 Abs. 1 lit. a — Einwilligung, widerruflich",
    empfaenger: "Google Gemini — AVV steht aus (DSG-07)",
    dauer: "nach Verarbeitung; Speicherdauer beim Empfänger zu klären",
  },
  {
    zweck: "Fehlerberichte",
    daten: "Fehlermeldung, Stapelverfolgung, Pfad ohne Abfrageteil",
    grundlage: "Art. 6 Abs. 1 lit. a — Einwilligung",
    empfaenger: "Sentry — AVV steht aus (DSG-07)",
    dauer: "nach Vorgabe des Dienstes",
  },
];

function Platzhalter({ titel, was }: { titel: string; was: string }) {
  return (
    <div className="min-h-[100dvh] bg-canvas px-6 py-8 mx-auto w-full max-w-2xl">
      <Link to="/profile" className="inline-flex items-center gap-2 text-muted mb-8">
        <ArrowLeft size={18} aria-hidden="true" />
        Zurück
      </Link>

      <h1 className="text-3xl font-serif text-ink mb-6">{titel}</h1>

      <div
        role="note"
        className="rounded-2xl border border-line-ui p-5 mb-8 flex gap-3 items-start"
      >
        <AlertTriangle size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-ink font-medium mb-1">Dieser Text liegt noch nicht vor.</p>
          <p className="text-muted text-base">
            Hier steht bewusst kein Entwurf. {was} gehört von einer
            Datenschutz&shy;fachstelle verfasst und geprüft — ein Text, der
            fertig aussieht, es aber nicht ist, wäre schlechter als gar keiner.
          </p>
        </div>
      </div>

      <h2 className="text-xl font-serif text-ink mb-3">
        Was heute tatsächlich verarbeitet wird
      </h2>
      <p className="text-muted mb-6 text-base">
        Aus dem Quelltext erhoben, Stand 09.08.2026. Als Zuarbeit gedacht,
        nicht als Ersatz für den Text oben.
      </p>

      <div className="space-y-4">
        {VERARBEITUNGEN.map((v) => (
          <div key={v.zweck} className="rounded-2xl border border-line-ui p-4">
            <h3 className="text-ink font-medium mb-2">{v.zweck}</h3>
            <dl className="text-base text-muted space-y-1">
              <div><dt className="inline font-medium">Daten: </dt><dd className="inline">{v.daten}</dd></div>
              <div><dt className="inline font-medium">Grundlage: </dt><dd className="inline">{v.grundlage}</dd></div>
              <div><dt className="inline font-medium">Empfänger: </dt><dd className="inline">{v.empfaenger}</dd></div>
              <div><dt className="inline font-medium">Dauer: </dt><dd className="inline">{v.dauer}</dd></div>
            </dl>
          </div>
        ))}
      </div>

      <p className="text-muted text-base mt-8">
        Verantwortliche Stelle, Kontakt und Beschwerderecht bei der
        Aufsichtsbehörde fehlen noch — sie gehören in den Text oben.
      </p>
    </div>
  );
}

export default function Rechtstexte() {
  const { art } = useParams();
  if (art === "agb") {
    return <Platzhalter titel="Allgemeine Geschäftsbedingungen" was="Die AGB" />;
  }
  return <Platzhalter titel="Datenschutzerklärung" was="Die Datenschutzerklärung" />;
}
