import type { Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  CHALLENGE_TTL_MS,
  DAILY_CONTACTS,
  GATE_FRAGEN,
  InputError,
  contactDay,
  entscheideKontakt,
  gateZustand,
  optionalString,
  pruefeChallenge,
  requireString,
  verifizierungsStatus,
  waehleGeste,
  withdrawalPossible,
} from './pure';

// ═══════════════════════════════════════════════════════════════════════════
// Klar — Kernmechanik (P1)
//
//   Kontingent      8 KONTAKTE pro Tag, serverseitig in einer Transaktion
//   Verifizierung   Server gibt die Geste vor, Sichtprüfung entscheidet
//   Icebreaker-Gate zwei Fragen beidseitig, dann freier Chat
//   § 312k / § 356a Kündigung und Widerruf als getrennte Wege
//
// BEFUND, den das ablöst: Das Kontingent lag vollständig im localStorage
// (`klar_contacts_left`). Der Client entschied, wie viele Kontakte er hatte —
// ein Wert, den jede Person in der Entwicklerkonsole ändern kann. Damit war
// das Limit eine Anzeige, keine Grenze.
// ═══════════════════════════════════════════════════════════════════════════

const db = () => getFirestore();
const uid = (req: Request) => (req as any).user?.uid as string;

function fehler(res: Response, e: unknown, wo: string) {
  if (e instanceof InputError) {
    res.status(400).json({ error: e.message });
    return;
  }
  console.error(wo, e);
  res.status(500).json({ error: 'Das hat gerade nicht geklappt. Bitte erneut versuchen.' });
}

