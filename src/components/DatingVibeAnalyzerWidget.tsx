import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrainCircuit, Sparkles, X, Activity } from "lucide-react";
import { askAICoach } from "../lib/api";

export function DatingVibeAnalyzerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeVibe = async () => {
    setIsOpen(true);
    if (analysis) return; // already analyzed
    
    setIsLoading(true);
    try {
      const saved = localStorage.getItem('klar_journal_entries');
      let entriesText = "Keine Einträge vorhanden.";
      if (saved) {
        try {
          const entries = JSON.parse(saved);
          const recentEntries = entries.slice(0, 5).map((e: any) => `Datum: ${new Date(e.createdAt || Date.now()).toLocaleDateString()}, Stimmung: ${e.mood || 'Unbekannt'}, Text: ${e.recap || e.content || ''}`).join('\n');
          if (recentEntries) entriesText = recentEntries;
        } catch(e) {}
      }

      const prompt = `Analysiere kurz mein aktuelles Dating-Verhalten basierend auf diesen letzten Tagebucheinträgen:\n${entriesText}\nGib mir in 3 kurzen, motivierenden Sätzen ein direktes Feedback zu meiner aktuellen Stimmung und ein Muster, das du erkennst. Verzichte auf Einleitungen und starte direkt mit dem Feedback.`;
      
      const res = await askAICoach(prompt);
      setAnalysis(res);
    } catch(e) {
      setAnalysis("Leider konnte die Analyse gerade nicht durchgeführt werden. Versuche es später noch einmal.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-full flex flex-col justify-center">
      <button 
        onClick={analyzeVibe}
        className="w-full  from-indigo-500 to-brand hover:opacity-90 transition-opacity text-white rounded-3xl p-6 shadow-sm flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl ">
            <BrainCircuit size={24} className="text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-base">Dating-Vibe analysieren</h3>
            <p className="text-xs text-white/80 mt-1">KI-Feedback zu deiner aktuellen Stimmung</p>
          </div>
        </div>
        <Sparkles size={20} className="text-white/80" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 "
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed bottom-24 left-4 right-4 md:absolute md:bottom-full md:left-0 md:right-0 md:mb-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md z-50 overflow-hidden max-w-md mx-auto"
            >
              <div className="flex justify-between items-center p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Activity size={18} className="text-brand" /> 
                  Vibe-Analyse
                </h4>
                <button aria-label="Auswertung schließen" onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-600 bg-stone-200/50 dark:bg-stone-800 p-2 rounded-full transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 text-sm text-stone-700 dark:text-stone-300">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Sparkles size={32} className="text-brand animate-pulse mb-3" />
                    <p className="text-sm text-stone-500 font-medium animate-pulse">Analysiere deine Einträge...</p>
                  </div>
                ) : (
                  <div className="leading-relaxed whitespace-pre-wrap font-medium">
                    "{analysis}"
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
