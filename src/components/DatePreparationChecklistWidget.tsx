import { useState, useEffect } from "react";
import { CheckCircle2, ListTodo, Circle, Sparkles, Share2 } from "lucide-react";
import { motion } from "motion/react";
 
import { fetchDateChecklist } from "../lib/api";

interface CheckItem {
  id: string;
  category: "Outfit & Grooming" | "Mindset" | "Gespräch";
  text: string;
  checked: boolean;
}

interface DatePreparationChecklistWidgetProps {
  userInterests: string[];
}

export function DatePreparationChecklistWidget({ userInterests }: DatePreparationChecklistWidgetProps) {
  const [items, setItems] = useState<CheckItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateChecklist = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedItems = await fetchDateChecklist(userInterests.length > 0 ? userInterests : ["Allgemein"]);
      setItems(generatedItems.map((item, index) => ({
        ...item,
        id: `item-${index}`,
        checked: false
      })));
    } catch (e) {
      console.warn("Failed to generate checklist", e);
      setError("Konnte keine Checkliste generieren.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (items.length === 0 && !isLoading && !error) {
      generateChecklist();
    }
  }, [userInterests]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleShare = async () => {
    if (!items || items.length === 0) return;
    const text = items.map(i => `- [${i.checked ? 'x' : ' '}] ${i.category}: ${i.text}`).join('\n');
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Meine Erstes Date Checkliste',
          text: `Hier ist meine Vorbereitung fürs nächste Date:\n\n${text}` });
      } else {
        await navigator.clipboard.writeText(`Hier ist meine Vorbereitung fürs nächste Date:\n\n${text}`);
        alert('Checkliste kopiert!');
      }
    } catch(e) {}
  };

  const progress = items.length > 0 ? Math.round((items.filter(i => i.checked).length / items.length) * 100) : 0;
  

  useEffect(() => {
    if (items.length > 0 && progress === 100) {
      
    }
  }, [progress, items.length]);

  const categories = ["Outfit & Grooming", "Mindset", "Gespräch"] as const;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm h-full flex flex-col relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ListTodo size={18} className="text-emerald-500 dark:text-emerald-400" /> 
            Date-Checkliste
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Verhaltensregeln vom KI-Coach gegen Nervosität
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button 
              onClick={handleShare}
              className="text-stone-400 hover:text-brand transition-colors p-1.5 bg-stone-100 dark:bg-stone-800 rounded-full"
              title="Checkliste teilen"
            >
              <Share2 size={14} />
            </button>
          )}
          <button 
            onClick={generateChecklist} 
            disabled={isLoading}
            className="text-stone-400 hover:text-emerald-500 transition-colors p-1.5 bg-stone-100 dark:bg-stone-800 rounded-full disabled:opacity-50"
            title="Neue Checkliste generieren"
          >
            <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span>
          </button>
          <div className="text-xs font-semibold px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md shrink-0">
            {progress}%
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-stone-500">
            <Sparkles className="animate-pulse mb-3 text-emerald-500" size={24} />
            <p className="text-sm font-medium animate-pulse">Generiere individuelle Tipps...</p>
          </div>
        ) : error && items.length === 0 ? (
          <div className="text-center py-6 text-sm text-stone-500 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map(category => {
              const categoryItems = items.filter(i => i.category === category);
              if (categoryItems.length === 0) return null;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={category} 
                  className="space-y-2"
                >
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{category}</h4>
                  <div className="space-y-1.5">
                    {categoryItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-start gap-2 text-left group"
                      >
                        <div className="mt-0.5 shrink-0">
                          {item.checked ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <Circle size={16} className="text-stone-300 dark:text-stone-600 group-hover:text-emerald-400 transition-colors" />
                          )}
                        </div>
                        <span className={`text-sm transition-all duration-200 ${item.checked ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-700 dark:text-stone-300'}`}>
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
