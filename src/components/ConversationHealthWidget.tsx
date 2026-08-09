import React, { useEffect } from 'react';
import { HeartPulse, MessageSquareText, Smile } from 'lucide-react';

export const ConversationHealthWidget: React.FC = () => {
  const healthScore = 85;
  const longMessages = 24;
  const emojiOnly = 3;

  useEffect(() => {
    // In a real app, this would fetch from backend analytics
  }, []);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HeartPulse className="text-rose-500 dark:text-rose-400" size={20} />
          <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">Konversations-Gesundheit</h3>
        </div>
        <span className="text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-full">
          Sehr Gut
        </span>
      </div>
      
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
        Tiefgründige Gespräche statt oberflächlicher Chats. So kommunizierst du diese Woche:
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 border border-stone-100 dark:border-stone-700 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-medium">
            <MessageSquareText size={14} /> Bedeutsame Nachrichten
          </div>
          <div className="text-xl font-bold text-stone-900 dark:text-stone-100">{longMessages}</div>
          <div className="text-[10px] text-stone-500">Über 10 Wörter</div>
        </div>
        <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 border border-stone-100 dark:border-stone-700 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-medium">
            <Smile size={14} /> Emoji-Only
          </div>
          <div className="text-xl font-bold text-stone-900 dark:text-stone-100">{emojiOnly}</div>
          <div className="text-[10px] text-stone-500">Nur Emojis/Kurzwörter</div>
        </div>
      </div>
      
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block text-brand dark:text-brand-light">
              Qualitäts-Score
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-brand dark:text-brand-light">
              {healthScore}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-stone-100 dark:bg-stone-800">
          <div style={{ width: `${healthScore}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand dark:bg-brand-light"></div>
        </div>
      </div>
    </div>
  );
};
