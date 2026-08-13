import { Link } from "react-router";
import { allProfiles } from "../data";
import { Clock, ShieldCheck } from "lucide-react";

export default function Chats() {
  return (
    <div className="p-6 h-full overflow-y-auto pb-24 bg-light-bg dark:bg-dark-bg">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-3xl font-serif text-stone-900 dark:text-stone-100">Deine Verbindungen</h1>
        <Link to="/profile" className="flex items-center gap-1.5 text-brand dark:text-brand-light text-sm font-medium bg-brand/10 dark:bg-brand-light/10 px-3 py-1.5 rounded-full hover:bg-brand/20 dark:hover:bg-brand-light/20 transition-colors">
          <ShieldCheck size={16} /> Verifiziert
        </Link>
      </div>


      {/* ── ENTFERNT 14.08.2026 — <RewardedAdButton /> ────────────────────
          ENTSCHEIDUNG DES AUFTRAGGEBERS:
            „Fuer das MVP gilt: Streichen. Besser eine schlanke, voll
             funktionsfaehige und ehrliche User Journey als unfertige
             Monetarisierungs-Features."

          Der Knopf hiess „Video ansehen (+3 Kontakte)". Er zeigte kein
          Video: Er wartete drei Sekunden (`setTimeout`, mit dem Kommentar
          „Simulate AdMob rewarded video") und rief dann

              alert("Gratuliere! Du hast 3 zusaetzliche Kontakte erhalten.");
              // Actual API integration would happen here

          Drei Fehler in vier Zeilen — es lief keine Werbung, es kam keine
          Belohnung an, und der Text behauptete beides. Dazu widersprachen
          die drei Zusatzkontakte dem Kontingent von acht (klar/27, 9c) und
          die Werbung dem Transparenz-Modell.

          Mit entfernt: `src/components/RewardedAdButton.tsx`, der Endpunkt
          `/api/admob-ssv` (server.ts) und `extraContacts`/`extraTag` aus
          `entscheideKontakt` (src/server/pure.ts).

          WIEDERVORLAGE: Wenn die Zahlungsabwicklung steht, gehoert neu
          entschieden, ob es einen Weg „mit Zeit zahlen" geben soll — und
          wenn ja, welchen. Nicht Werbung; klar/27 Abschnitt 9c empfiehlt
          dafuer die Verifizierung. Siehe klar/29-mvp-schnitt. */}
  
      {/* ── ENTFERNT 14.08.2026 — „3 Personen mögen dich" ────────────────
          Die Karte hatte drei Fehler auf einmal, und jeder einzelne haette
          gereicht:

          1. Die Drei kam aus dem Quelltext. Kein Aufruf, keine Abfrage — die
             Zahl stand fest da, fuer jedes Konto, an jedem Tag. Genau die
             Bauform, die `klar/14-ki-ersatz-matrix` und `klar/17` seit dem
             10.08.2026 aus der App entfernen.
          2. „Wer hat dich gemocht" ist in klar/27, Abschnitt 9c,
             AUSDRUECKLICH nicht empfohlen: Es ist eine Aussage ueber andere
             Menschen, die diese nicht getroffen haben — und der klassische
             Weg, mit dem Dating-Apps ihr Versprechen aufweichen.
          3. Der Knopf „Premium" hatte kein `onClick`. Er versprach einen
             Weg, den es nicht gab.

          Ersatzlos gestrichen statt ersetzt: Ein ehrlicher Zaehler waere
          moeglich, aber er stuende dann fuer eine Funktion, die es nach
          heutigem Stand nicht geben soll. Der Einstieg zu Klar+ steht auf
          der Profilseite und unter /klar-plus.

          Der `RewardedAdButton`, der hier darueber stand, ist am selben Tag
          mitgegangen — siehe den Block oben. */}

      {/* ── OFFEN, KEIN TEIL DIESES BLOCKS ────────────────────────────────
          Die Liste unten laeuft auf `allProfiles` aus `src/data` — festen
          Beispielprofilen. Drei Angaben je Zeile sind aus dem Listenplatz
          gerechnet und bedeuten nichts:

            „Verfaellt in {72 - i * 2}h"   „{i + 1}h"   „{75 + i * 5}% Fit"

          Das ist dieselbe Familie wie „3 Personen moegen dich" (am
          14.08.2026 entfernt) — nur unauffaelliger, weil die Zahlen von
          Zeile zu Zeile verschieden sind und dadurch echt wirken.

          WIEDERVORLAGE: Sobald es echte Gespraeche gibt, muessen diese drei
          Angaben aus den Daten kommen oder verschwinden. Nicht vorher
          umbauen — ohne echte Gespraeche gaebe es nichts anzuzeigen, und
          eine leere Liste waere der ehrlichere, aber noch nicht baubare
          Zustand. */}
      <div className="space-y-4">
        {allProfiles.map((profile, i) => (
          <Link to={`/chat/${profile.id}`} key={profile.id} className="flex items-center gap-4 p-4 bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 hover:border-brand/50 dark:hover:border-brand-light/50 transition-colors group">
                        <div className="relative">
              <img src={profile.photoUrl} alt={profile.name} className="w-16 h-16 rounded-full object-cover border border-stone-100 dark:border-stone-800" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-stone-900 rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-lg text-stone-900 dark:text-stone-100">{profile.name}</h3>
                <span className="text-xs text-stone-400 dark:text-stone-500">{i + 1}h</span>
              </div>
              <p className="text-stone-500 dark:text-stone-400 text-sm mb-2 truncate">Tippe, um ein Gespräch zu beginnen...</p>
              <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                <Clock size={12} />
                <span>Verfällt in {72 - (i * 2)}h</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
               <div className="w-12 h-12 relative flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-stone-100 dark:text-stone-800"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="text-brand dark:text-brand-light"
                      strokeDasharray={`${75 + i * 5}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-stone-700 dark:text-stone-300">{75 + i * 5}%</span>
               </div>
               <span className="text-[8px] text-stone-500 font-medium uppercase mt-1">Fit</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
