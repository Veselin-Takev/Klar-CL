#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// Prüft: Hat jeder KI-Endpunkt eine festgelegte Ersatzstrategie?
//
// WOZU: Am 10.08.2026 antworteten 29 `catch`-Blöcke in server.ts mit HTTP 200
// und erfundenen Inhalten — darunter „harmonisch, Alles bestens" als
// Stimmungsauswertung und `isFlagged: false` als Sicherheitsfreigabe. Keine
// davon war von einer echten Antwort zu unterscheiden.
//
// Die Ursache war nicht Nachlässigkeit an 29 Stellen, sondern dass es 29
// Stellen GAB, an denen die Frage einzeln beantwortet werden musste.
// `kiPolitik.ts` beantwortet sie einmal je Endpunkt. Diese Prüfung sorgt
// dafür, dass der 54. Endpunkt nicht wieder durchrutscht.
//
// GRENZE, AUSDRÜCKLICH: Das prüft nur, ob eine Strategie EINGETRAGEN ist —
// nicht, ob sie die richtige ist. Ob `/api/mood-monitor` `leer` sein muss und
// nicht `zwischenspeicher`, ist eine Entscheidung; sie steht in
// KI-ERSATZ-MATRIX.md und wird von tests/kiPolitik.spec.ts bewacht, soweit
// sie sich prüfen lässt.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';

const server = readFileSync('server.ts', 'utf8').split('\n');
const politik = readFileSync('src/server/kiPolitik.ts', 'utf8');

/** Alle Endpunkte, deren Handler einen KI-Aufruf enthält.
 *
 *  Der Handler reicht von `app.post("/api/…"` bis zur Zeile `  });` auf
 *  gleicher Einrückung — dieselbe Klammerlogik wie in den Reparaturskripten,
 *  und sie hat sich als verlässlich erwiesen. */
function kiEndpunkte() {
  const treffer = [];
  for (let i = 0; i < server.length; i++) {
    const m = server[i].match(/app\.(?:get|post)\("(\/api\/[^"]+)"/);
    if (!m) continue;
    let ende = server.length;
    for (let k = i + 1; k < server.length; k++) {
      if (server[k] === '  });') { ende = k; break; }
    }
    const rumpf = server.slice(i, ende + 1).join('\n');
    // Kommentare raus, sonst zählt die Dokumentation eines früheren
    // KI-Aufrufs als KI-Aufruf. Genau dieser Fehler ist am 10.08. sechsmal
    // passiert.
    const ohneKommentare = rumpf
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((z) => z.replace(/(^|[^:])\/\/.*$/, '$1'))
      .join('\n');
    if (/ai\.models\.generateContent/.test(ohneKommentare)) {
      treffer.push({ pfad: m[1], zeile: i + 1 });
    }
  }
  return treffer;
}

/** Die Schlüssel aus STRATEGIE. Bewusst per Textsuche statt per Import:
 *  Das Skript soll ohne tsx und ohne Übersetzungsschritt laufen. */
function eingetragen() {
  const block = politik.slice(
    politik.indexOf('export const STRATEGIE'),
    politik.indexOf('export function bekannteEndpunkte'),
  );
  return new Set([...block.matchAll(/'(\/api\/[^']+)':/g)].map((m) => m[1]));
}

const endpunkte = kiEndpunkte();
const bekannt = eingetragen();

const fehlend = endpunkte.filter((e) => !bekannt.has(e.pfad));
const verwaist = [...bekannt].filter((p) => !endpunkte.some((e) => e.pfad === p));

let fehler = false;

if (fehlend.length) {
  fehler = true;
  console.error(`KI-Endpunkte OHNE Ersatzstrategie — ${fehlend.length} Stück:\n`);
  for (const e of fehlend) console.error(`  server.ts:${e.zeile}  ${e.pfad}`);
  console.error('\nEintragen in src/server/kiPolitik.ts (STRATEGIE) und in');
  console.error('KI-ERSATZ-MATRIX.md begründen. Die Regel über allem:');
  console.error('Eine erfundene personenbezogene Auswertung ist niemals zulässig.\n');
}

if (verwaist.length) {
  // Kein Fehler, aber ein Hinweis: Ein Eintrag ohne Endpunkt ist entweder ein
  // Tippfehler oder ein Rest eines entfernten Endpunkts.
  console.warn(`Hinweis: ${verwaist.length} Eintrag/Einträge ohne passenden Endpunkt:`);
  for (const p of verwaist) console.warn(`  ${p}`);
  console.warn('');
}

if (!fehler) {
  console.log(
    `KI-Ersatz: alle ${endpunkte.length} Endpunkte mit KI-Aufruf haben eine Strategie.`,
  );
}
process.exit(fehler ? 1 : 0);
