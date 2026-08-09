import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// Firestore-Regeln gegen den Emulator
//
// WOZU: Regeln, die nie ausgeführt wurden, sind Vermutungen. Dieser Punkt
// steht seit dem ersten Prüfbericht offen. Die Regeln behaupten seither
// Dinge — dass sich niemand selbst verifizieren kann, dass Meldungen für
// niemanden lesbar sind, dass der Kontingentzähler dem Server gehört. Erst
// dieser Lauf sagt, ob das stimmt.
//
// AUSFÜHREN:
//   npm run test:rules
//   (startet den Firestore-Emulator, braucht Java 17 — im Devcontainer da)
//
// Jeder Test prüft GENAU EINE Regel. Ein Test, der drei Dinge auf einmal
// prüft, sagt bei Rot nicht, welches davon kaputt ist.
// ═══════════════════════════════════════════════════════════════════════════

let env: RulesTestEnvironment;

const ANNA = 'anna';
const BEA = 'bea';
const CARL = 'carl';

before(async () => {
  // Das Präfix `demo-` ist Pflicht, kein Geschmack: Nur bei einer so
  // benannten Projekt-ID verlangt die Firebase-CLI keine Anmeldung und
  // spricht garantiert nie mit echten Daten. Dieselbe ID steht in
  // `test:rules` hinter `--project`; weichen beide voneinander ab, lehnt
  // der Emulator wegen `singleProjectMode` jede Anfrage ab.
  env = await initializeTestEnvironment({
    projectId: 'demo-klar',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

after(async () => {
  await env?.cleanup();
});

/** Ausgangslage vor jedem Test: Anna verifiziert, Bea verifiziert,
 *  Carl NICHT verifiziert. Geschrieben mit umgangenen Regeln — sonst
 *  liesse sich `isVerified` gar nicht setzen, was ja der Punkt ist. */
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/anna'), {
      uid: ANNA, createdAt: '2026-08-01', updatedAt: '2026-08-01', isVerified: true, name: 'Anna',
    });
    await setDoc(doc(db, 'users/bea'), {
      uid: BEA, createdAt: '2026-08-01', updatedAt: '2026-08-01', isVerified: true, name: 'Bea',
    });
    await setDoc(doc(db, 'users/carl'), {
      uid: CARL, createdAt: '2026-08-01', updatedAt: '2026-08-01', isVerified: false, name: 'Carl',
    });
  });
});

const als = (uid: string) => env.authenticatedContext(uid).firestore();
const anonym = () => env.unauthenticatedContext().firestore();

// ── Profile ────────────────────────────────────────────────────────────────

describe('Profile', () => {
  it('angemeldet: fremdes Profil lesbar — sonst gäbe es keine Vorschläge', async () => {
    await assertSucceeds(getDoc(doc(als(ANNA), 'users/bea')));
  });

  it('nicht angemeldet: nichts lesbar', async () => {
    await assertFails(getDoc(doc(anonym(), 'users/bea')));
  });

  it('eigenes Profil bearbeiten geht', async () => {
    await assertSucceeds(updateDoc(doc(als(ANNA), 'users/anna'), { name: 'Anna B.', updatedAt: '2026-08-09' }));
  });

  it('fremdes Profil bearbeiten geht nicht', async () => {
    await assertFails(updateDoc(doc(als(ANNA), 'users/bea'), { name: 'Hacked', updatedAt: '2026-08-09' }));
  });

  // DER BEFUND AUS DEM AUDIT: Vorher hiess die Regel-Funktion isVerified(),
  // prüfte aber nur die Anmeldung — und das Feld war frei schreibbar.
  it('SELBSTVERIFIZIERUNG ist gesperrt', async () => {
    await assertFails(updateDoc(doc(als(CARL), 'users/carl'), { isVerified: true, updatedAt: '2026-08-09' }));
  });

  it('sich selbst Klar Plus geben ist gesperrt', async () => {
    await assertFails(updateDoc(doc(als(CARL), 'users/carl'), { plan: 'plus', updatedAt: '2026-08-09' }));
  });

  it('sich selbst eine Rolle geben ist gesperrt', async () => {
    await assertFails(updateDoc(doc(als(CARL), 'users/carl'), { roles: ['moderator'], updatedAt: '2026-08-09' }));
  });

  it('den Kontingentzähler selbst setzen ist gesperrt', async () => {
    await assertFails(updateDoc(doc(als(ANNA), 'users/anna'), { contactCount: 0, updatedAt: '2026-08-09' }));
  });

  it('Profil anlegen mit isVerified im Dokument ist gesperrt', async () => {
    await assertFails(setDoc(doc(als('neu'), 'users/neu'), {
      uid: 'neu', createdAt: 'x', updatedAt: 'x', isVerified: true,
    }));
  });

  it('Profil löschen geht nur über den Server', async () => {
    await assertFails(deleteDoc(doc(als(ANNA), 'users/anna')));
  });
});

