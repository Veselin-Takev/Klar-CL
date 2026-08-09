// ═══════════════════════════════════════════════════════════════════════════
// Klar — abhängigkeitsfreie Serverlogik
//
// Diese Datei importiert NICHTS. Sie läuft ohne Firebase, ohne Express und
// ohne installierte Pakete — und ist genau deshalb prüfbar
// (tests/pure.spec.ts, Aufruf: npm run test:pure).
//
// Hier liegen die Entscheidungen, bei denen ein Fehler teuer ist:
// Kontingenttag, Eingabegrenzen, Widerrufsfrist, Verifizierungs-Challenge.
// ═══════════════════════════════════════════════════════════════════════════

/** 8 KONTAKTE pro Tag — erste Nachrichten an neue Menschen.
 *  Nicht Swipes, nicht Nachrichten im laufenden Gespräch. */
export const DAILY_CONTACTS = 8;
export const DAILY_CONTACTS_PLUS = Number.POSITIVE_INFINITY;

/** Der Tag wechselt um 4 Uhr, nicht um Mitternacht — dieselbe Uhrzeit, die
 *  die Oberfläche nennt. Wer um 1 Uhr nachts schreibt, ist noch im Vortag. */
export const RESET_HOUR = 4;

export function contactDay(now: Date = new Date()): string {
  const shifted = new Date(now.getTime());
  if (shifted.getUTCHours() < RESET_HOUR) shifted.setUTCDate(shifted.getUTCDate() - 1);
  return shifted.toISOString().slice(0, 10);
}

export class InputError extends Error {}

export function requireString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string') throw new InputError(`${field} muss ein Text sein.`);
  const t = value.trim();
  if (!t) throw new InputError(`${field} darf nicht leer sein.`);
  if (t.length > maxLength) throw new InputError(`${field} überschreitet ${maxLength} Zeichen.`);
  return t;
}

export function optionalString(value: unknown, field: string, maxLength: number): string {
  if (value === undefined || value === null || value === '') return '';
  return requireString(value, field, maxLength);
}

// ── Kontingent ─────────────────────────────────────────────────────────────

export interface QuotaStand {
  tag: string;
  verbraucht: number;
  plan: 'frei' | 'plus';
}

export type QuotaEntscheidung =
  | { erlaubt: true; neuVerbraucht: number; uebrig: number }
  | { erlaubt: false; grund: 'limit'; uebrig: 0 };

/**
 * Reine Entscheidung: Darf ein weiterer Kontakt begonnen werden?
 * Der Tageswechsel wird hier mitentschieden — ein neuer Tag setzt den
 * Zähler auf 1, nicht auf 0+1 des Vortags.
 */
export function entscheideKontakt(stand: QuotaStand, heute: string): QuotaEntscheidung {
  const grenze = stand.plan === 'plus' ? DAILY_CONTACTS_PLUS : DAILY_CONTACTS;
  const verbraucht = stand.tag === heute ? stand.verbraucht : 0;
  if (verbraucht >= grenze) return { erlaubt: false, grund: 'limit', uebrig: 0 };
  const neu = verbraucht + 1;
  const uebrig = grenze === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : grenze - neu;
  return { erlaubt: true, neuVerbraucht: neu, uebrig };
}

// ── Widerrufsfrist (§ 355 Abs. 2 BGB) ──────────────────────────────────────

export const WITHDRAWAL_DAYS = 14;

export function withdrawalPossible(
  input: { plan: string; startedAt: Date | null; withdrawnAt: Date | null },
  now: Date = new Date(),
): boolean {
  if (input.plan !== 'plus' || !input.startedAt || input.withdrawnAt) return false;
  return now.getTime() < input.startedAt.getTime() + WITHDRAWAL_DAYS * 86_400_000;
}

// ── Verifizierung ──────────────────────────────────────────────────────────
//
// Die Geste kommt vom SERVER und verfällt. Ohne diese beiden Eigenschaften
// ist eine Foto-Verifizierung wirkungslos: Wer die Geste vorher kennt oder
// beliebig lange Zeit hat, reicht ein vorbereitetes Bild ein.
//
// Das ist KEIN Lebendigkeitsnachweis. Es erhöht den Aufwand einer Fälschung,
// es verhindert sie nicht. Alles Weitere entscheidet die Sichtprüfung.

export const GESTEN = [
  'rechte Hand offen neben das Gesicht',
  'linke Hand offen neben das Gesicht',
  'Daumen nach oben vor die Schulter',
  'Zeige- und Mittelfinger nach oben',
  'flache Hand auf die Stirn',
] as const;

export type Geste = (typeof GESTEN)[number];

export const CHALLENGE_TTL_MS = 5 * 60_000;

/** Zufallsquelle wird übergeben, damit dieselbe Zahl dieselbe Geste ergibt —
 *  sonst wäre die Auswahl nicht prüfbar. */
export function waehleGeste(zufall: number): Geste {
  const i = Math.min(GESTEN.length - 1, Math.max(0, Math.floor(zufall * GESTEN.length)));
  return GESTEN[i]!;
}

export type ChallengePruefung =
  | { gueltig: true }
  | { gueltig: false; grund: 'keine_challenge' | 'abgelaufen' | 'bereits_benutzt' };

export function pruefeChallenge(
  c: { ausgegebenAm: Date | null; benutztAm: Date | null } | null,
  now: Date = new Date(),
): ChallengePruefung {
  if (!c || !c.ausgegebenAm) return { gueltig: false, grund: 'keine_challenge' };
  if (c.benutztAm) return { gueltig: false, grund: 'bereits_benutzt' };
  if (now.getTime() >= c.ausgegebenAm.getTime() + CHALLENGE_TTL_MS) {
    return { gueltig: false, grund: 'abgelaufen' };
  }
  return { gueltig: true };
}

export type VerifizierungsStatus = 'nicht_begonnen' | 'in_pruefung' | 'bestaetigt' | 'abgelehnt';

/** `isVerified` ist die einzige Quelle für „bestätigt". Ein Statusfeld, das
 *  „bestaetigt" sagt, ohne dass das Flag gesetzt ist, wäre ein Widerspruch —
 *  und im Zweifel gilt das Flag. */
export function verifizierungsStatus(u: { isVerified?: boolean; verificationStatus?: string }): VerifizierungsStatus {
  if (u.isVerified === true) return 'bestaetigt';
  if (u.verificationStatus === 'in_pruefung') return 'in_pruefung';
  if (u.verificationStatus === 'abgelehnt') return 'abgelehnt';
  return 'nicht_begonnen';
}

// ── Icebreaker-Gate ────────────────────────────────────────────────────────
//
// Beide beantworten zwei Fragen, danach ist der Chat offen. Der Mechanismus,
// der „Mehr echte Gespräche" trägt.

export const GATE_FRAGEN = 2;

export interface GateStand {
  antwortenA: number;
  antwortenB: number;
}

export type GateZustand = 'offen' | 'wartet_auf_andere' | 'du_bist_dran';

/** `ichBinA` sagt, welche Seite fragt. Beide Seiten müssen GATE_FRAGEN
 *  beantwortet haben — einseitig geöffnet wäre kein Gate. */
export function gateZustand(stand: GateStand, ichBinA: boolean): GateZustand {
  const meine = ichBinA ? stand.antwortenA : stand.antwortenB;
  const andere = ichBinA ? stand.antwortenB : stand.antwortenA;
  if (meine >= GATE_FRAGEN && andere >= GATE_FRAGEN) return 'offen';
  if (meine >= GATE_FRAGEN) return 'wartet_auf_andere';
  return 'du_bist_dran';
}
