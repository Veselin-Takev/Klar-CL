import { useState, useEffect } from "react";
import { Sparkles, Brain } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { melde } from "../lib/fehler";

interface ReadinessData {
  wisdom: string;
  actionableAdvice: string;
}

export function DatingReadinessWidget() {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchReadiness = async () => {
      try {
        setIsLoading(true);
        setError(false);
        
        // Check if we have cached data for today
        const cachedStr = localStorage.getItem("klar_readiness_cache");
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          const today = new Date().toDateString();
          if (cached.date === today && cached.data) {
            setData(cached.data);
            setIsLoading(false);
            return;
          }
        }

        // Get context from local storage (if available)
        const savedGoals = localStorage.getItem("klar_onboarding");
        let goalsStr = "Authentische Verbindungen finden";
        if (savedGoals) {
           try {
              const goalsObj = JSON.parse(savedGoals);
              if (goalsObj.intentions) {
                 goalsStr = goalsObj.intentions.join(', ');
              }
           } catch (e) {}
        }

        // Analyze recent activity from local storage
        let recentActivity = "Noch keine Dates eingetragen.";
        const reflectionsStr = localStorage.getItem("klar_date_reflections");
        if (reflectionsStr) {
           try {
              const reflections = JSON.parse(reflectionsStr);
              if (Array.isArray(reflections) && reflections.length > 0) {
                 const latest = reflections[0];
                 recentActivity = `Zuletzt am ${latest.date} ein Date reflektiert. Stimmung: ${latest.positive || 'Ok'}.`;
              }
           } catch(e) {}
        }

        const res = await fetch("/api/gemini/dating-readiness", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goals: goalsStr, recentActivity })
        });
        
        if (!res.ok) throw new Error("API failed");
        
        const result = await res.text().then(text => text ? JSON.parse(text) : {});
        setData(result);
        
        // Cache it for today
        localStorage.setItem("klar_readiness_cache", JSON.stringify({
          date: new Date().toDateString(),
          data: result
        }));
      } catch (err) {
        melde("DatingReadinessWidget", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadiness();
  }, []);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm h-full flex flex-col relative z-10 overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Brain size={64} />
      </div>
      
      <div className="flex items-start justify-between w-full mb-4">
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" /> 
            Dating Readiness
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Deine tägliche Dating-Weisheit
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center min-h-[140px]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6 text-stone-400"
            >
              <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse mb-3"></div>
              <p className="text-xs font-medium">Analysiere dein Profil...</p>
            </motion.div>
          ) : error || !data ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Die Sterne stehen gerade ungünstig. Versuche es später noch einmal!
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-4 relative">
                <div className="text-sm font-medium text-stone-800 dark:text-stone-200 italic leading-relaxed">
                  "{data.wisdom}"
                </div>
              </div>
              
              <div>
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Action Step</h4>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {data.actionableAdvice}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
