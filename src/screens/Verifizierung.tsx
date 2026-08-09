import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Camera, Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import { holeGeste, reicheVerifizierungEin, verifizierungsStatus, type ChallengeAntwort, type StatusAntwort } from "../lib/klar";

// ═══════════════════════════════════════════════════════════════════════════
// P1 — Verifizierung
//
// Ohne sie lehnen die Firestore-Regeln jeden Kontakt ab: `isVerified(uid)`
// ist Voraussetzung für `contacts/create` und für die Chat-Erstellung.
//
// Vier Zustände, alle entworfen. Ladezustand als Platzhalterfläche, nicht
// als Spinner (Design-Richtlinie §6). Kein Countdown-Balken — eine Frist,
// die nicht gemessen wird, wäre erfundene Dringlichkeit.
// ═══════════════════════════════════════════════════════════════════════════

export default function Verifizierung() {
  const navigate = useNavigate();
  const feld = useRef<HTMLInputElement>(null);
  const [laden, setLaden] = useState(true);
  const [status, setStatus] = useState<StatusAntwort | null>(null);
  const [challenge, setChallenge] = useState<ChallengeAntwort | null>(null);
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [vorgang, setVorgang] = useState<string | null>(null);

  useEffect(() => {
    let weg = false;
    verifizierungsStatus()
      .then((s) => { if (!weg) setStatus(s); })
      .catch((e: unknown) => { if (!weg) setFehler(e instanceof Error ? e.message : "Status nicht abrufbar."); })
      .finally(() => { if (!weg) setLaden(false); });
    return () => { weg = true; };
  }, []);

  async function starten() {
    setFehler(null);
    try { setChallenge(await holeGeste()); }
    catch (e) { setFehler(e instanceof Error ? e.message : "Die Geste konnte nicht angefordert werden."); }
  }

  async function fotoGewaehlt(ev: React.ChangeEvent<HTMLInputElement>) {
    const datei = ev.target.files?.[0];
    if (!datei || !challenge) return;
    setFehler(null); setSendet(true);
    try {
      const a = await reicheVerifizierungEin(datei, challenge.pfad);
      setVorgang(a.vorgang);
      setStatus({ status: "in_pruefung", begruendung: null });
      setChallenge(null);
    } catch (e) {
      // Kein stiller Abbruch: Wer ein Foto hochlädt und nichts sieht, muss
      // annehmen, es sei angekommen.
      setFehler(e instanceof Error ? e.message : "Die Einreichung ist nicht durchgelaufen.");
    } finally {
      setSendet(false);
      if (feld.current) feld.current.value = "";
    }
  }

  return (
    <div className="p-6 h-full overflow-y-auto pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-stone-600 dark:text-stone-300 mb-6 min-h-11">
        <ArrowLeft size={20} aria-hidden="true" />
        <span className="text-sm font-medium">Zurück</span>
      </button>

      <h1 className="text-3xl font-serif text-stone-900 dark:text-stone-100 mb-2">Verifizierung</h1>
      <p className="text-base text-stone-600 dark:text-stone-300 mb-8">
        Ohne Verifizierung erscheinst du nicht in den Vorschlägen und kannst
        niemanden anschreiben. Das gilt für alle — deshalb weißt du bei jedem
        Profil, dass dahinter ein Mensch steht.
      </p>

      {laden ? (
        <div className="space-y-3" aria-busy="true" aria-label="Status wird geladen">
          <div className="h-6 w-2/3 rounded-lg bg-stone-200 dark:bg-stone-800" />
          <div className="h-24 rounded-2xl bg-stone-200 dark:bg-stone-800" />
        </div>
      ) : null}

      {fehler ? <p role="alert" className="mb-6 text-base text-red-700 dark:text-red-300">{fehler}</p> : null}

      {!laden && status?.status === "bestaetigt" ? (
        <div className="rounded-2xl border border-stone-300 dark:border-stone-600 p-5">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck size={22} className="text-brand dark:text-brand-light" aria-hidden="true" />
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">Verifiziert</h2>
          </div>
          <p className="text-base text-stone-600 dark:text-stone-300">
            Dein Foto wurde geprüft. Es war zu keinem Zeitpunkt in deinem Profil
            sichtbar und wird 30 Tage nach der Entscheidung gelöscht.
          </p>
        </div>
      ) : null}

      {!laden && status?.status === "in_pruefung" ? (
        <div className="rounded-2xl border border-stone-300 dark:border-stone-600 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={22} className="text-stone-600 dark:text-stone-300" aria-hidden="true" />
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">In Prüfung</h2>
          </div>
          <p className="text-base text-stone-600 dark:text-stone-300">
            Ein Mensch sieht sich das an. In der Regel unter 24 Stunden.
          </p>
          {vorgang ? <p className="mt-3 text-base">Vorgang: <span className="font-mono">{vorgang}</span></p> : null}
        </div>
      ) : null}

      {!laden && status?.status === "abgelehnt" ? (
        <div className="rounded-2xl border border-stone-300 dark:border-stone-600 p-5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert size={22} className="text-stone-600 dark:text-stone-300" aria-hidden="true" />
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">Nicht bestätigt</h2>
          </div>
          {/* DSA Art. 17: Jede Beschraenkung braucht eine Begruendung. */}
          <p className="text-base text-stone-600 dark:text-stone-300">
            {status.begruendung ?? "Uns fehlt eine Begründung — bitte melde dich beim Support."}
          </p>
          <p className="text-base text-stone-600 dark:text-stone-300 mt-2">Du kannst es erneut versuchen.</p>
        </div>
      ) : null}

      {!laden && (status?.status === "nicht_begonnen" || status?.status === "abgelehnt") ? (
        challenge ? (
          <div className="rounded-2xl border border-stone-300 dark:border-stone-600 p-5">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">Deine Geste</h2>
            <p className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-4">{challenge.geste}</p>
            <p className="text-base text-stone-600 dark:text-stone-300 mb-6">
              Mach ein Foto von dir mit genau dieser Geste. Sie gilt{" "}
              {Math.round(challenge.gueltigSekunden / 60)} Minuten und wird für
              jeden Versuch neu vergeben — deshalb funktioniert kein
              vorbereitetes Bild.
            </p>
            <input ref={feld} type="file" accept="image/jpeg,image/png,image/webp" capture="user"
              onChange={fotoGewaehlt} className="sr-only" id="verifizierungsfoto" />
            <label htmlFor="verifizierungsfoto"
              className="flex items-center justify-center gap-2 w-full min-h-11 px-5 py-3 rounded-full bg-brand text-white text-base font-medium cursor-pointer">
              <Camera size={20} aria-hidden="true" />
              {sendet ? "Wird übermittelt …" : "Foto aufnehmen"}
            </label>
            <p className="mt-4 text-base text-stone-600 dark:text-stone-300">
              Das Foto ist nur für die Prüfung. Es erscheint nicht in deinem
              Profil, ist für niemanden in der App sichtbar und wird 30 Tage
              nach der Entscheidung gelöscht.
            </p>
          </div>
        ) : (
          <button onClick={starten} className="w-full min-h-11 px-5 py-3 rounded-full bg-brand text-white text-base font-medium">
            Verifizierung starten
          </button>
        )
      ) : null}
    </div>
  );
}
