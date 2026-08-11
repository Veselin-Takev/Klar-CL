// ═══════════════════════════════════════════════════════════════════════════
// Klar — von Menschen geschriebene Ersatzinhalte
//
// Diese Datei importiert NICHTS. Sie enthält ausschliesslich Text, der von
// einer Person geschrieben wurde, und ist damit prüfbar wie Daten.
//
// ── WOFÜR ─────────────────────────────────────────────────────────────────
// `kiPolitik.ts` weist 18 Endpunkten die Strategie `kuratiert` zu. Fällt die
// KI dort aus, wird KEIN Ergebnis erfunden — es wird einer dieser Texte
// ausgeliefert, und `entscheideAntwort` setzt automatisch
// `herkunft: 'kuratiert'` und den Hinweis „Allgemeine Vorschläge — nicht auf
// dich zugeschnitten." dazu.
//
// ── DIE PRÜFUNG, DIE JEDER TEXT HIER BESTEHEN MUSS ────────────────────────
// Er darf NICHTS über die lesende Person oder ihr Gegenüber behaupten.
// Kein „Dein Profil wirkt sympathisch", kein „Alles bestens", keine Zahl,
// kein Urteil. Er darf allgemein gültig sein — mehr nicht.
//
// Gegenbeispiele aus dem Bestand, die genau daran scheitern und deshalb
// NICHT hierher übernommen wurden:
//   · „Vertraue dem Prozess und sei du selbst. Jeder Schritt ist ein
//     Fortschritt."  → wurde als persönlicher Tagesimpuls ausgeliefert,
//     nachdem eine Auswertung der eigenen Aktivitäten versprochen war.
//   · „Tolle Basis! Bereit für KI-Feedback?"  → ein Urteil über das Profil.
//   · „harmonisch, 70, Alles bestens."  → eine erfundene Auswertung von
//     Gesprächen, die eine belastende Dynamik überdecken kann.
//
// Die ersten beiden sind ersetzt, der dritte ersatzlos gestrichen:
// `/api/mood-monitor` steht auf `leer`.
// ═══════════════════════════════════════════════════════════════════════════

/** Tagesimpuls, wenn die persönliche Auswertung nicht erreichbar ist. */
export const COACH_IMPULS = {
  insight:
    'Eine konkrete Frage bringt ein Gespräch weiter als ein Kompliment. ' +
    'Frag nach etwas, das im Profil steht und dich wirklich interessiert.',
} as const;

/** Allgemeine Orientierung statt einer persönlichen Einschätzung. */
export const DATING_BEREITSCHAFT = {
  wisdom:
    'Wer ehrlich schreibt, was er sucht, spart sich und anderen Wochen. ' +
    'Klarheit ist keine Härte.',
  actionableAdvice:
    'Nimm dir heute ein Gespräch vor, das eingeschlafen ist, und schreib ' +
    'einen Satz dazu, warum es dir noch im Kopf ist — oder lass es bewusst ruhen.',
} as const;

/**
 * Für Endpunkte, die Gesprächsanfänge vorschlagen. Bewusst ohne Bezug auf
 * ein konkretes Profil: Diese Sätze passen zu jedem und behaupten deshalb
 * nichts über die angeschriebene Person.
 */
export const ICEBREAKER = {
  vorschlaege: [
    'Was hast du zuletzt gemacht, wovon du vorher dachtest, es wäre nichts für dich?',
    'Gibt es einen Ort in dieser Stadt, an dem du dich zuverlässig wohlfühlst?',
    'Woran merkst du, dass du einen guten Tag hattest?',
  ],
} as const;

// ── Fuer die fuenf Endpunkte mit Strategie `kuratiert`, die am 11.08.2026
//    umgestellt wurden ────────────────────────────────────────────────────
//
// Jeder dieser Texte ist allgemein. Keiner sagt etwas ueber die lesende
// Person oder ihr Gegenueber aus. Die alten Ersatzwerte taten das teils
// doch — „Entspann dich!" als Ergebnis einer Checkliste zum bevorstehenden
// Date ist ein Ratschlag an eine bestimmte Person in einer bestimmten Lage.

/** Checkliste vor einem Date. Gilt fuer jedes Date, nicht fuer ein bestimmtes. */
export const DATE_CHECKLISTE = {
  items: [
    { category: 'Vorher', text: 'Ort und Uhrzeit noch einmal bestaetigen.' },
    { category: 'Vorher', text: 'Jemandem sagen, wo du bist und mit wem.' },
    { category: 'Unterwegs', text: 'Eigene Anreise und eigene Rueckfahrt planen.' },
    { category: 'Waehrend', text: 'Getraenk im Blick behalten.' },
    { category: 'Danach', text: 'Kurz aufschreiben, wie es war — bevor der Eindruck verblasst.' },
  ],
} as const;

/** Date-Vorschlaege ohne Ortsbezug: Sie passen ueberall im deutschsprachigen Raum. */
export const DATE_IDEEN = {
  ideas: [
    {
      title: 'Spaziergang mit Ziel',
      description: 'Ein Weg mit einem Punkt am Ende — Aussicht, Cafe, Buchladen. Reden faellt beim Gehen leichter als am Tisch.',
      category: 'Ruhig',
      whyItWorks: 'Kein Blickkontaktzwang, jederzeit beendbar.',
    },
    {
      title: 'Markt am Vormittag',
      description: 'Wochenmarkt, zwei Stunden, offenes Ende.',
      category: 'Alltagsnah',
      whyItWorks: 'Viel zu sehen, wenig Stille auszuhalten.',
    },
    {
      title: 'Etwas ausprobieren, das beide nicht koennen',
      description: 'Toepfern, Bouldern, ein Kochkurs. Gemeinsames Nichtkoennen verbindet schneller als gemeinsames Koennen.',
      category: 'Aktiv',
      whyItWorks: 'Der Fokus liegt auf der Sache, nicht auf der Bewertung.',
    },
  ],
} as const;

/** Gespraechsanfaenge ohne Bezug auf ein konkretes Profil. */
export const ICEBREAKER_VORSCHLAEGE = {
  suggestions: [
    'Was hast du zuletzt gemacht, wovon du vorher dachtest, es waere nichts fuer dich?',
    'Gibt es einen Ort in dieser Stadt, an dem du dich zuverlaessig wohlfuehlst?',
    'Woran merkst du, dass du einen guten Tag hattest?',
  ],
} as const;

/** Allgemeine Date-Konzepte. Bewusst ohne Zuschnitt auf ein Gespraech. */
export const VERBINDUNG_KONZEPTE = {
  concepts: [
    { title: 'Kurz und offen', description: 'Eine Stunde, ohne Plan fuer danach. Wer laenger will, verlaengert.', tag: 'Ruhig' },
    { title: 'Gemeinsam etwas erledigen', description: 'Einkauf, Flohmarkt, Pflanze aussuchen. Nebeneinander statt gegenueber.', tag: 'Alltagsnah' },
    { title: 'Etwas ansehen, ueber das man danach reden kann', description: 'Ausstellung, Konzert, Kino. Der Gespraechsstoff ist eingebaut.', tag: 'Kulturell' },
  ],
} as const;
