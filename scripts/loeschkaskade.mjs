#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// Jede Firestore-Sammlung braucht eine Entscheidung zur Kontoloeschung.
//
// ── DER BEFUND VOM 14.08.2026 ─────────────────────────────────────────────
// Die Auskunft nach Art. 15 (`handleExport`) gab Daten aus, die die Loeschung
// nach Art. 17 (`handleDeleteAccount`) nicht anfasste. Die App wusste also,
// dass diese Daten dieser Person gehoeren — und behielt sie trotzdem.
//
// Am schaerfsten bei `chats/{id}/gate_answers`: Firestore loescht mit einem
// Dokument KEINE Unterkollektionen. Der Chat verschwand, der selbst
// verfasste Freitext blieb als Waise liegen.
//
// Der Code warnt an zwei Stellen selbst davor („Eine neue Sammlung, die
// nicht in dieser Liste steht, ueberlebt die Loeschung") — und tappte
// trotzdem hinein. Ein Kommentar ist keine Pruefung. Dieses Skript ist eine.
//
// ── WAS ES PRUEFT ─────────────────────────────────────────────────────────
// 1. Jede Sammlung, die im Servercode vorkommt, steht unten in ENTSCHEIDEN.
//    Eine neue Sammlung ohne Eintrag faellt sofort auf.
// 2. Jede Sammlung mit der Entscheidung `geloescht` wird in
//    `handleDeleteAccount` auch tatsaechlich genannt. Eine Tabelle, die
//    etwas behauptet, was der Code nicht tut, waere schlimmer als keine.
// 3. Sammlungen mit `offen` werden gezaehlt — sie halten den Stand fest,
//    bis eine Entscheidung getroffen ist.
//
// ── WAS ES NICHT LEISTET ──────────────────────────────────────────────────
// Es kann nicht pruefen, ob die Abfrage die RICHTIGEN Feldnamen benutzt.
// Genau daran scheiterte der entfernte zweite Loeschweg: Er suchte
// `connections` ueber `senderId`/`receiverId`, waehrend die Felder
// `fromUid`/`toUid` heissen — die Abfrage traf nichts und meldete Erfolg.
// Dafuer braucht es Tests gegen den Emulator.
//
// Aufruf:  node scripts/loeschkaskade.mjs [Obergrenze]
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const obergrenze = Number(process.argv[2] ?? 0);

/**
 * Die Entscheidung je Sammlung.
 *
 *   geloescht — wird bei der Kontoloeschung entfernt
 *   bleibt    — bleibt bewusst, mit Grund
 *   offen     — Entscheidung steht aus; wird gezaehlt
 */
const ENTSCHEIDEN = {
  users: { art: 'geloescht', grund: 'Das Profil selbst.' },
  chats: { art: 'geloescht', grund: 'Ein Chat gehoert beiden; ein halber Chat nuetzt niemandem.' },
  messages: { art: 'geloescht', grund: 'Unterkollektion von chats.' },
  gate_answers: { art: 'geloescht', grund: 'Unterkollektion von chats; selbst verfasster Freitext, auskunftspflichtig.' },
  connections: { art: 'geloescht', grund: 'In beide Richtungen, ueber vier Feldnamen.' },
  contacts: { art: 'geloescht', grund: 'Kontaktanfragen in beide Richtungen (fromUid/toUid).' },
  quota_ledger: { art: 'geloescht', grund: 'Unterkollektion von users.' },
  einwilligungen: { art: 'geloescht', grund: 'Unterkollektion von users; Zeitstempel und Zwecke.' },
  ki_zwischenspeicher: { art: 'geloescht', grund: 'Unterkollektion von users; Aussagen ueber diese Person.' },
  age_attempts: { art: 'geloescht', grund: 'Enthaelt die uid im Klartext.' },
  blocks: { art: 'geloescht', grund: 'In beide Richtungen.' },
  reports: { art: 'geloescht', grund: 'Eigene Meldungen weg; Meldungen UEBER die Person bleiben pseudonymisiert (DSA Art. 17).' },

  deletion_log: { art: 'bleibt', grund: 'Nachweis der Loeschung nach Art. 5 Abs. 2 DSGVO. Enthaelt nur die ersten sechs Zeichen der uid und Stueckzahlen, keine Inhalte.' },

  subscriptions: { art: 'offen', grund: 'Abo-Stammdaten. Aufbewahrungspflicht denkbar (§ 147 AO), heute gibt es keine echten Zahlungen.' },
  subscription_events: { art: 'offen', grund: 'Kuendigung und Widerruf mit uid. Nachweiswert gegen spaetere Streitigkeiten.' },
  refund_queue: { art: 'offen', grund: 'Offene Erstattungen mit uid. Loeschen waehrend der Bearbeitung waere ein eigener Fehler.' },
  mail_queue: { art: 'offen', grund: 'Ausstehende Bestaetigungsmails mit uid. Ohne uid womoeglich nicht mehr zustellbar.' },
  verification_requests: { art: 'offen', grund: 'Antraege auf Verifizierung mit uid.' },
  verification_events: { art: 'offen', grund: 'Verifizierungsverlauf mit uid; auskunftspflichtig, aber nicht geloescht.' },
  audit_logs: { art: 'offen', grund: 'KI-Coach-Verlauf: userId im Klartext, Frage und Antwort verschluesselt. Der Schluessel liegt beim Betreiber — damit Personenbezug.' },
};

