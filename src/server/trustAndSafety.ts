import type { Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// P0-5 und P0-6 — Meldung (DSA Art. 16) und Löschung (Art. 17 DSGVO)
//
// Beide Befunde sind dieselbe Fehlerklasse: Die Oberfläche behauptet etwas,
// das der Code nicht leistet.
//
//   P0-5  ChatView.tsx: `onClick={() => { setReportSubmitted(true); }}`
//         Der Melden-Knopf setzte einen lokalen Zustand. Kein Schreibvorgang,
//         kein Serveraufruf. Danach sah die meldende Person eine Bestätigung
//         für eine Meldung, die nirgends existierte — und meldete deshalb
//         nicht noch einmal auf einem anderen Weg.
//
//   P0-6  Profile.tsx: `deleteDoc(users/{uid})` + `deleteUser()`.
//         Chats, Nachrichten und Verbindungen blieben liegen. Eine
//         clientseitige Kaskade ist technisch gar nicht möglich — der Client
//         hat nach den Firestore-Regeln keinen Schreibzugriff auf fremde
//         Chatdokumente. Sie sieht nur so aus.
// ═══════════════════════════════════════════════════════════════════════════

function uid(req: Request): string {
  return (req as any).user?.uid as string;
}

function text(wert: unknown, feld: string, max: number, pflicht = true): string {
  if (wert === undefined || wert === null || wert === '') {
    if (pflicht) throw new Error(`${feld} fehlt.`);
    return '';
  }
  if (typeof wert !== 'string') throw new Error(`${feld} muss ein Text sein.`);
  const t = wert.trim();
  if (pflicht && !t) throw new Error(`${feld} darf nicht leer sein.`);
  if (t.length > max) throw new Error(`${feld} überschreitet ${max} Zeichen.`);
  return t;
}

// ── P0-5: Melden ───────────────────────────────────────────────────────────

const GRUENDE = new Set([
  'unangemessenes_verhalten',
  'fakeprofil_spam',
  'belaestigung',
  'minderjaehrig',
  'sonstiges',
]);

export async function handleReport(req: Request, res: Response): Promise<void> {
  const meineUid = uid(req);
  try {
    const zielUid = text(req.body?.targetUid, 'targetUid', 128);
    const grund = text(req.body?.grund, 'grund', 64);
    const beschreibung = text(req.body?.beschreibung, 'beschreibung', 2000, false);
    const chatId = text(req.body?.chatId, 'chatId', 128, false);

    if (!GRUENDE.has(grund)) throw new Error('Unbekannter Meldegrund.');
    if (zielUid === meineUid) throw new Error('Eine Meldung über das eigene Konto ist nicht vorgesehen.');

    const db = getFirestore();

    // Erst speichern, DANN bestätigen. Die Reihenfolge ist der ganze Punkt.
    const ref = await db.collection('reports').add({
      reporterId: meineUid,
      reportedProfileId: zielUid,
      reason: grund,
      beschreibung: beschreibung || null,
      chatId: chatId || null,
      timestamp: FieldValue.serverTimestamp(),
      status: 'open',
      // DSA Art. 16 Abs. 6: Die Entscheidung ist zu begründen. Das Feld ist
      // der Ort, an dem die Begründung entsteht — nicht ein Freitext in
      // einer Mail, den niemand wiederfindet.
      entscheidung: null,
      begruendung: null,
    });

    // Aktenzeichen: kurz genug zum Vorlesen, lang genug zum Wiederfinden.
    // Eine Eingangsbestätigung ohne Bezug ist für die meldende Person
    // wertlos (DSA Art. 16 Abs. 4).
    const aktenzeichen = ref.id.slice(0, 8).toUpperCase();
    await ref.set({ aktenzeichen }, { merge: true });

    res.json({
      ok: true,
      aktenzeichen,
      hinweis: 'Die Meldung ist eingegangen und wird geprüft. Du erhältst eine begründete Entscheidung.',
    });
  } catch (e) {
    const nachricht = e instanceof Error ? e.message : 'Unbekannter Fehler';
    console.error('/api/report', nachricht);
    res.status(400).json({ error: nachricht });
  }
}

/** Blockieren. Gerichteter Eintrag, beidseitige Wirkung über die Regel
 *  `blocked()`. Ohne Ankündigung an die blockierte Person — eine Anzeige
 *  wäre ein Informationsleck. */
export async function handleBlock(req: Request, res: Response): Promise<void> {
  const meineUid = uid(req);
  try {
    const zielUid = text(req.body?.targetUid, 'targetUid', 128);
    if (zielUid === meineUid) throw new Error('Das eigene Konto lässt sich nicht blockieren.');
    await getFirestore().collection('blocks').doc(`${meineUid}_${zielUid}`).set(
      { blockerUid: meineUid, blockedUid: zielUid, at: FieldValue.serverTimestamp() },
      { merge: true },
    );
    res.json({ ok: true });
  } catch (e) {
    const nachricht = e instanceof Error ? e.message : 'Unbekannter Fehler';
    console.error('/api/block', nachricht);
    res.status(400).json({ error: nachricht });
  }
}

// ── P0-6: Löschung ─────────────────────────────────────────────────────────

const BATCH = 400;

async function loescheAbfrage(query: FirebaseFirestore.Query): Promise<number> {
  const db = getFirestore();
  let gesamt = 0;
  for (;;) {
    const snap = await query.limit(BATCH).get();
    if (snap.empty) return gesamt;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    gesamt += snap.size;
    if (snap.size < BATCH) return gesamt;
  }
}

export async function handleDeleteAccount(req: Request, res: Response): Promise<void> {
  const meineUid = uid(req);
  try {
    const db = getFirestore();
    const bericht = { chats: 0, nachrichten: 0, verbindungen: 0, eigeneMeldungen: 0, pseudonymisiert: 0 };

    // 1. Chats samt Nachrichten. Ein Chat gehört beiden; ein halber Chat ist
    //    für niemanden nützlich.
    const chats = await db.collection('chats').where('participants', 'array-contains', meineUid).get();
    for (const chat of chats.docs) {
      bericht.nachrichten += await loescheAbfrage(chat.ref.collection('messages'));
      await chat.ref.delete();
      bericht.chats += 1;
    }

    // 2. Verbindungen in beide Richtungen.
    for (const feld of ['fromUid', 'toUid', 'userId', 'otherUserId']) {
      bericht.verbindungen += await loescheAbfrage(
        db.collection('connections').where(feld, '==', meineUid),
      );
    }

    // 3. Kontingent-Ledger.
    await loescheAbfrage(db.collection('users').doc(meineUid).collection('quota_ledger'));

    // 3a. GEGENPRÜFUNG 09.08.2026: Die mit DSG-02 hinzugekommenen Ablagen
    //     fehlten in der Kaskade. `doc.delete()` löscht in Firestore KEINE
    //     Unterkollektionen — `users/{uid}/einwilligungen/*` wäre nach der
    //     Kontolöschung verwaist liegengeblieben, mit Zeitstempeln und
    //     Zwecken. `age_attempts` enthält die uid im Klartext.
    //     Eine neue Sammlung, die nicht in dieser Liste steht, überlebt die
    //     Löschung — deshalb gehört jede hier eingetragen.
    await loescheAbfrage(db.collection('users').doc(meineUid).collection('einwilligungen'));
    // 11.08.2026: Zwischenspeicher fuer KI-Auswertungen. Er haelt Aussagen
    // ueber diese Person hoechstens 36 Stunden — ohne diesen Eintrag aber
    // ueber die Kontoloeschung hinaus.
    await loescheAbfrage(db.collection('users').doc(meineUid).collection('ki_zwischenspeicher'));
    await loescheAbfrage(db.collection('age_attempts').where('uid', '==', meineUid));

    // 4. Blockierungen in beide Richtungen.
    await loescheAbfrage(db.collection('blocks').where('blockerUid', '==', meineUid));
    await loescheAbfrage(db.collection('blocks').where('blockedUid', '==', meineUid));

    // 5. Eigene Meldungen: weg.
    bericht.eigeneMeldungen += await loescheAbfrage(
      db.collection('reports').where('reporterId', '==', meineUid),
    );

    // 6. Meldungen ÜBER diese Person bleiben — sie sind die Daten der
    //    meldenden Personen und der Nachweis für Moderationsentscheidungen
    //    (DSA Art. 17). Der Personenbezug wird entfernt.
    const ueber = await db.collection('reports').where('reportedProfileId', '==', meineUid).get();
    if (!ueber.empty) {
      const batch = db.batch();
      ueber.docs.forEach((d) =>
        batch.update(d.ref, {
          reportedProfileId: FieldValue.delete(),
          reportedGeloeschtAm: FieldValue.serverTimestamp(),
        }),
      );
      await batch.commit();
      bericht.pseudonymisiert = ueber.size;
    }

    // 7. Profil.
    await db.collection('users').doc(meineUid).delete();

    // 8. Löschprotokoll — Nachweis nach Art. 5 Abs. 2 DSGVO, ohne Inhalte.
    await db.collection('deletion_log').add({
      uidHash: meineUid.slice(0, 6) + '…',
      at: FieldValue.serverTimestamp(),
      ...bericht,
    });

    // Erst zum Schluss das Auth-Konto. Solange es besteht, kann ein Abbruch
    // wiederholt werden; andersherum wären die Daten verwaist.
    await getAuth().deleteUser(meineUid);

    res.json({ ok: true, geloescht: bericht });
  } catch (e) {
    console.error('/api/account/delete', e);
    res.status(500).json({ error: 'Die Löschung ist nicht vollständig durchgelaufen. Bitte erneut versuchen.' });
  }
}
