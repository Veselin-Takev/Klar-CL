#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// `Math.random()` als DATENQUELLE.
//
// ── WOZU ──────────────────────────────────────────────────────────────────
// `check:erfundene-diagramme` findet feste Zahlenreihen im Quelltext. Es
// findet NICHT den anderen Weg, eine Zahl zu erfinden: sie auswuerfeln.
//
// Der Befund vom 13.08.2026: `ConversationStatsWidget` zeichnete auf dem
// Dashboard ein 30-Tage-Diagramm — Gespraeche je Tag, Antwortrate — beides
// aus `Math.random()`. Ueberschrift: „Letzte 30 Tage". Bei jedem Neuladen
// ein anderer Verlauf. Fuer die bedienende Person nicht von einer Messung
// zu unterscheiden.
//
// ── NICHT JEDER ZUFALL IST ERFUNDEN ───────────────────────────────────────
// Drei Verwendungen sind in Ordnung, und zwar aus jeweils eigenem Grund:
//
//   1. ANIMATION — wo ein Schnipsel hinfliegt, behauptet nichts.
//   2. AUSWAHL AUS EINER FESTEN LISTE — welches von fuenf Zitaten erscheint,
//      ist eine Entscheidung, keine Messung. Die Liste ist echt.
//   3. KENNUNG — eine `id` fuer einen neuen Eintrag ist keine Aussage.
//
// Nicht in Ordnung ist die vierte: eine ZAHL, die als Beobachtung auftritt.
// Ein Verlauf, eine Quote, ein Wetter, ein Punktestand.
//
// ── WIE GEPRUEFT WIRD ─────────────────────────────────────────────────────
// Unten steht je Datei, wie viele Verwendungen dort ERLAUBT sind und warum.
// Gezaehlt wird alles darueber hinaus und alles in Dateien, die nicht
// aufgefuehrt sind. Damit faellt jede NEUE Verwendung auf, auch eine
// harmlose — dann gehoert sie mit einem Grund in die Tabelle.
//
// Das Skript kann den Grund nicht pruefen. Es haelt fest, dass es einen
// gibt, und wer ihn aufgeschrieben hat.
//
// Aufruf:  node scripts/erfundene-zahlen.mjs [Wurzel] [Obergrenze]
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const wurzel = process.argv[2] || 'src';
const obergrenze = Number(process.argv[3] ?? 0);

/** Datei -> { anzahl, grund }. `anzahl` ist die Zahl der erlaubten Stellen. */
const ERLAUBT = {
  'src/components/Confetti.tsx':
    { anzahl: 8, grund: 'Animation: Lage, Farbe, Groesse, Drehung und Dauer der Schnipsel' },
  'src/components/CoachParticles.tsx':
    { anzahl: 3, grund: 'Animation: Lage und Groesse der Punkte' },

  'src/components/DatingTimelineWidget.tsx':
    { anzahl: 1, grund: 'Auswahl aus einer festen Fragenliste' },
  'src/components/DatingWheelWidget.tsx':
    { anzahl: 1, grund: 'Auswahl aus einer festen Ideenliste' },
  'src/components/DatingDuelWidget.tsx':
    { anzahl: 1, grund: 'Auswahl aus einer festen Duellliste' },
  'src/components/UpcomingDateWidget.tsx':
    { anzahl: 1, grund: 'Auswahl aus einer festen Zitatliste' },
  'src/services/notificationService.ts':
    { anzahl: 1, grund: 'Auswahl aus einer festen Impulsliste' },
  'src/server/klarCore.ts':
    { anzahl: 1, grund: 'Auswahl der Verifizierungsgeste — hier IST der Zufall die Anforderung; die Zahl wird in `waehleGeste()` hineingereicht und ist dadurch pruefbar' },

  'src/components/DateArchiveWidget.tsx':
    { anzahl: 1, grund: 'Kennung fuer einen neuen Eintrag' },
  'src/screens/AICoach.tsx':
    { anzahl: 1, grund: 'Kennung fuer eine neue Nachricht' },

  'src/components/ProfileCheckWidget.tsx':
    { anzahl: 2, grund: 'Auswahl aus einer festen Tippliste, und eine Kennung' },
  'src/components/MoodDiaryWidget.tsx':
    { anzahl: 1, grund: 'Kennung fuer einen neuen Eintrag — die ZWEITE Stelle in dieser Datei ist eine erfundene Grundlinie und wird gezaehlt' },
};

function ohneKommentare(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/.*$/gm, (_m, vor) => vor);
}

function dateien(w, aus = []) {
  for (const e of readdirSync(w)) {
    const p = join(w, e);
    if (statSync(p).isDirectory()) dateien(p, aus);
    else if (/\.tsx?$/.test(p) && !/\.(test|spec)\.tsx?$/.test(p)) aus.push(p);
  }
  return aus;
}

const treffer = [];
let gesamt = 0;

for (const datei of dateien(wurzel)) {
  const text = ohneKommentare(readFileSync(datei, 'utf8'));
  const zeilen = text.split('\n');
  const stellen = [];
  zeilen.forEach((z, i) => {
    for (let k = 0; k < (z.match(/Math\.random/g) || []).length; k++) stellen.push(i + 1);
  });
  if (stellen.length === 0) continue;

  const eintrag = ERLAUBT[datei.split('\\').join('/')];
  const erlaubt = eintrag ? eintrag.anzahl : 0;
  gesamt += stellen.length;
  const ueber = stellen.length - erlaubt;
  if (ueber > 0) treffer.push({ datei, gesamt: stellen.length, erlaubt, ueber, stellen });
}

const gezaehlt = treffer.reduce((s, t) => s + t.ueber, 0);

console.log(`\n\`Math.random()\` als Datenquelle: ${gezaehlt} Stelle(n) in ${treffer.length} Datei(en) — erlaubt sind ${obergrenze}.`);
console.log(`(${gesamt} Verwendungen insgesamt; ${gesamt - gezaehlt} davon mit hinterlegtem Grund.)\n`);

for (const t of treffer.sort((a, b) => b.ueber - a.ueber)) {
  const zusatz = t.erlaubt > 0 ? `  (${t.erlaubt} davon mit Grund)` : '';
  console.log(`  ${String(t.ueber).padStart(3)}  ${t.datei}${zusatz}`);
  console.log(`         Zeile(n) ${t.stellen.join(', ')}`);
}

if (gezaehlt > obergrenze) {
  console.log(`
Eine ausgewuerfelte Zahl, die als Beobachtung auftritt, ist erfunden — auch
wenn sie plausibel aussieht. Entweder sie kommt aus erhobenen Daten, oder
die Anzeige entfaellt. Ein Hinweis „Demodaten", den man wegklickt, macht die
Zahl nicht wahr.

Ist die Verwendung Animation, Auswahl aus einer festen Liste oder eine
Kennung, gehoert sie mit einem Grund in die Tabelle ERLAUBT in
scripts/erfundene-zahlen.mjs.
`);
  process.exit(1);
}
console.log('');
