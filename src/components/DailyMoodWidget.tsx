// ═══════════════════════════════════════════════════════════════════════════
// P2-BEFUND, NICHT BEHOBEN: Dieses Widget erzeugt Daten, die es nicht gibt.
// Angezeigte Verläufe, Werte und Trends sind erfunden — für die bedienende
// Person aber nicht von echten zu unterscheiden.
//
// Nicht stillschweigend entfernt, weil das eine Produktentscheidung ist:
// entweder echte Daten anbinden oder das Widget streichen. Ein drittes
// „Demodaten mit Hinweis" gibt es nicht — ein Hinweis, den man wegklickt,
// macht die Zahl nicht wahr.
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { Smile, TrendingUp, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const MOODS = [
  { value: 5, emoji: "🤩", label: "Super" },
  { value: 4, emoji: "😊", label: "Gut" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 2, emoji: "😔", label: "Naja" },
  { value: 1, emoji: "😫", label: "Schlecht" }
];

interface MoodEntry {
  date: string;
  mood: number;
  emoji: string;
}

export function DailyMoodWidget() {
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [showTrends, setShowTrends] = useState(false);

  useEffect(() => {
    const loadMoods = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("klar_mood_history") || "[]") as MoodEntry[];
        setHistory(saved);
        
        const today = new Date().toLocaleDateString('de-DE');
        const todayEntry = saved.find(entry => entry.date === today);
        if (todayEntry) setTodayMood(todayEntry);
      } catch (e) {
        console.warn("Failed to load mood history", e);
      }
    };
    loadMoods();
  }, []);

  const handleSelectMood = (mood: typeof MOODS[0]) => {
    const today = new Date().toLocaleDateString('de-DE');
    const newEntry = { date: today, mood: mood.value, emoji: mood.emoji };
    
    setTodayMood(newEntry);
    
    setHistory(prev => {
      const filtered = prev.filter(entry => entry.date !== today);
      const updated = [...filtered, newEntry].sort((a, b) => {
        const parseDate = (dString: string) => {
          const [day, month, year] = dString.split('.');
          return new Date(parseInt(year || "0"), parseInt(month || "1") - 1, parseInt(day || "1")).getTime();
        };
        return parseDate(a.date) - parseDate(b.date);
      });
      localStorage.setItem("klar_mood_history", JSON.stringify(updated));
      return updated;
    });
  };

  // Mock some history if empty for demo purposes
  useEffect(() => {
    if (history.length === 0) {
      const today = new Date();
      const mockHistory: MoodEntry[] = [];
      for (let i = 6; i >= 1; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const randomMood = MOODS[Math.floor(Math.random() * 3)]; // Mostly positive/okay
        mockHistory.push({
          date: d.toLocaleDateString('de-DE'),
          mood: randomMood?.value || 3,
          emoji: randomMood?.emoji || "😐"
        });
      }
      setHistory(mockHistory);
    }
  }, [history.length]);

  const recentHistory = history.slice(-7); // Last 7 days

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-2 rounded-lg">
            <Smile size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">Daily Mood</h3>
            <p className="text-xs text-stone-500">Wie geht's dir heute?</p>
          </div>
        </div>
        <button 
          onClick={() => setShowTrends(!showTrends)}
          className={`p-2 rounded-full transition-colors ${showTrends ? 'bg-brand dark:bg-brand-light text-white dark:text-stone-900' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 bg-stone-50 dark:bg-stone-800'}`}
          title="Trends ansehen"
        >
          <TrendingUp size={16} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!showTrends ? (
          <motion.div 
            key="selector"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {todayMood ? (
              <div className="text-center py-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-700/50">
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">Heute dokumentiert:</p>
                <div className="text-4xl mb-2">{todayMood.emoji}</div>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  {MOODS.find(m => m.value === todayMood.mood)?.label}
                </p>
                <button 
                  onClick={() => setTodayMood(null)}
                  className="mt-3 text-xs text-brand hover:text-brand-light font-medium"
                >
                  Stimmung ändern
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center gap-2 mt-4">
                {MOODS.map(mood => (
                  <button
                    key={mood.value}
                    onClick={() => handleSelectMood(mood)}
                    className="flex flex-col items-center gap-1 p-2 flex-1 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors group"
                  >
                    <span className="text-3xl group- transition-transform duration-200">
                      {mood.emoji}
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      {mood.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="trends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="pt-2"
          >
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 flex items-center gap-2">
              <CalendarDays size={14} /> Letzte 7 Tage
            </p>
            <div className="flex items-end justify-between h-24 gap-1.5 pb-2 border-b border-stone-100 dark:border-stone-800">
              {recentHistory.map((entry, idx) => {
                const height = `${(entry.mood / 5) * 100}%`;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 gap-2 relative group h-full">
                    <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-t-sm flex flex-col justify-end transition-all h-full overflow-hidden">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height }}
                        className={`w-full rounded-t-sm opacity-80 ${
                          entry.mood >= 4 ? 'bg-green-400' : entry.mood === 3 ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                      />
                    </div>
                    <span className="text-lg absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      {entry.emoji}
                    </span>
                    <span className="text-[9px] text-stone-400 -rotate-45 origin-top-left mt-1 whitespace-nowrap">
                      {entry.date.slice(0, 5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
