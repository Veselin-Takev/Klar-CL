import { useState, useEffect } from "react";
import { MessageCircleHeart, Sparkles, Copy, Check, Bookmark } from 'lucide-react';
import { motion } from "motion/react";

interface DailyIcebreakerWidgetProps {
  userInterests: string[];
  matchesInterests: string[];
}

export function DailyIcebreakerWidget({ userInterests, matchesInterests }: DailyIcebreakerWidgetProps) {
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedIcebreakers, setSavedIcebreakers] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('klar_saved_icebreakers');
    if (stored) {
      try { setSavedIcebreakers(JSON.parse(stored)); } catch(e) {}
    }
  }, []);

  const saveIcebreaker = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    let updated;
    if (savedIcebreakers.includes(text)) {
      updated = savedIcebreakers.filter(t => t !== text);
    } else {
      updated = [text, ...savedIcebreakers];
    }
    setSavedIcebreakers(updated);
    localStorage.setItem('klar_saved_icebreakers', JSON.stringify(updated));
  };


  useEffect(() => {
    const fetchIcebreakers = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/daily-icebreakers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userInterests, matchesInterests })
        });
        
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.text().then(text => text ? JSON.parse(text) : {});
        setIcebreakers(data.icebreakers || []);
      } catch (e) {
        console.warn("Failed to load daily icebreakers", e);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Refresh every 24 hours or if not present
    const cached = localStorage.getItem("klar_daily_icebreakers");
    const cacheTime = localStorage.getItem("klar_daily_icebreakers_time");
    
    const isCacheValid = cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 24 * 60 * 60 * 1000;
    
    if (isCacheValid) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setIcebreakers(parsed);
        } else {
          fetchIcebreakers();
        }
      } catch {
        fetchIcebreakers();
      }
    } else {
      fetchIcebreakers();
    }
  }, [userInterests, matchesInterests]);

  useEffect(() => {
    if (icebreakers.length > 0) {
      localStorage.setItem("klar_daily_icebreakers", JSON.stringify(icebreakers));
      localStorage.setItem("klar_daily_icebreakers_time", Date.now().toString());
    }
  }, [icebreakers]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (error && icebreakers.length === 0) return null;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <MessageCircleHeart size={20} />
        </div>
        <div>
          <h3 className="font-serif font-medium text-lg text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            Tägliche Icebreaker
            <Sparkles size={14} className="text-indigo-500" />
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Fragen für den perfekten Einstieg</p>
        </div>
      </div>

      {isLoading && icebreakers.length === 0 ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-12 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
          <div className="h-12 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
          <div className="h-12 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          {icebreakers.map((question, i) => (
            <div 
              key={i} 
              className="group flex items-start gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-800/50 transition-colors cursor-pointer"
              onClick={() => copyToClipboard(question, i)}
            >
              <p className="text-sm text-stone-700 dark:text-stone-300 flex-1 leading-snug font-medium">
                "{question}"
              </p>
              
              <div className="flex gap-1 shrink-0">
                <button 
                  onClick={(e) => saveIcebreaker(e, question)}
                  className={`p-1.5 rounded-lg transition-colors ${savedIcebreakers.includes(question) ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-white dark:bg-stone-700 text-stone-400 hover:text-amber-500 border border-stone-200 dark:border-stone-600'}`}
                  title="Speichern für später"
                >
                  <Bookmark size={14} className={savedIcebreakers.includes(question) ? 'fill-current' : ''} />
                </button>
                <button 
                  className={`p-1.5 rounded-lg transition-colors ${copiedIndex === i ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-white dark:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-600'}`}
                  title="Kopieren"
                >
                  {copiedIndex === i ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
