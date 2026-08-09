import { useState, useEffect } from 'react';
import { CheckCheck, AlertCircle, Languages } from 'lucide-react';
import type { ChatMessage } from '../screens/ChatView';
import { translateMessage } from '../services/translationService';

interface MessageBubbleProps {
  msg: ChatMessage;
  targetLang?: string; // If provided, auto-translate
}

export function MessageBubble({ msg, targetLang }: MessageBubbleProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState(msg.isTranslated ? msg.text : null);
  const [translationError, setTranslationError] = useState(msg.translationError || false);

  const isUser = msg.role === 'user';
  
  useEffect(() => {
    if (targetLang && !msg.isTranslated && !translatedText && !isTranslating) {
      // Auto-translate if targetLang is active
      setIsTranslating(true);
      translateMessage(msg.originalText || msg.text, targetLang)
        .then((res) => {
          if (res !== (msg.originalText || msg.text)) {
             setTranslatedText(res);
             setTranslationError(false);
          } else {
             // Fallback
             setTranslationError(true);
          }
        })
        .catch(() => {
           setTranslationError(true);
        })
        .finally(() => {
           setIsTranslating(false);
        });
    }
  }, [targetLang, msg, translatedText, isTranslating]);

  const hasTranslation = !!translatedText || msg.isTranslated;
  const isError = translationError;

  const currentText = msg.originalText || msg.text;
  const displayText = (hasTranslation && !showOriginal) ? (translatedText || msg.text) : currentText;

  return (
    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
      isUser 
         ? 'bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-tr-sm' 
         : 'bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-tl-sm'
    }`}>
      <div className="text-sm flex flex-col gap-1">
        {isTranslating ? (
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
             <span className="w-4 h-4 bg-current opacity-50 rounded-full animate-pulse"></span>
             <span className="text-xs">Übersetze...</span>
          </div>
        ) : (
          displayText
        )}
      </div>
      
      {(hasTranslation || isTranslating) && !isError && (
        <div className="mt-1 flex items-center justify-between opacity-80">
          <button 
             onClick={() => setShowOriginal(!showOriginal)}
             disabled={isTranslating}
            className="text-[10px] flex items-center gap-1 hover:underline disabled:opacity-50"
          >
            <Languages size={10} />
            {showOriginal ? "Übersetzung anzeigen" : "Original anzeigen"}
          </button>
        </div>
      )}

      {isError && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-500/80">
          <AlertCircle size={10} />
          <span>Übersetzung fehlgeschlagen</span>
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
