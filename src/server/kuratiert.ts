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
