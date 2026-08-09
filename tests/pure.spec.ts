import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHALLENGE_TTL_MS, DAILY_CONTACTS, GATE_FRAGEN, GESTEN, InputError,
  contactDay, entscheideKontakt, gateZustand, optionalString, pruefeChallenge,
  requireString, verifizierungsStatus, waehleGeste, withdrawalPossible,
} from '../src/server/pure.ts';

// Prüft die Entscheidungen, bei denen ein Fehler teuer ist.
// Läuft ohne Firebase, ohne Express, ohne Registry:  npm run test:pure

describe('Kontingenttag', () => {
  it('wechselt um 4 Uhr, nicht um Mitternacht', () => {
    assert.equal(contactDay(new Date('2026-08-09T03:59:00Z')), '2026-08-08');
    assert.equal(contactDay(new Date('2026-08-09T04:00:00Z')), '2026-08-09');
  });
  it('01:00 nachts gehört noch zum Vortag', () => {
    assert.equal(contactDay(new Date('2026-08-09T01:00:00Z')), '2026-08-08');
  });
  it('Monatswechsel wird zurückgerechnet', () => {
    assert.equal(contactDay(new Date('2026-09-01T02:00:00Z')), '2026-08-31');
  });
  it('Jahreswechsel ebenso', () => {
    assert.equal(contactDay(new Date('2027-01-01T02:00:00Z')), '2026-12-31');
  });
});

describe('Kontingent-Entscheidung', () => {
  const heute = '2026-08-09';
  it('erster Kontakt am Tag', () => {
    const e = entscheideKontakt({ tag: '', verbraucht: 0, plan: 'frei' }, heute);
    assert.deepEqual(e, { erlaubt: true, neuVerbraucht: 1, uebrig: 7 });
  });
  it('achter Kontakt ist der letzte', () => {
    const e = entscheideKontakt({ tag: heute, verbraucht: 7, plan: 'frei' }, heute);
    assert.deepEqual(e, { erlaubt: true, neuVerbraucht: 8, uebrig: 0 });
  });
  it('neunter wird abgelehnt', () => {
    const e = entscheideKontakt({ tag: heute, verbraucht: DAILY_CONTACTS, plan: 'frei' }, heute);
    assert.deepEqual(e, { erlaubt: false, grund: 'limit', uebrig: 0 });
  });
  it('neuer Tag setzt auf 1, nicht auf alt+1', () => {
    const e = entscheideKontakt({ tag: '2026-08-08', verbraucht: 8, plan: 'frei' }, heute);
    assert.deepEqual(e, { erlaubt: true, neuVerbraucht: 1, uebrig: 7 });
  });
  it('Plus ist unbegrenzt', () => {
    const e = entscheideKontakt({ tag: heute, verbraucht: 500, plan: 'plus' }, heute);
    assert.equal(e.erlaubt, true);
  });
});

describe('Eingabegrenzen', () => {
  it('leerer Text wird abgelehnt', () => {
    assert.throws(() => requireString('   ', 'feld', 10), InputError);
  });
  it('zu langer Text wird abgelehnt', () => {
    assert.throws(() => requireString('x'.repeat(11), 'feld', 10), InputError);
  });
  it('Zahl statt Text wird abgelehnt', () => {
    assert.throws(() => requireString(5, 'feld', 10), InputError);
  });
  it('optionale Felder dürfen fehlen', () => {
    assert.equal(optionalString(undefined, 'feld', 10), '');
    assert.equal(optionalString('  ok  ', 'feld', 10), 'ok');
  });
});

describe('Widerrufsfrist (§ 355 Abs. 2 BGB)', () => {
  const start = new Date('2026-08-01T12:00:00Z');
  it('Sekunde vor Ablauf noch möglich', () => {
    assert.equal(withdrawalPossible({ plan: 'plus', startedAt: start, withdrawnAt: null },
      new Date(start.getTime() + 14 * 86_400_000 - 1000)), true);
  });
  it('exakt bei Ablauf nicht mehr', () => {
    assert.equal(withdrawalPossible({ plan: 'plus', startedAt: start, withdrawnAt: null },
      new Date(start.getTime() + 14 * 86_400_000)), false);
  });
  it('ohne Abo nicht möglich', () => {
    assert.equal(withdrawalPossible({ plan: 'frei', startedAt: start, withdrawnAt: null }), false);
  });
  it('zweimal widerrufen geht nicht', () => {
    assert.equal(withdrawalPossible({ plan: 'plus', startedAt: start, withdrawnAt: new Date() }), false);
  });
});

