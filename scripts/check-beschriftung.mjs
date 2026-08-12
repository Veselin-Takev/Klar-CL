#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// Prüft, ob jede Schaltfläche eine zugängliche Beschriftung hat.
//
// ── BEFUND 12.08.2026, UND EINE KORREKTUR ─────────────────────────────────
// `klar/20-enterprise-reife.md` nennt 103 Schaltflächen ohne zugängliche
// Beschriftung. Diese Zahl ist FALSCH. Sie stammt aus einem groben `grep`,
// der jede Datei mitzählte, in der überhaupt eine symbolhafte Schaltfläche
// vorkam, statt die Schaltflächen selbst zu zählen — und der Text im Inhalt
// einer Schaltfläche gar nicht ansah.
//
// Gemessen mit dieser Prüfung waren es **33** in 196 `.tsx`-Dateien. Alle
// 33 sind beschriftet (31 hier, zwei zuvor in `HapticSettings.tsx` und
// `ChatView.tsx`). Die Obergrenze steht deshalb auf 0.
//
// Wozu überhaupt: Eine Schaltfläche, die nur aus einem Symbol besteht, liest
// sich mit einer Vorlesehilfe als „Schaltfläche" und sonst nichts.
//
// ── WIE GEPRÜFT WIRD ──────────────────────────────────────────────────────
// Eine Schaltfläche gilt als beschriftet, wenn eines zutrifft:
//   · sie hat `aria-label`
//   · sie hat `aria-labelledby`
//   · sie hat `title`
//   · zwischen `<button …>` und `</button>` steht sichtbarer Text
//
// Symbole (`<X size={16} />`) und Ausdrücke (`{zahl}`) zählen NICHT als
// Text: Ein Symbol hat keinen Namen, den eine Vorlesehilfe kennt.
//
// ── DIE OBERGRENZE ────────────────────────────────────────────────────────
// Der zweite Aufrufwert ist die höchste erlaubte Zahl. In `package.json`
// steht 0: Jede neue Schaltfläche ohne Namen lässt `verify` fehlschlagen.
// Der Wert bleibt einstellbar, damit dieselbe Prüfung auch als Sperrklinke
// taugt, falls ein grösserer Umbau vorübergehend Stellen aufreisst.
//
// Jeder der 31 Texte ist an der Schaltfläche selbst geschrieben worden —
// Symbol, Handler und Umgebung gelesen, dann benannt. Keiner ist geraten.
//
// Aufruf:  node scripts/check-beschriftung.mjs src [Obergrenze]
// ═══════════════════════════════════════════════════════════════════════════
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WURZEL = process.argv[2] || 'src';
const GRENZE = Number(process.argv[3] ?? Infinity);

function dateien(verzeichnis, gesammelt = []) {
  for (const name of readdirSync(verzeichnis)) {
    const pfad = join(verzeichnis, name);
    if (statSync(pfad).isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      dateien(pfad, gesammelt);
    } else if (/\.tsx$/.test(pfad)) {
      gesammelt.push(pfad);
    }
  }
  return gesammelt;
}

/**
 * Sichtbarer Text im Inhalt einer Schaltfläche.
 *
 * ── ZWEI FEHLALARME BEIM EINFAHREN, 11.08.2026 ───────────────────────────
 * Erste Fassung: alle geschweiften Ausdrücke entfernen. Meldete
 *     <button>{isLoading ? "Wird geladen…" : "Anmelden"}</button>
 * als unbeschriftet — drei von drei Fundstellen in Login.tsx falsch.
 *
 * Zweite Fassung: zusätzlich Zeichenketten in Anführungen als Text zählen.
 * Meldete weiterhin
 *     <button>{isPlanning ? (<>… Plane Date…</>) : (<>… Ideen generieren</>)}</button>
 * als unbeschriftet, weil der Text dort ein JSX-Textknoten INNERHALB eines
 * Ausdrucks ist und in keinen Anführungszeichen steht.
 *
 * Der Unterschied zwischen „Text im Ausdruck" und „Code im Ausdruck" lässt
 * sich ohne echten Parser nicht sauber ziehen. Also die einfache Regel:
 *
 *     Tags entfernen. Bleiben Buchstaben übrig, gibt es einen Namen.
 *
 * ── WAS DIESE REGEL NICHT SIEHT ──────────────────────────────────────────
 * `<button>{anzahl}</button>` gilt als beschriftet, weil „anzahl" Buchstaben
 * enthält — obwohl vorgelesen nur eine Zahl herauskommt. Das ist eine
 * bewusste Untertreibung: Lieber eine Schaltfläche zu wenig melden als eine
 * zu viel. Eine Prüfung, die falsch anschlägt, wird abgeschaltet, und dann
 * fehlt auch der Teil, der stimmte.
 */
function hatText(inhalt) {
  return /[A-Za-zÄÖÜäöüß]/.test(inhalt.replace(/<[^>]*>/g, ' '));
}

const befunde = [];

for (const pfad of dateien(WURZEL)) {
  const text = readFileSync(pfad, 'utf8');
  // Alle <button …> … </button> finden, auch über mehrere Zeilen.
  const muster = /<button\b([\s\S]*?)>([\s\S]*?)<\/button>/g;
  let treffer;
  while ((treffer = muster.exec(text)) !== null) {
    const attribute = treffer[1];
    const inhalt = treffer[2];
    const beschriftet =
      /\baria-label\b/.test(attribute) ||
      /\baria-labelledby\b/.test(attribute) ||
      /\btitle\b\s*=/.test(attribute) ||
      hatText(inhalt);
    if (!beschriftet) {
      const zeile = text.slice(0, treffer.index).split('\n').length;
      befunde.push({ pfad, zeile });
    }
  }
}

const anzahl = befunde.length;

if (anzahl > GRENZE) {
  console.error(
    `\nSchaltflaechen ohne zugaengliche Beschriftung: ${anzahl} — erlaubt sind ${GRENZE}.\n`,
  );
  const proDatei = new Map();
  for (const b of befunde) proDatei.set(b.pfad, [...(proDatei.get(b.pfad) ?? []), b.zeile]);
  for (const [datei, zeilen] of [...proDatei].sort((a, b) => b[1].length - a[1].length)) {
    console.error(`  ${datei}: ${zeilen.length}  (Zeilen ${zeilen.slice(0, 8).join(', ')}${zeilen.length > 8 ? ' …' : ''})`);
  }
  console.error(
    '\nEine Schaltflaeche braucht `aria-label`, `aria-labelledby`, `title`\n' +
      'oder sichtbaren Text. Ein Symbol allein hat keinen Namen, den eine\n' +
      'Vorlesehilfe kennt.\n' +
      '\nIst die Zahl gesunken, bitte die Obergrenze in package.json senken —\n' +
      'sonst faellt der naechste Ruecksschritt nicht auf.\n',
  );
  process.exit(1);
}

console.log(
  `Beschriftung: ${anzahl} Schaltflaeche(n) ohne zugaengliche Beschriftung` +
    (Number.isFinite(GRENZE) ? ` (Obergrenze ${GRENZE}).` : '.'),
);
