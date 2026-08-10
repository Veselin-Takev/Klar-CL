#!/usr/bin/env node
// Prueft: wird ein React-Hook benutzt, der nicht importiert ist?
//
// WOZU: "useRef is not defined" legte am 10.08.2026 das Dashboard lahm. Der
// Fehler war unsichtbar, weil @ts-nocheck in acht Dateien den Compiler
// abschaltet -- genau die Pruefung also, die das gefunden haette.
//
// WARUM EIN EIGENES SKRIPT UND NICHT GREP: Zwei Formen brachen den ersten
// Versuch, beide in diesem Projekt vorhanden:
//   1. import React, { useState } from 'react'  -- der Vorgabe-Import davor
//      liess die Klammer-Suche ins Leere laufen  -> falscher Alarm.
//   2. useRef<NodeJS.Timeout | null>(...)  -- zwischen Name und Klammer steht
//      eine Generic, "useRef(" findet nichts  -> uebersehener echter Fehler.
// Beide Richtungen sind vorgekommen.
//
// GRENZE, AUSDRUECKLICH: Das ist eine Textpruefung, kein Parser. Ein Hook in
// einer Zeichenkette oder in einem Kommentar zaehlt sie mit. Sie ersetzt tsc
// nicht -- sie schliesst die Luecke, die @ts-nocheck reisst.

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const HOOKS = [
  'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext',
  'useReducer', 'useLayoutEffect', 'useTransition', 'useDeferredValue',
  'useId', 'useSyncExternalStore', 'useImperativeHandle', 'useOptimistic',
  'useActionState', 'useInsertionEffect', 'useDebugValue',
];

const dateien = execSync(
  `find src \\( -name '*.tsx' -o -name '*.ts' \\) ! -name '*.d.ts'`,
  { encoding: 'utf8' },
).trim().split('\n').filter(Boolean);

function reactImporte(text) {
  const namen = new Set();
  let sternImport = null;

  const stern = text.match(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]react['"]/);
  if (stern) sternImport = stern[1];
  const vorgabe = text.match(
    /import\s+(\w+)\s*(?:,\s*\{[^}]*\})?\s*from\s*['"]react['"]/,
  );
  if (vorgabe) sternImport = vorgabe[1];

  // [^}] statt [\s\S]*? : Die faule Fassung sprang ueber fremde Import-Zeilen
  // hinweg bis zur naechsten schliessenden Klammer vor from 'react' und
  // schnitt die Namensliste mittendurch -- Login.tsx und Confetti.tsx wurden
  // dadurch faelschlich gemeldet.
  for (const m of text.matchAll(
    /import\s+(?:type\s+)?(?:\w+\s*,\s*)?\{([^}]*)\}\s*from\s*['"]react['"]/g,
  )) {
    for (const roh of m[1].split(',')) {
      const teil = roh.trim();
      if (!teil) continue;
      const alias = teil.match(/^\s*(\w+)\s+as\s+(\w+)\s*$/);
      namen.add(alias ? alias[2] : teil.replace(/^type\s+/, ''));
    }
  }
  return { namen, sternImport };
}

// Faengt useRef( UND useRef<Typ>( . Wortgrenze davor, damit myUseRef( nicht zaehlt.
function wirdBenutzt(text, hook) {
  const re = new RegExp(`(?<![\\w.])${hook}\\s*(?:<[^;{}()]*>\\s*)?\\(`);
  return re.test(text);
}

const befunde = [];
for (const datei of dateien) {
  const text = readFileSync(datei, 'utf8');
  const { namen, sternImport } = reactImporte(text);
  for (const hook of HOOKS) {
    if (!wirdBenutzt(text, hook)) continue;
    if (namen.has(hook)) continue;
    if (sternImport && text.includes(`${sternImport}.${hook}`)) continue;
    if (new RegExp(`(?:function|const|let)\\s+${hook}\\b`).test(text)) continue;
    befunde.push({ datei, hook });
  }
}

if (befunde.length === 0) {
  console.log('Haken-Importe: keine Luecke gefunden.');
  process.exit(0);
}
console.error(`Haken benutzt, aber nicht importiert -- ${befunde.length} Stueck:\n`);
for (const b of befunde) console.error(`  ${b.datei}  ->  ${b.hook}`);
process.exit(1);
