import { useState, useEffect } from "react";
import { CheckCircle2, Trophy } from "lucide-react";
import { motion } from "motion/react";

export function SuccessSummaryWidget() {
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalMilestones, setTotalMilestones] = useState(0);

  useEffect(() => {
    const loadSummary = () => {
      try {
        // Load total tasks
        const savedCompleted = JSON.parse(localStorage.getItem('klar_wheel_completed_tasks') || '[]') as number[];
        setTotalTasks(savedCompleted.length);

        // Load total milestones unlocked
        const progressKeys = [
          'stats_conversations_started',
          'stats_dates_planned',
          'stats_matches_collected',
          'stats_profile_optimized',
          'stats_duels_won'
        ];
        
        const goals: Record<string, number> = {
          'stats_conversations_started': 3,
          'stats_dates_planned': 2,
          'stats_matches_collected': 5,
          'stats_profile_optimized': 1,
          'stats_duels_won': 3
        };

        let unlockedCount = 0;
        progressKeys.forEach(key => {
          const val = parseInt(localStorage.getItem(key) || '0', 10);
          if (goals[key] !== undefined && val >= goals[key]) {
            unlockedCount++;
          }
        });
        
        setTotalMilestones(unlockedCount);
      } catch(e) {}
    };

    loadSummary();
    
    // Add event listeners to refresh when updates happen
    window.addEventListener('wheelTaskCompleted', loadSummary);
    
    // We can also poll to ensure milestones are updated if changed elsewhere
    const interval = setInterval(loadSummary, 2000);
    
    return () => {
      window.removeEventListener('wheelTaskCompleted', loadSummary);
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl p-4 mb-6 shadow-sm flex items-center justify-between"
    >
      <div className="flex-1 border-r border-stone-100 dark:border-stone-800 px-2">
        <div className="flex items-center gap-1.5 mb-1 justify-center">
          <CheckCircle2 size={14} className="text-green-500" />
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Aufgaben</span>
        </div>
        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 text-center">
          {totalTasks}
        </div>
      </div>
      
      <div className="flex-1 px-2">
        <div className="flex items-center gap-1.5 mb-1 justify-center">
          <Trophy size={14} className="text-amber-500" />
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Meilensteine</span>
        </div>
        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 text-center">
          {totalMilestones}
        </div>
      </div>
    </motion.div>
  );
}