function ohneKommentare(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/.*$/gm, (_m, vor) => vor);
}

function dateien(pfad, aus = []) {
  if (!existsSync(pfad)) return aus;
  if (statSync(pfad).isFile()) { aus.push(pfad); return aus; }
  for (const e of readdirSync(pfad)) {
    const p = join(pfad, e);
    if (statSync(p).isDirectory()) dateien(p, aus);
    else if (/\.ts$/.test(p) && !/\.(test|spec)\.ts$/.test(p)) aus.push(p);
  }
  return aus;
}

/** Alle Sammlungsnamen aus dem Servercode, Kommentare vorher entfernt. */
const gefunden = new Map();
for (const datei of [...dateien('server.ts'), ...dateien('src/server')]) {
  const text = ohneKommentare(readFileSync(datei, 'utf8'));
  for (const m of text.matchAll(/collection\(\s*['"]([a-z_]+)['"]/g)) {
    const name = m[1];
    if (!gefunden.has(name)) gefunden.set(name, new Set());
    gefunden.get(name).add(datei);
  }
}

/** Der Rumpf von `handleDeleteAccount` — fuer die Gegenprobe zur Tabelle. */
function kaskadenrumpf() {
  const quelle = ohneKommentare(readFileSync('src/server/trustAndSafety.ts', 'utf8'));
  const start = quelle.indexOf('export async function handleDeleteAccount');
  if (start === -1) return null;
  // Bis zur naechsten Deklaration auf Spaltenebene 0, sonst bis zum Ende.
  const rest = quelle.slice(start + 1);
  const naechste = rest.search(/\n(export |function |const |class )/);
  return naechste === -1 ? rest : rest.slice(0, naechste);
}

const rumpf = kaskadenrumpf();
const fehler = [];
const offen = [];

for (const [name, orte] of [...gefunden].sort()) {
  const e = ENTSCHEIDEN[name];
  if (!e) {
    fehler.push({ name, grund: 'steht in keiner Entscheidung', orte: [...orte] });
    continue;
  }
  if (e.art === 'offen') offen.push({ name, grund: e.grund });
  if (e.art === 'geloescht' && rumpf !== null && !rumpf.includes(`'${name}'`)) {
    fehler.push({
      name,
      grund: 'als „geloescht" eingetragen, kommt aber in handleDeleteAccount nicht vor',
      orte: [...orte],
    });
  }
}

for (const name of Object.keys(ENTSCHEIDEN)) {
  if (!gefunden.has(name)) {
    fehler.push({ name, grund: 'steht in der Tabelle, kommt im Code aber nicht mehr vor', orte: [] });
  }
}

const gezaehlt = fehler.length + offen.length;

console.log(`\nSammlungen im Servercode: ${gefunden.size}.`);
console.log(`  geloescht: ${Object.values(ENTSCHEIDEN).filter((e) => e.art === 'geloescht').length}   ` +
            `bleibt: ${Object.values(ENTSCHEIDEN).filter((e) => e.art === 'bleibt').length}   ` +
            `offen: ${offen.length}`);
console.log(`\nOffen oder unentschieden: ${gezaehlt} — erlaubt sind ${obergrenze}.\n`);

if (fehler.length > 0) {
  console.log('  ── OHNE ENTSCHEIDUNG ──');
  for (const f of fehler) {
    console.log(`  ${f.name}: ${f.grund}`);
    if (f.orte.length) console.log(`      ${f.orte.slice(0, 2).join(', ')}`);
  }
  console.log('');
}
if (offen.length > 0) {
  console.log('  ── ENTSCHEIDUNG STEHT AUS ──');
  for (const o of offen) console.log(`  ${o.name}: ${o.grund}`);
  console.log('');
}

if (gezaehlt > obergrenze) {
  console.log([
    'Eine Sammlung, die bei der Kontoloeschung liegenbleibt, ist ein Verstoss',
    'gegen Art. 17 DSGVO — es sei denn, es gibt einen Grund, und der steht',
    'aufgeschrieben. Jede Sammlung gehoert deshalb in ENTSCHEIDEN in',
    'scripts/loeschkaskade.mjs, mit "geloescht", "bleibt" oder "offen".',
    '',
  ].join('\n'));
  process.exit(1);
}
console.log('');
