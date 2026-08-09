import type { Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  EINWILLIGUNG_VERSION,
  MINDESTALTER,
  pruefeEinwilligung,
  pruefeGeburtsdatum,
  ZWECKE,
} from './pure';

// ═══════════════════════════════════════════════════════════════════════════
// DSG-02 und DSG-04 — Alter, Einwilligung, Datenauskunft
//
// Alles Serverseitige zu diesen drei Befunden liegt hier, damit es genau
// eine Stelle gibt, an der `isAdult` und `einwilligung` geschrieben werden.
// Bei `isVerified` hat sich gezeigt, wie teuer eine zweite Schreibstelle
// ist: Ein vergessener Endpunkt hat die ganze Verifizierung ausgehebelt.
//
// Die Entscheidungslogik selbst steht in pure.ts und ist dort getestet
// (npm run test:pure). Hier steht nur, was ohne Firebase nicht geht.
// ═══════════════════════════════════════════════════════════════════════════

function uid(req: Request): string {
  return (req as { user?: { uid?: string } }).user?.uid as string;
}

function fehler(res: Response, code: number, nachricht: string): void {
  res.status(code).json({ error: nachricht });
}

// ── DSG-02a: Alter ─────────────────────────────────────────────────────────

const GRUND_TEXT: Record<string, string> = {
  fehlt: 'Bitte gib dein Geburtsdatum an.',
  ungueltig: 'Das Datum konnte nicht gelesen werden. Format: JJJJ-MM-TT.',
  zukunft: 'Das Datum liegt in der Zukunft.',
  unplausibel: 'Das Datum ergibt kein plausibles Alter.',
  zu_jung: `Klar ist ab ${MINDESTALTER} Jahren.`,
};

/**
 * POST /api/account/alter   { geburtsdatum: "JJJJ-MM-TT" }
 *
 * Die EINZIGE Stelle, an der `isAdult` gesetzt wird. Der Client kann das
 * Feld nach den Firestore-Regeln nicht schreiben.
 *
 * Gespeichert wird das Geburtsdatum, nicht nur das Ergebnis: Ohne das Datum
 * liesse sich die Angabe später nicht nachvollziehen, und der 18. Geburtstag
 * einer heute 17-jährigen Person würde nie bemerkt. Datenminimierung spricht
 * dagegen — die Nachvollziehbarkeit der Alterszusage wiegt hier schwerer.
 */