describe('Verifizierung — Geste', () => {
  it('deckt die ganze Liste ab', () => {
    const gesehen = new Set(Array.from({ length: GESTEN.length }, (_, i) => waehleGeste(i / GESTEN.length)));
    assert.equal(gesehen.size, GESTEN.length);
  });
  it('Randwerte laufen nicht aus der Liste', () => {
    assert.equal(waehleGeste(0), GESTEN[0]);
    assert.equal(waehleGeste(1), GESTEN[GESTEN.length - 1]);
    assert.equal(waehleGeste(-5), GESTEN[0]);
  });
});

describe('Verifizierung — Frist', () => {
  const aus = new Date('2026-08-09T10:00:00Z');
  it('ohne Challenge ist nichts gültig', () => {
    assert.deepEqual(pruefeChallenge(null), { gueltig: false, grund: 'keine_challenge' });
  });
  it('innerhalb der Frist gültig', () => {
    assert.deepEqual(pruefeChallenge({ ausgegebenAm: aus, benutztAm: null },
      new Date(aus.getTime() + CHALLENGE_TTL_MS - 1000)), { gueltig: true });
  });
  it('exakt bei Ablauf nicht mehr', () => {
    assert.deepEqual(pruefeChallenge({ ausgegebenAm: aus, benutztAm: null },
      new Date(aus.getTime() + CHALLENGE_TTL_MS)), { gueltig: false, grund: 'abgelaufen' });
  });
  it('zweite Einreichung derselben Geste gesperrt', () => {
    assert.deepEqual(pruefeChallenge({ ausgegebenAm: aus, benutztAm: aus },
      new Date(aus.getTime() + 1000)), { gueltig: false, grund: 'bereits_benutzt' });
  });
});

describe('Verifizierung — Status', () => {
  it('isVerified ist die einzige Quelle für "bestätigt"', () => {
    assert.equal(verifizierungsStatus({ isVerified: true }), 'bestaetigt');
  });
  it('Widerspruch: Statusfeld sagt bestätigt, Flag fehlt → nicht bestätigt', () => {
    assert.equal(verifizierungsStatus({ isVerified: false, verificationStatus: 'bestaetigt' }), 'nicht_begonnen');
  });
  it('laufende Prüfung wird erkannt', () => {
    assert.equal(verifizierungsStatus({ verificationStatus: 'in_pruefung' }), 'in_pruefung');
  });
});

describe('Icebreaker-Gate', () => {
  it('niemand hat geantwortet → du bist dran', () => {
    assert.equal(gateZustand({ antwortenA: 0, antwortenB: 0 }, true), 'du_bist_dran');
  });
  it('eine Antwort reicht nicht', () => {
    assert.equal(gateZustand({ antwortenA: 1, antwortenB: 0 }, true), 'du_bist_dran');
  });
  it('ich fertig, andere nicht → warten', () => {
    assert.equal(gateZustand({ antwortenA: GATE_FRAGEN, antwortenB: 1 }, true), 'wartet_auf_andere');
  });
  it('beide fertig → offen', () => {
    assert.equal(gateZustand({ antwortenA: GATE_FRAGEN, antwortenB: GATE_FRAGEN }, true), 'offen');
  });
  it('Sicht der anderen Seite ist symmetrisch', () => {
    assert.equal(gateZustand({ antwortenA: GATE_FRAGEN, antwortenB: 1 }, false), 'du_bist_dran');
  });
  it('einseitig geöffnet gibt es nicht', () => {
    assert.equal(gateZustand({ antwortenA: 99, antwortenB: 0 }, true), 'wartet_auf_andere');
  });
});
