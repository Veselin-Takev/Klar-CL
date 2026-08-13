// ═══════════════════════════════════════════════════════════════════════════
// Eine Nachricht im Gespräch — mit Übersetzung, aber ohne Ersetzung
//
// ── WAS SICH AM 14.08.2026 GEÄNDERT HAT UND WARUM ─────────────────────────
// Vorher wurde die Übersetzung ANSTELLE des Originals angezeigt, mit einem
// kleinen Umschalter „Original anzeigen". Wer nichts umschaltete, las nie,
// was das Gegenüber wirklich geschrieben hat.
//
// Eine maschinelle Übersetzung sind nicht die Worte der Person. In einem
// Kennenlerngespräch kann eine verschobene Nuance den Sinn ändern — bis hin
// zu Aussagen über Einverständnis. Deshalb jetzt:
//
//   · Das ORIGINAL steht oben und bleibt immer sichtbar.
//   · Die Übersetzung steht darunter, abgesetzt, mit dem Hinweis
//     „maschinell übersetzt".
//   · Gescheitert heisst gescheitert: `uebersetze()` liefert `ok`, es wird
//     nicht mehr aus „Text ist gleich geblieben" geraten.
//
// Der letzte Punkt behebt einen echten Fehler: Eine Nachricht, die bereits
// in der Zielsprache stand, kam unverändert zurück — und wurde deshalb als
// „Übersetzung fehlgeschlagen" angezeigt.
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { CheckCheck, AlertCircle, Languages } from 'lucide-react';
import type { ChatMessage } from '../screens/ChatView';
import { uebersetze, type Uebersetzung } from '../services/translationService';

interface MessageBubbleProps {
  msg: ChatMessage;
  /** Lesbarer Name der Zielsprache, z. B. "Englisch". Ist er gesetzt, wird
   *  übersetzt. Ohne ihn passiert nichts — das ist der Ausschalter. */
  zielsprache?: string;
}

export function MessageBubble({ msg, zielsprache }: MessageBubbleProps) {
  const [ergebnis, setErgebnis] = useState<Uebersetzung | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  const isUser = msg.role === 'user';
  const original = msg.originalText || msg.text;

  useEffect(() => {
    if (!zielsprache) {
      setErgebnis(null);
      return;
    }
    let abgemeldet = false;
    setLaeuft(true);
    uebersetze(original, zielsprache)
      .then((r) => {
        if (!abgemeldet) setErgebnis(r);
      })
      .finally(() => {
        if (!abgemeldet) setLaeuft(false);
      });
    return () => {
      abgemeldet = true;
    };
  }, [zielsprache, original]);

  // Eine Übersetzung, die wortgleich mit dem Original ist, wird nicht
  // angezeigt. Sie ist kein Fehler — die Nachricht stand schon in der
  // Zielsprache —, aber zweimal dasselbe untereinander hilft niemandem.
  const zeigeUebersetzung =
    !!ergebnis && ergebnis.ok && ergebnis.text.trim() !== original.trim();

  return (
    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
      isUser
         ? 'bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-tr-sm'
         : 'bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-tl-sm'
    }`}>
      {/* Das Original. Steht immer da, wird nie ersetzt. */}
      <div className="text-sm">{original}</div>

      {laeuft && (
        <div className="mt-1 flex items-center gap-2 text-[10px] opacity-70">
          <span className="w-3 h-3 bg-current opacity-50 rounded-full animate-pulse"></span>
          <span>Übersetze …</span>
        </div>
      )}

      {zeigeUebersetzung && (
        <div className="mt-2 pt-2 border-t border-current/20">
          <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1">
            <Languages size={10} aria-hidden="true" />
            <span>maschinell übersetzt</span>
          </div>
          <div className="text-sm opacity-90">{ergebnis!.text}</div>
        </div>
      )}

      {ergebnis && !ergebnis.ok && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-500/90">
          <AlertCircle size={10} aria-hidden="true" />
          <span>{ergebnis.grund || 'Übersetzung fehlgeschlagen'}</span>
        </div>
      )}

      {isUser && (
        <div className="flex justify-end mt-1">
          <CheckCheck size={14} className={msg.isRead ? "text-blue-500" : "text-brand-light/70 dark:text-brand/50"} />
        </div>
      )}
    </div>
  );
}
