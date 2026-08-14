// ═══════════════════════════════════════════════════════════════════════════
// Client-Seite der Kernmechanik. Alle Zustände kommen vom Server —
// nichts davon wird im localStorage gespiegelt. Ein zwischengespeicherter
// Verifizierungsstatus oder Kontingentstand ist ein Zustand, den das Gerät
// setzen kann.
// ═══════════════════════════════════════════════════════════════════════════

import { auth } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// `firebase/storage` wird NICHT hier oben importiert.
//
// ── DER BEFUND VOM 14.08.2026 ─────────────────────────────────────────────
// `npm run groesse` hat ausgerechnet, woraus das Startstueck besteht.
// `@firebase/storage` stand darin mit 31,7 kB (2,4 %) — obwohl es an genau
// EINER Stelle gebraucht wird: beim Hochladen des Verifizierungsfotos in
// `reicheVerifizierungEin()` weiter unten.
//
// Ein Import am Dateikopf laedt das Paket, sobald irgendeine Funktion aus
// dieser Datei gebraucht wird. `klar.ts` haengt am Startgraph, also lud
// jeder Anmeldebildschirm die Datei-Ablage mit — fuer ein Foto, das die
// wenigsten je hochladen.
//
// Der Import steht deshalb IN der Funktion. Sie ist ohnehin `async`; der
// zusaetzliche `await` kostet nichts, was neben einem Datei-Upload ins
// Gewicht faellt.
// ═══════════════════════════════════════════════════════════════════════════

async function json<T>(res: Response): Promise<T> {
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((d as { error?: string }).error || `Server-Antwort ${res.status}`);
  return d as T;
}

// ── Kontingent ─────────────────────────────────────────────────────────────

export interface KontaktErgebnis { ok: true; uebrig: number | null; gesamt: number }

/** Beginnt einen Kontakt. Wirft mit der Servermeldung, wenn das Kontingent
 *  aufgebraucht, die Verifizierung offen oder die Person schon
 *  angeschrieben ist. */
export async function beginneKontakt(targetUid: string): Promise<KontaktErgebnis> {
  return json<KontaktErgebnis>(
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUid }),
    }),
  );
}

/** Rücknahme innerhalb von 5 Sekunden. Die Frist prüft der Server. */
export async function nimmKontaktZurueck(targetUid: string): Promise<void> {
  await json(
    await fetch('/api/contact/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUid }),
    }),
  );
}

// ── Verifizierung ──────────────────────────────────────────────────────────

export type VerifizierungsStatus = 'nicht_begonnen' | 'in_pruefung' | 'bestaetigt' | 'abgelehnt';

export interface StatusAntwort { status: VerifizierungsStatus; begruendung: string | null }
export interface ChallengeAntwort { geste: string; gueltigSekunden: number; pfad: string }

export async function verifizierungsStatus(): Promise<StatusAntwort> {
  return json<StatusAntwort>(await fetch('/api/verification/status'));
}

export async function holeGeste(): Promise<ChallengeAntwort> {
  return json<ChallengeAntwort>(await fetch('/api/verification/challenge', { method: 'POST' }));
}

/** Erst hochladen, dann melden. Andersherum entstünde ein Antrag ohne Bild —
 *  und die Sichtprüfung hätte nichts zu prüfen, ohne dass es auffällt. */
export async function reicheVerifizierungEin(datei: Blob, pfad: string): Promise<{ vorgang: string }> {
  if (!auth.currentUser) throw new Error('Nicht angemeldet.');
  const { getStorage, ref, uploadBytes } = await import('firebase/storage');
  await uploadBytes(ref(getStorage(), pfad), datei, { contentType: datei.type || 'image/jpeg' });
  return json<{ vorgang: string }>(
    await fetch('/api/verification/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pfad }),
    }),
  );
}

// ── Icebreaker-Gate ────────────────────────────────────────────────────────

export type GateZustand = 'offen' | 'wartet_auf_andere' | 'du_bist_dran';

export interface GateAntwort { zustand: GateZustand; benoetigt: number; meine: number }

export async function gateStatus(chatId: string): Promise<GateAntwort> {
  return json<GateAntwort>(await fetch(`/api/gate/status?chatId=${encodeURIComponent(chatId)}`));
}

export async function beantworteGate(chatId: string, antwort: string): Promise<GateAntwort> {
  return json<GateAntwort>(
    await fetch('/api/gate/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, antwort }),
    }),
  );
}

// ── Abo: Kündigung (§ 312k) und Widerruf (§ 356a) ──────────────────────────

export interface AboStatus {
  plan: 'frei' | 'plus';
  paidUntil: string | null;
  cancelledAt: string | null;
  widerrufMoeglich: boolean;
}

export async function aboStatus(): Promise<AboStatus> {
  return json<AboStatus>(await fetch('/api/subscription/status'));
}

export async function kuendige(grund?: string): Promise<{ paidUntil: string | null }> {
  return json(await fetch('/api/subscription/cancel', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grund }),
  }));
}

export async function widerrufe(grund?: string): Promise<{ endetAm: string }> {
  return json(await fetch('/api/subscription/withdraw', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grund }),
  }));
}