// ── Blockierungen ──────────────────────────────────────────────────────────

describe('Blockierungen', () => {
  it('blockieren geht mit der Doc-ID <von>_<an>', async () => {
    await assertSucceeds(setDoc(doc(als(ANNA), 'blocks/anna_bea'), { blockerUid: ANNA, blockedUid: BEA }));
  });

  it('im fremden Namen blockieren ist gesperrt', async () => {
    await assertFails(setDoc(doc(als(ANNA), 'blocks/bea_carl'), { blockerUid: BEA, blockedUid: CARL }));
  });

  it('Doc-ID, die nicht zum Feld passt, wird abgelehnt', async () => {
    await assertFails(setDoc(doc(als(ANNA), 'blocks/anna_carl'), { blockerUid: ANNA, blockedUid: BEA }));
  });

  it('eigene Blockierung lesbar, fremde nicht', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'blocks/bea_carl'), { blockerUid: BEA, blockedUid: CARL });
    });
    await assertSucceeds(getDoc(doc(als(BEA), 'blocks/bea_carl')));
    // Auch die blockierte Person darf den Eintrag nicht sehen — eine
    // Blockierung, die sich nachweisen lässt, ist keine.
    await assertFails(getDoc(doc(als(CARL), 'blocks/bea_carl')));
  });

  // Der Eintrag ist gerichtet, die WIRKUNG beidseitig: blocked() prüft
  // beide Richtungen. Carl blockiert Anna — Anna sieht Carl nicht mehr.
  it('Blockierte verschwinden beidseitig aus den Vorschlägen', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'blocks/carl_anna'), { blockerUid: CARL, blockedUid: ANNA });
    });
    await assertFails(getDoc(doc(als(ANNA), 'users/carl')));
    await assertFails(getDoc(doc(als(CARL), 'users/anna')));
  });
});

// ── Gespräche ──────────────────────────────────────────────────────────────

describe('Gespräche', () => {
  it('verifizierte Person kann ein Gespräch beginnen', async () => {
    await assertSucceeds(setDoc(doc(als(ANNA), 'chats/anna_bea'), {
      participants: [ANNA, BEA], createdAt: '2026-08-09',
    }));
  });

  // Kernmechanik: ohne Verifizierung kein Kontakt.
  it('NICHT verifizierte Person kann kein Gespräch beginnen', async () => {
    await assertFails(setDoc(doc(als(CARL), 'chats/carl_bea'), {
      participants: [CARL, BEA], createdAt: '2026-08-09',
    }));
  });

  it('Gespräch ohne eigene Beteiligung anlegen ist gesperrt', async () => {
    await assertFails(setDoc(doc(als(ANNA), 'chats/bea_carl'), {
      participants: [BEA, CARL], createdAt: '2026-08-09',
    }));
  });

  it('fremdes Gespräch lesen ist gesperrt', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'chats/bea_carl'), { participants: [BEA, CARL], createdAt: 'x' });
    });
    await assertFails(getDoc(doc(als(ANNA), 'chats/bea_carl')));
  });

  it('Teilnehmerliste nachträglich ändern ist gesperrt', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'chats/anna_bea'), { participants: [ANNA, BEA], createdAt: 'x' });
    });
    await assertFails(updateDoc(doc(als(ANNA), 'chats/anna_bea'), {
      participants: [ANNA, CARL], lastMessage: 'x', lastMessageAt: 'y',
    }));
  });

  it('Gespräch einseitig löschen ist gesperrt', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'chats/anna_bea'), { participants: [ANNA, BEA], createdAt: 'x' });
    });
    await assertFails(deleteDoc(doc(als(ANNA), 'chats/anna_bea')));
  });
});

// ── Nachrichten ────────────────────────────────────────────────────────────