export async function handleAlter(req: Request, res: Response): Promise<void> {
  const meineUid = uid(req);
  try {
  const pruefung = pruefeGeburtsdatum(req.body?.geburtsdatum);

  if (!pruefung.ok) {
    // Fehlversuche werden festgehalten — ohne Datum. Wer dreimal ein Datum
    // unter 18 eingibt und beim vierten Mal eines darüber, hat das nicht
    // vergessen. Die Bewertung dieser Spur ist Sache der Moderation; der
    // Code trifft daraus keine Entscheidung.
    if (pruefung.grund === 'zu_jung') {
      await getFirestore().collection('age_attempts').add({
        uid: meineUid,
        at: FieldValue.serverTimestamp(),
        ergebnis: 'zu_jung',
      });
    }
    fehler(res, 400, GRUND_TEXT[pruefung.grund] ?? 'Das Datum ist nicht gültig.');
    return;
  }

  await getFirestore().collection('users').doc(meineUid).set(
    {
      geburtsdatum: pruefung.geburtsdatum,
      isAdult: true,
      alterGeprueftAm: FieldValue.serverTimestamp(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  res.json({ ok: true, alter: pruefung.alter });
  } catch (e) {
    // GEGENPRÜFUNG: Diese vier Handler waren als einzige ohne try/catch.
    // Express 4 fängt abgelehnte Promises nicht; unter Node 22 beendet ein
    // unbehandelter Rejection den Prozess — ein vorübergehender
    // Firestore-Fehler hätte den Server für alle beendet.
    console.error('/api/account/alter', e);
    fehler(res, 500, 'Die Angabe konnte nicht gespeichert werden. Bitte erneut versuchen.');
  }
}

// ── DSG-02b: Einwilligung ──────────────────────────────────────────────────

/**
 * POST /api/einwilligung   { zwecke: { ki_auswertung: true, … } }
 *
 * Art. 7 Abs. 1 DSGVO verlangt den Nachweis, dass und WOZU eingewilligt
 * wurde. Deshalb wird jede Erteilung als eigener, unveränderlicher Eintrag
 * abgelegt — nicht als Feld, das die nächste Erteilung überschreibt. Der
 * aktuelle Stand steht zusätzlich am Profil, damit die Regeln und die
 * Endpunkte ihn ohne zweite Abfrage lesen können.
 */
export async function handleEinwilligung(req: Request, res: Response): Promise<void> {
  const meineUid = uid(req);
  try {
  const pruefung = pruefeEinwilligung(req.body?.zwecke ?? req.body);
  if (!pruefung.ok) {
    fehler(res, 400, pruefung.grund);
    return;
  }

  const db = getFirestore();
  const stand = {
    version: EINWILLIGUNG_VERSION,
    erteiltAm: new Date().toISOString(),
    zwecke: pruefung.zwecke,
    widerrufenAm: null as string | null,
  };

  // Nachweis: eigener Eintrag, wird nie überschrieben.
  await db.collection('users').doc(meineUid).collection('einwilligungen').add({
    ...stand,
    at: FieldValue.serverTimestamp(),
    art: 'erteilt',
  });

  await db.collection('users').doc(meineUid).set(
    { einwilligung: stand, updatedAt: new Date().toISOString() },
    { merge: true },
  );

  res.json({ ok: true, einwilligung: stand });
  } catch (e) {
    console.error('/api/einwilligung', e);
    fehler(res, 500, 'Die Einwilligung konnte nicht gespeichert werden. Bitte erneut versuchen.');
  }
}

/**
 * POST /api/einwilligung/widerruf   { zweck?: "ki_auswertung" }
 *
 * Ohne `zweck` wird die gesamte Einwilligung widerrufen. Der Widerruf muss
 * so einfach sein wie die Erteilung (Art. 7 Abs. 3 Satz 4) — deshalb ein
 * Aufruf ohne Pflichtangaben, ohne Rückfrage, ohne Halteschirm.
 *
 * Die Wirkung tritt sofort ein: `zweckErlaubt()` in pure.ts wertet
 * `widerrufenAm` aus, bevor irgendetwas verarbeitet wird.
 */
export async function handleEinwilligungWiderruf(req: Request, res: Response): Promise<void> {
  const meineUid = uid(req);
  try {
    const zweck = req.body?.zweck;
    const db = getFirestore();
    const jetzt = new Date().toISOString();

    const snap = await db.collection('users').doc(meineUid).get();
    const bisher = (snap.data()?.einwilligung ?? null) as
      | { version: number; erteiltAm: string | null; zwecke: Record<string, boolean>; widerrufenAm?: string | null }
      | null;

    // GEGENPRÜFUNG 09.08.2026 — zwei Fehler in der ersten Fassung:
    //
    //   1. Der Teilwiderruf setzte `widerrufenAm: null` fest. Damit liess
    //      sich ein bereits erfolgter VOLLwiderruf durch einen beliebigen
    //      Teilwiderruf zurücknehmen: Der gespeicherte Stand behauptete
    //      danach wieder eine gültige, nicht widerrufene Einwilligung.
    //      Der Nachweis nach Art. 7 Abs. 1 wäre falsch gewesen.
    //   2. `erteiltAm: bisher?.erteiltAm ?? jetzt` erfand ein Erteilungs-
    //      datum, wenn nie eingewilligt worden war. Ein Widerruf ohne
    //      vorherige Einwilligung hätte eine Einwilligung dokumentiert.
    //
    // Ein Widerruf kann nur wegnehmen, nie hinzufügen. Das ist die Regel,
    // an der sich beide Zweige unten messen lassen.
    const teilweise = typeof zweck === 'string' && ZWECKE.includes(zweck as (typeof ZWECKE)[number]);

    const neu = {
      version: bisher?.version ?? EINWILLIGUNG_VERSION,
      // Kein Datum erfinden: null heisst „nie erteilt".
      erteiltAm: bisher?.erteiltAm ?? null,
      zwecke: teilweise
        ? { ...(bisher?.zwecke ?? {}), [zweck as string]: false, notwendig: true }
        : { notwendig: true },
      // Ein bestehender Vollwiderruf bleibt bestehen.
      widerrufenAm: teilweise ? (bisher?.widerrufenAm ?? null) : jetzt,
    };

    await db.collection('users').doc(meineUid).collection('einwilligungen').add({
      ...neu,
      at: FieldValue.serverTimestamp(),
      art: 'widerrufen',
      widerrufenerZweck: teilweise ? zweck : 'alle',
    });

    await db.collection('users').doc(meineUid).set(
      { einwilligung: neu, updatedAt: jetzt },
      { merge: true },
    );

    res.json({ ok: true, einwilligung: neu });
  } catch (e) {
    console.error('/api/einwilligung/widerruf', e);
    fehler(res, 500, 'Der Widerruf konnte nicht gespeichert werden. Bitte erneut versuchen.');
  }
}

/** GET /api/einwilligung — aktueller Stand und die geltende Fassung. */
export async function handleEinwilligungLesen(req: Request, res: Response): Promise<void> {
  try {
    const snap = await getFirestore().collection('users').doc(uid(req)).get();
    res.json({
      einwilligung: snap.data()?.einwilligung ?? null,
      aktuelleVersion: EINWILLIGUNG_VERSION,
      zwecke: ZWECKE,
    });
  } catch (e) {
    console.error('/api/einwilligung (lesen)', e);
    fehler(res, 500, 'Der Stand konnte nicht geladen werden.');
  }
}

// ── DSG-04: Datenauskunft (Art. 15) und Übertragbarkeit (Art. 20) ──────────

/**
 * GET /api/account/export
 *
 * BEFUND: `DataExportWidget.tsx` las zwei localStorage-Schlüssel. Damit
 * enthielt die Auskunft weder Profil noch Nachrichten noch Verbindungen —
 * also fast nichts von dem, was tatsächlich gespeichert ist. Eine Antwort
 * auf ein Auskunftsersuchen wäre materiell unvollständig gewesen.
 *
 * JSON, weil Art. 20 ein „strukturiertes, gängiges und maschinenlesbares
 * Format" verlangt.
 *
 * NICHT ENTHALTEN und bewusst so:
 *   · Nachrichten der jeweils anderen Person. Sie sind deren Daten; eine
 *     Auskunft an A darf B nicht mit ausliefern. Enthalten sind daher nur
 *     die selbst verfassten Nachrichten und die Gesprächsteilnahme.
 *   · Meldungen ÜBER diese Person — sonst wäre jede Meldung durch ein
 *     Auskunftsersuchen aufdeckbar (Art. 15 Abs. 4).
 */
export async function handleExport(req: Request, res: Response): Promise<void> {
  const meineUid = uid(req);
  try {
    const db = getFirestore();

    const profil = await db.collection('users').doc(meineUid).get();

    // GEGENPRÜFUNG: E-Mail und Anzeigename liegen in Firebase Auth, nicht in
    // Firestore. Sie fehlten im Export, obwohl die Verarbeitungsübersicht sie
    // ausdrücklich als verarbeitetes Datum nennt.
    let konto: Record<string, unknown> = { uid: meineUid };
    try {
      const a = await getAuth().getUser(meineUid);
      konto = {
        uid: meineUid,
        email: a.email ?? null,
        anzeigename: a.displayName ?? null,
        anbieter: a.providerData.map((p) => p.providerId),
        angelegtAm: a.metadata.creationTime,
        letzteAnmeldung: a.metadata.lastSignInTime,
      };
    } catch (e) {
      console.error('Export: Auth-Daten nicht ladbar', e);
    }

    const chats = await db.collection('chats').where('participants', 'array-contains', meineUid).get();
    const gespraeche: unknown[] = [];
    // GEGENPRÜFUNG: Der Export lief unbegrenzt über alle Chats, mit einer
    // Abfrage je Chat. Bei vielen Gesprächen läuft die Anfrage in die
    // Zeitgrenze und liefert gar nichts — eine Auskunft, die bei Vielnutzern
    // scheitert, ist keine. Grenze mit sichtbarem Hinweis statt stiller
    // Kürzung.
    const CHAT_GRENZE = 200;
    const chatDocs = chats.docs.slice(0, CHAT_GRENZE);
    for (const c of chatDocs) {
      const nachrichten = await c.ref.collection('messages').where('senderId', '==', meineUid).get();
      // GEGENPRÜFUNG: `lastMessage` am Chatdokument kann der Text der
      // ANDEREN Person sein. Deshalb wird das Feld nicht ausgegeben.
      gespraeche.push({
        chatId: c.id,
        beteiligte: c.data().participants,
        begonnenAm: c.data().createdAt ?? null,
        eigeneNachrichten: nachrichten.docs.map((m) => ({
          id: m.id, text: m.data().text, createdAt: m.data().createdAt,
        })),
        hinweis: 'Nachrichten der anderen Person sind deren Daten und deshalb nicht enthalten.',
      });
    }
    // Eigene Antworten im Icebreaker-Gate: bis zu 1000 Zeichen selbst
    // verfasster Freitext je Antwort. Fehlten im ersten Entwurf.
    const gateAntworten: unknown[] = [];
    for (const c of chatDocs) {
      const g = await c.ref.collection('gate_answers').get();
      g.docs
        .filter((d) => d.data().uid === meineUid || d.id.startsWith(meineUid + '_'))
        .forEach((d) => gateAntworten.push({ chatId: c.id, id: d.id, ...d.data() }));
    }

    const sammeln = async (pfad: string, feld: string) =>
      (await db.collection(pfad).where(feld, '==', meineUid).get()).docs.map((d) => ({ id: d.id, ...d.data() }));

    const [kontakteVon, kontakteAn, blockiert, meldungen, einwilligungen, quota,
           abo, verifizierung, altersversuche] = await Promise.all([
      sammeln('contacts', 'fromUid'),
      sammeln('contacts', 'toUid'),
      sammeln('blocks', 'blockerUid'),
      sammeln('reports', 'reporterId'),
      db.collection('users').doc(meineUid).collection('einwilligungen').get(),
      db.collection('users').doc(meineUid).collection('quota_ledger').get(),
      // GEGENPRÜFUNG: Abo, Verifizierung und Altersversuche fehlten — alles
      // Daten zu dieser Person, alle unter Art. 15 auskunftspflichtig.
      db.collection('subscriptions').doc(meineUid).get(),
      db.collection('verification_events').where('uid', '==', meineUid).get(),
      db.collection('age_attempts').where('uid', '==', meineUid).get(),
    ]);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="klar-auskunft-${meineUid.slice(0, 8)}.json"`);
    res.json({
      erstelltAm: new Date().toISOString(),
      rechtsgrundlage: 'Art. 15 und Art. 20 DSGVO',
      konto,
      profil: profil.exists ? profil.data() : null,
      gespraeche,
      gespraechsvollstaendig: chats.size <= CHAT_GRENZE,
      gespraecheGesamt: chats.size,
      gateAntworten,
      abo: abo.exists ? abo.data() : null,
      verifizierung: verifizierung.docs.map((d) => ({ id: d.id, ...d.data() })),
      altersversuche: altersversuche.docs.map((d) => ({ id: d.id, ...d.data() })),
      kontakte: { ausgehend: kontakteVon, eingehend: kontakteAn },
      blockierungen: blockiert,
      eigeneMeldungen: meldungen,
      einwilligungen: einwilligungen.docs.map((d) => ({ id: d.id, ...d.data() })),
      kontingent: quota.docs.map((d) => ({ id: d.id, ...d.data() })),
      nichtEnthalten: [
        'Nachrichten anderer Personen — deren Daten.',
        'Die Vorschauzeile eines Gesprächs (lastMessage) — sie kann von der anderen Person stammen.',
        'Meldungen über dieses Konto — Art. 15 Abs. 4 DSGVO.',
        'Serverprotokolle mit technischen Kennungen.',
        chats.size > CHAT_GRENZE
          ? `Nur die ersten ${CHAT_GRENZE} von ${chats.size} Gesprächen. Für den Rest bitte melden.`
          : null,
      ].filter(Boolean),
    });
  } catch (e) {
    console.error('/api/account/export', e);
    fehler(res, 500, 'Die Auskunft konnte nicht vollständig erstellt werden. Bitte erneut versuchen.');
  }
}