function zuDatum(v: unknown): Date | null {
  if (!v) return null;
  const m = v as { toDate?: () => Date };
  if (typeof m.toDate === 'function') return m.toDate();
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ── Kontingent ─────────────────────────────────────────────────────────────

export async function handleQuota(req: Request, res: Response): Promise<void> {
  try {
    const snap = await db().collection('users').doc(uid(req)).get();
    const d = snap.data() ?? {};
    const heute = contactDay();
    const verbraucht = d.contactDay === heute ? (d.contactCount ?? 0) : 0;
    const plan = d.plan === 'plus' ? 'plus' : 'frei';
    res.json({
      uebrig: plan === 'plus' ? null : Math.max(0, DAILY_CONTACTS - verbraucht),
      gesamt: plan === 'plus' ? null : DAILY_CONTACTS,
      plan,
      naechsterTag: '04:00',
    });
  } catch (e) {
    fehler(res, e, '/api/quota');
  }
}

/**
 * Beginnt einen Kontakt. Zähler und Kontaktdokument entstehen in EINER
 * Transaktion — zwei gleichzeitige Anfragen können sich nicht überholen,
 * und ein Abbruch dazwischen kann den Zähler nicht erhöhen, ohne dass der
 * Kontakt entsteht.
 *
 * Die Dokument-ID ist `<von>_<an>`: Ein zweiter Kontakt an dieselbe Person
 * ist damit technisch unmöglich, ohne dass eine Abfrage nötig wäre.
 */
export async function handleContact(req: Request, res: Response): Promise<void> {
  const meine = uid(req);
  try {
    const ziel = requireString(req.body?.targetUid, 'targetUid', 128);
    if (ziel === meine) throw new InputError('Kein Kontakt zum eigenen Konto.');

    const firestore = db();
    const heute = contactDay();
    const nutzer = firestore.collection('users').doc(meine);
    const kontakt = firestore.collection('contacts').doc(`${meine}_${ziel}`);

    const ergebnis = await firestore.runTransaction(async (t) => {
      const [u, k] = await Promise.all([t.get(nutzer), t.get(kontakt)]);
      const d = u.data() ?? {};

      // Verifizierung ist Voraussetzung — dieselbe Bedingung wie in den
      // Firestore-Regeln. Zwei Stellen, eine Aussage.
      if (d.isVerified !== true) return { ok: false as const, grund: 'nicht_verifiziert' as const };
      if (k.exists) return { ok: false as const, grund: 'bereits_kontaktiert' as const };

      const e = entscheideKontakt(
        { tag: d.contactDay ?? '', verbraucht: d.contactCount ?? 0, plan: d.plan === 'plus' ? 'plus' : 'frei' },
        heute,
      );
      if (!e.erlaubt) return { ok: false as const, grund: 'limit' as const };

      t.set(nutzer, { contactDay: heute, contactCount: e.neuVerbraucht }, { merge: true });
      t.set(kontakt, {
        fromUid: meine,
        toUid: ziel,
        at: FieldValue.serverTimestamp(),
        tag: heute,
      });
      return { ok: true as const, uebrig: e.uebrig };
    });

    if (ergebnis.ok) {
      res.json({
        ok: true,
        uebrig: Number.isFinite(ergebnis.uebrig) ? ergebnis.uebrig : null,
        gesamt: DAILY_CONTACTS,
      });
      return;
    }

    const meldung = {
      limit: `Für heute sind alle ${DAILY_CONTACTS} Kontakte vergeben. Morgen um 4 Uhr gibt es neue.`,
      nicht_verifiziert: 'Für den ersten Kontakt ist die Verifizierung nötig.',
      bereits_kontaktiert: 'Diese Person hast du bereits angeschrieben.',
    }[ergebnis.grund];
    res.status(409).json({ ok: false, grund: ergebnis.grund, error: meldung });
  } catch (e) {
    fehler(res, e, '/api/contact');
  }
}

/**
 * Rücknahme innerhalb von 5 Sekunden — mit vollständigem Revert, AUCH des
 * Zählers. Eine Rücknahme, die den Zähler nicht zurücksetzt, ist keine.
 */
export async function handleContactUndo(req: Request, res: Response): Promise<void> {
  const meine = uid(req);
  try {
    const ziel = requireString(req.body?.targetUid, 'targetUid', 128);
    const firestore = db();
    const nutzer = firestore.collection('users').doc(meine);
    const kontakt = firestore.collection('contacts').doc(`${meine}_${ziel}`);

    const ok = await firestore.runTransaction(async (t) => {
      const [u, k] = await Promise.all([t.get(nutzer), t.get(kontakt)]);
      if (!k.exists) return false;
      const angelegt = zuDatum(k.data()?.at);
      // Frist serverseitig prüfen. Eine clientseitig gemessene Frist ist
      // keine Frist.
      if (angelegt && Date.now() - angelegt.getTime() > 5_000) return false;
      const d = u.data() ?? {};
      t.delete(kontakt);
      t.set(nutzer, { contactCount: Math.max(0, (d.contactCount ?? 1) - 1) }, { merge: true });
      return true;
    });

    if (!ok) {
      res.status(409).json({ error: 'Die Rücknahme ist nicht mehr möglich.' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    fehler(res, e, '/api/contact/undo');
  }
}

// ── Verifizierung ──────────────────────────────────────────────────────────

export async function handleVerificationStatus(req: Request, res: Response): Promise<void> {
  try {
    const d = (await db().collection('users').doc(uid(req)).get()).data() ?? {};
    const status = verifizierungsStatus(d);
    res.json({
      status,
      begruendung: d.verificationBegruendung ?? null,
      offeneGeste: status === 'nicht_begonnen' || status === 'abgelehnt' ? (d.verificationGeste ?? null) : null,
    });
  } catch (e) {
    fehler(res, e, '/api/verification/status');
  }
}

export async function handleVerificationChallenge(req: Request, res: Response): Promise<void> {
  const meine = uid(req);
  try {
    const d = (await db().collection('users').doc(meine).get()).data() ?? {};
    if (d.isVerified === true) {
      res.status(409).json({ error: 'Das Konto ist bereits verifiziert.' });
      return;
    }
    if (d.verificationStatus === 'in_pruefung') {
      res.status(409).json({ error: 'Es läuft bereits eine Prüfung.' });
      return;
    }
    const geste = waehleGeste(Math.random());
    await db().collection('users').doc(meine).set(
      {
        verificationGeste: geste,
        verificationChallengeAt: FieldValue.serverTimestamp(),
        verificationChallengeUsedAt: null,
      },
      { merge: true },
    );
    res.json({ geste, gueltigSekunden: Math.floor(CHALLENGE_TTL_MS / 1000), pfad: `verification/${meine}/aktuell.jpg` });
  } catch (e) {
    fehler(res, e, '/api/verification/challenge');
  }
}

export async function handleVerificationSubmit(req: Request, res: Response): Promise<void> {
  const meine = uid(req);
  try {
    const pfad = requireString(req.body?.pfad, 'pfad', 300);
    // Ein fremder Pfad wäre der Versuch, eine fremde Einreichung als eigene
    // auszugeben.
    if (!pfad.startsWith(`verification/${meine}/`)) {
      throw new InputError('Der Pfad gehört nicht zu diesem Konto.');
    }
    const d = (await db().collection('users').doc(meine).get()).data() ?? {};
    if (d.isVerified === true) {
      res.status(409).json({ error: 'Das Konto ist bereits verifiziert.' });
      return;
    }
    const p = pruefeChallenge({
      ausgegebenAm: zuDatum(d.verificationChallengeAt),
      benutztAm: zuDatum(d.verificationChallengeUsedAt),
    });
    if (!p.gueltig) {
      res.status(409).json({
        grund: p.grund,
        error: {
          keine_challenge: 'Bitte zuerst die Geste anfordern.',
          abgelaufen: 'Die Geste ist abgelaufen. Bitte eine neue anfordern.',
          bereits_benutzt: 'Diese Geste wurde bereits eingereicht.',
        }[p.grund],
      });
      return;
    }
    const antrag = await db().collection('verification_requests').add({
      uid: meine,
      geste: d.verificationGeste ?? null,
      pfad,
      eingereichtAm: FieldValue.serverTimestamp(),
      status: 'in_pruefung',
      entscheidung: null,
      begruendung: null,
    });
    await db().collection('users').doc(meine).set(
      {
        verificationStatus: 'in_pruefung',
        verificationChallengeUsedAt: FieldValue.serverTimestamp(),
        verificationBegruendung: null,
      },
      { merge: true },
    );
    res.json({
      ok: true,
      status: 'in_pruefung',
      vorgang: antrag.id.slice(0, 8).toUpperCase(),
      hinweis: 'Wir sehen uns das an. Das dauert in der Regel unter 24 Stunden.',
    });
  } catch (e) {
    fehler(res, e, '/api/verification/submit');
  }
}

/**
 * Sichtprüfung. Die EINZIGE Stelle, die `isVerified` setzt.
 * Die Rolle kommt aus dem Token (Custom Claim), nicht aus Firestore: Ein
 * Feld im Nutzerdokument könnte im Grenzfall vom Konto selbst geschrieben
 * werden, ein Claim nicht.
 */
export async function handleVerificationDecide(req: Request, res: Response): Promise<void> {
  try {
    const konto = await getAuth().getUser(uid(req));
    if (konto.customClaims?.moderator !== true) {
      res.status(403).json({ error: 'Nicht berechtigt.' });
      return;
    }
    const ziel = requireString(req.body?.uid, 'uid', 128);
    const entscheidung = requireString(req.body?.entscheidung, 'entscheidung', 20);
    if (entscheidung !== 'bestaetigt' && entscheidung !== 'abgelehnt') {
      throw new InputError('entscheidung muss "bestaetigt" oder "abgelehnt" sein.');
    }
    // DSA Art. 17: Eine Ablehnung ist eine Beschränkung und braucht eine
    // Begründung. Deshalb Pflichtfeld, nicht optional.
    const begruendung =
      entscheidung === 'abgelehnt'
        ? requireString(req.body?.begruendung, 'begruendung', 1000)
        : optionalString(req.body?.begruendung, 'begruendung', 1000);

    const bestaetigt = entscheidung === 'bestaetigt';
    await db().collection('users').doc(ziel).set(
      {
        isVerified: bestaetigt,
        verificationStatus: entscheidung,
        verificationBegruendung: begruendung || null,
        verificationEntschiedenAm: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    await db().collection('verification_events').add({
      uid: ziel,
      moderatorUid: uid(req),
      entscheidung,
      begruendung: begruendung || null,
      at: FieldValue.serverTimestamp(),
      // Aufbewahrung des Fotos: 30 Tage, solange eine Beschwerde möglich
      // sein muss. Der Auftrag steht hier, damit ihn niemand erinnern muss.
      fotoLoeschenAb: new Date(Date.now() + 30 * 86_400_000),
    });
    res.json({ ok: true, isVerified: bestaetigt });
  } catch (e) {
    fehler(res, e, '/api/verification/decide');
  }
}

// ── Icebreaker-Gate ────────────────────────────────────────────────────────

function gateRef(chatId: string) {
  return db().collection('chats').doc(chatId);
}

export async function handleGateStatus(req: Request, res: Response): Promise<void> {
  try {
    const chatId = requireString(req.query?.chatId, 'chatId', 128);
    const snap = await gateRef(chatId).get();
    const d = snap.data() ?? {};
    const teilnehmer: string[] = d.participants ?? [];
    if (!teilnehmer.includes(uid(req))) {
      res.status(403).json({ error: 'Kein Zugriff auf dieses Gespräch.' });
      return;
    }
    const ichBinA = teilnehmer[0] === uid(req);
    const stand = { antwortenA: d.gateAntwortenA ?? 0, antwortenB: d.gateAntwortenB ?? 0 };
    res.json({
      zustand: gateZustand(stand, ichBinA),
      benoetigt: GATE_FRAGEN,
      meine: ichBinA ? stand.antwortenA : stand.antwortenB,
      fragen: d.gateFragen ?? null,
    });
  } catch (e) {
    fehler(res, e, '/api/gate/status');
  }
}

/**
 * Antwort auf eine Icebreaker-Frage. Der Zähler wird serverseitig erhöht —
 * ein clientseitiger Zähler würde das Gate zur Anzeige machen.
 */
export async function handleGateAnswer(req: Request, res: Response): Promise<void> {
  const meine = uid(req);
  try {
    const chatId = requireString(req.body?.chatId, 'chatId', 128);
    const antwort = requireString(req.body?.antwort, 'antwort', 1000);

    const ergebnis = await db().runTransaction(async (t) => {
      const ref = gateRef(chatId);
      const snap = await t.get(ref);
      const d = snap.data() ?? {};
      const teilnehmer: string[] = d.participants ?? [];
      if (!teilnehmer.includes(meine)) throw new InputError('Kein Zugriff auf dieses Gespräch.');

      const ichBinA = teilnehmer[0] === meine;
      const feld = ichBinA ? 'gateAntwortenA' : 'gateAntwortenB';
      const bisher = d[feld] ?? 0;
      if (bisher >= GATE_FRAGEN) return { zustand: gateZustand({ antwortenA: d.gateAntwortenA ?? 0, antwortenB: d.gateAntwortenB ?? 0 }, ichBinA) };

      const neu = bisher + 1;
      t.set(ref, { [feld]: neu }, { merge: true });
      t.set(ref.collection('gate_answers').doc(`${meine}_${neu}`), {
        uid: meine,
        nummer: neu,
        antwort,
        at: FieldValue.serverTimestamp(),
      });
      const stand = {
        antwortenA: ichBinA ? neu : (d.gateAntwortenA ?? 0),
        antwortenB: ichBinA ? (d.gateAntwortenB ?? 0) : neu,
      };
      return { zustand: gateZustand(stand, ichBinA) };
    });

    res.json({ ok: true, ...ergebnis, benoetigt: GATE_FRAGEN });
  } catch (e) {
    fehler(res, e, '/api/gate/answer');
  }
}

// ── § 312k Kündigung und § 356a Widerruf ───────────────────────────────────
//
// Zwei verschiedene Rechte mit verschiedenen Folgen: Der Widerruf beseitigt
// den Vertrag rückwirkend, die Kündigung beendet ihn für die Zukunft. Sie
// dürfen NICHT zu einem Weg zusammengefasst werden.
//
// Fehlt die Kündigungsschaltfläche, ist der Vertrag nach § 312k Abs. 6 BGB
// jederzeit fristlos kündbar — der Anbieter verliert die Vertragsbindung.

async function ladeAbo(uidStr: string) {
  const d = (await db().collection('subscriptions').doc(uidStr).get()).data() ?? {};
  return {
    plan: d.plan === 'plus' ? ('plus' as const) : ('frei' as const),
    startedAt: zuDatum(d.startedAt),
    paidUntil: zuDatum(d.paidUntil),
    cancelledAt: zuDatum(d.cancelledAt),
    withdrawnAt: zuDatum(d.withdrawnAt),
  };
}

export async function handleSubscriptionStatus(req: Request, res: Response): Promise<void> {
  try {
    const s = await ladeAbo(uid(req));
    res.json({
      plan: s.plan,
      paidUntil: s.paidUntil?.toISOString() ?? null,
      cancelledAt: s.cancelledAt?.toISOString() ?? null,
      widerrufMoeglich: withdrawalPossible(s),
    });
  } catch (e) {
    fehler(res, e, '/api/subscription/status');
  }
}

export async function handleCancel(req: Request, res: Response): Promise<void> {
  const meine = uid(req);
  try {
    const grund = optionalString(req.body?.grund, 'grund', 500);
    const s = await ladeAbo(meine);
    if (s.plan !== 'plus') {
      res.status(409).json({ error: 'Es besteht kein laufendes Abo.' });
      return;
    }
    if (s.cancelledAt) {
      // Doppelte Kündigung ist kein Fehler — das Ergebnis ist dasselbe.
      res.json({ ok: true, bereitsGekuendigt: true, paidUntil: s.paidUntil?.toISOString() ?? null });
      return;
    }
    await db().collection('subscriptions').doc(meine).set(
      {
        cancelledAt: FieldValue.serverTimestamp(),
        cancelGrund: grund || null,
        // Sofort abstellen. Der häufigste Fehler an dieser Stelle ist, dass
        // die Verlängerung trotz Kündigung weiterläuft.
        autoRenew: false,
      },
      { merge: true },
    );
    await db().collection('subscription_events').add({
      uid: meine,
      typ: 'kuendigung',
      at: FieldValue.serverTimestamp(),
      wirksamAb: s.paidUntil ?? null,
      grund: grund || null,
    });
    // § 312k Abs. 4: Bestätigung in Textform.
    // OFFEN: Es hängt kein Versender an `mail_queue`. Solange das so ist,
    // ist die Pflicht NICHT erfüllt. Das steht hier, statt still zu bleiben.
    await db().collection('mail_queue').add({
      uid: meine, template: 'kuendigung_bestaetigung', at: FieldValue.serverTimestamp(), status: 'offen',
    });
    res.json({ ok: true, paidUntil: s.paidUntil?.toISOString() ?? null });
  } catch (e) {
    fehler(res, e, '/api/subscription/cancel');
  }
}

export async function handleWithdraw(req: Request, res: Response): Promise<void> {
  const meine = uid(req);
  try {
    const grund = optionalString(req.body?.grund, 'grund', 500);
    const s = await ladeAbo(meine);
    if (!withdrawalPossible(s)) {
      res.status(409).json({
        error:
          'Die Widerrufsfrist von 14 Tagen ist abgelaufen oder es besteht kein widerrufbarer Vertrag. Eine Kündigung ist weiterhin jederzeit möglich.',
      });
      return;
    }
    const jetzt = new Date();
    await db().collection('subscriptions').doc(meine).set(
      { plan: 'frei', withdrawnAt: FieldValue.serverTimestamp(), paidUntil: jetzt, autoRenew: false, widerrufGrund: grund || null },
      { merge: true },
    );
    await db().collection('users').doc(meine).set({ plan: 'frei' }, { merge: true });
    await db().collection('subscription_events').add({
      uid: meine, typ: 'widerruf', at: FieldValue.serverTimestamp(), wirksamAb: jetzt, grund: grund || null,
    });
    // Die Erstattung läuft über den Zahlungsanbieter. Sie wird hier
    // angestoßen und protokolliert — sie darf nicht davon abhängen, dass
    // jemand das Ereignis später von Hand sieht.
    await db().collection('refund_queue').add({
      uid: meine, grund: 'widerruf', at: FieldValue.serverTimestamp(), status: 'offen',
    });
    await db().collection('mail_queue').add({
      uid: meine, template: 'widerruf_bestaetigung', at: FieldValue.serverTimestamp(), status: 'offen',
    });
    res.json({ ok: true, endetAm: jetzt.toISOString() });
  } catch (e) {
    fehler(res, e, '/api/subscription/withdraw');
  }
}