describe('Nachrichten', () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'chats/anna_bea'), { participants: [ANNA, BEA], createdAt: 'x' });
    });
  });

  it('Teilnehmerin kann schreiben', async () => {
    await assertSucceeds(addDoc(collection(als(ANNA), 'chats/anna_bea/messages'), {
      chatId: 'anna_bea', senderId: ANNA, text: 'Hallo', createdAt: '2026-08-09',
    }));
  });

  it('im fremden Namen schreiben ist gesperrt', async () => {
    await assertFails(addDoc(collection(als(ANNA), 'chats/anna_bea/messages'), {
      chatId: 'anna_bea', senderId: BEA, text: 'Gefälscht', createdAt: '2026-08-09',
    }));
  });

  it('Aussenstehende können nicht schreiben', async () => {
    await assertFails(addDoc(collection(als(CARL), 'chats/anna_bea/messages'), {
      chatId: 'anna_bea', senderId: CARL, text: 'Hallo', createdAt: '2026-08-09',
    }));
  });

  it('Aussenstehende können nicht mitlesen', async () => {
    await assertFails(getDoc(doc(als(CARL), 'chats/anna_bea/messages/x')));
  });

  // Nachträglich änderbare Nachrichten machen jede Meldung nach DSA Art. 16
  // wertlos — der gemeldete Inhalt wäre dann nicht mehr da.
  it('Nachrichten sind unveränderlich', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'chats/anna_bea/messages/m1'), {
        chatId: 'anna_bea', senderId: ANNA, text: 'Original', createdAt: 'x',
      });
    });
    await assertFails(updateDoc(doc(als(ANNA), 'chats/anna_bea/messages/m1'), { text: 'Geändert' }));
    await assertFails(deleteDoc(doc(als(ANNA), 'chats/anna_bea/messages/m1')));
  });

  it('Text über 1000 Zeichen wird abgelehnt', async () => {
    await assertFails(addDoc(collection(als(ANNA), 'chats/anna_bea/messages'), {
      chatId: 'anna_bea', senderId: ANNA, text: 'x'.repeat(1001), createdAt: '2026-08-09',
    }));
  });
});

// ── Serverseitige Sammlungen ───────────────────────────────────────────────

describe('Was nur dem Server gehört', () => {
  it('Meldungen: weder lesen noch schreiben', async () => {
    await assertFails(addDoc(collection(als(ANNA), 'reports'), { reporterId: ANNA }));
    await assertFails(getDoc(doc(als(ANNA), 'reports/irgendeine')));
  });

  it('Kontakte: nicht schreibbar — sonst zählt niemand mit', async () => {
    await assertFails(setDoc(doc(als(ANNA), 'contacts/anna_bea'), { fromUid: ANNA, toUid: BEA }));
  });

  it('eigene Kontakte sind lesbar', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'contacts/anna_bea'), { fromUid: ANNA, toUid: BEA });
    });
    await assertSucceeds(getDoc(doc(als(ANNA), 'contacts/anna_bea')));
    await assertSucceeds(getDoc(doc(als(BEA), 'contacts/anna_bea')));
    await assertFails(getDoc(doc(als(CARL), 'contacts/anna_bea')));
  });

  it('Verifizierungsanträge sind für Clients unsichtbar', async () => {
    await assertFails(getDoc(doc(als(ANNA), 'verification_requests/x')));
    await assertFails(setDoc(doc(als(ANNA), 'verification_requests/x'), { uid: ANNA }));
  });

  it('Abo: eigenes lesbar, nicht schreibbar', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'subscriptions/anna'), { plan: 'plus' });
    });
    await assertSucceeds(getDoc(doc(als(ANNA), 'subscriptions/anna')));
    await assertFails(getDoc(doc(als(BEA), 'subscriptions/anna')));
    await assertFails(setDoc(doc(als(ANNA), 'subscriptions/anna'), { plan: 'plus' }));
  });

  it('Kontingent-Ledger: eigenes lesbar, nicht schreibbar', async () => {
    await assertFails(setDoc(doc(als(ANNA), 'users/anna/quota_ledger/e1'), { plus: 3 }));
  });

  it('Warteschlangen und Protokolle sind vollständig gesperrt', async () => {
    for (const pfad of ['mail_queue', 'refund_queue', 'deletion_log', 'subscription_events', 'ad_transactions']) {
      await assertFails(addDoc(collection(als(ANNA), pfad), { x: 1 }));
      await assertFails(getDoc(doc(als(ANNA), `${pfad}/x`)));
    }
  });
});

// ── Vorgabe ────────────────────────────────────────────────────────────────

describe('Vorgabe ist Verweigerung', () => {
  it('eine Sammlung, die in den Regeln nicht steht, ist gesperrt', async () => {
    await assertFails(setDoc(doc(als(ANNA), 'irgendwas/x'), { a: 1 }));
    await assertFails(getDoc(doc(als(ANNA), 'irgendwas/x')));
  });
});
