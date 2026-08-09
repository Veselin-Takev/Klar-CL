import { useState, useEffect } from "react";
import { Trophy, Star, Shield, Flame, Heart, Zap, Medal, MessageCircle, Compass } from "lucide-react";
import { motion } from "motion/react";

type Milestone = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  isUnlocked: boolean;
};

export function DatingMilestonesWidget() {
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: "first_date",
      title: "Der Eisbrecher",
      description: "Erstes Date geplant",
      icon: Zap,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      isUnlocked: false
    },
    {
      id: "streak",
      title: "Zen Master",
      description: "3 Tage Ritual-Streak",
      icon: Flame,
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      isUnlocked: false
    },
    {
      id: "five_dates",
      title: "Dating Pro",
      description: "5 Dates absolviert",
      icon: Star,
      color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
      isUnlocked: false
    },
    {
      id: "boundaries",
      title: "Klartext",
      description: "Eigene Grenzen gesetzt",
      icon: Shield,
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      // P2: stand fest auf `true` ("Mock pre-unlocked for motivation").
      // Ein erfundener Erfolg ist keine Motivation, sondern eine
      // Falschangabe — und genau das Muster, gegen das Klar antritt.
      isUnlocked: false
    },
    {
      id: "success",
      title: "Volltreffer",
      description: "Verbindung-Score über 90%",
      icon: Heart,
      color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
      isUnlocked: false // P2: war fest verdrahtet
    },
    {
      id: "konversations_profi",
      title: "Konversations-Profi",
      description: "Verbindung-Compass stark genutzt",
      icon: Compass,
      color: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
      isUnlocked: false // P2: war fest verdrahtet
    },
    {
      id: "icebreaker_experte",
      title: "Icebreaker-Experte",
      description: "Erfolgreiche Icebreaker",
      icon: MessageCircle,
      color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
      isUnlocked: false // P2: war fest verdrahtet
    }
  ]);


  useEffect(() => {
    // Dynamically unlock some based on actual local storage if possible
    const checkAchievements = () => {
      let firstDateUnlocked = false;
      let streakUnlocked = false;

      try {
        const plannedDates = localStorage.getItem('klar_planned_dates');
        if (plannedDates && JSON.parse(plannedDates).length > 0) {
          firstDateUnlocked = true;
        }

        const rituals = localStorage.getItem('klar_ritual_tracker');
        if (rituals) {
          const parsed = JSON.parse(rituals);
          if (parsed.streak >= 3) {
            streakUnlocked = true;
          }
        }
      } catch (e) {}

      setMilestones(prev => prev.map(m => {
        if (m.id === 'first_date' && firstDateUnlocked) return { ...m, isUnlocked: true };
        if (m.id === 'streak' && streakUnlocked) return { ...m, isUnlocked: true };
        return m;
      }));
    };

    checkAchievements();
  }, []);

  const unlockedCount = milestones.filter(m => m.isUnlocked).length;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Trophy className="text-amber-500" size={20} />
          Dating-Meilensteine
        </h3>
        <span className="text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md">
          {unlockedCount} / {milestones.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        <div className="grid grid-cols-2 gap-3">
          {milestones.map((milestone, idx) => {
            const Icon = milestone.icon;
            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-3 rounded-2xl border ${
                  milestone.isUnlocked 
                    ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm' 
                    : 'bg-stone-50 dark:bg-stone-950 border-stone-100 dark:border-stone-900 opacity-60 grayscale'
                } flex flex-col items-center text-center relative overflow-hidden`}
              >
                {!milestone.isUnlocked && (
                  <div className="absolute inset-0 bg-stone-100/30 dark:bg-stone-950/30 -[1px] z-10" />
                )}
                
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${milestone.color}`}>
                  <Icon size={24} className={milestone.isUnlocked ? 'drop-shadow-sm' : ''} />
                </div>
                
                <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-tight mb-1">
                  {milestone.title}
                </h4>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                  {milestone.description}
                </p>
                
                {milestone.isUnlocked && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-stone-900">
                    <Medal size={12} className="text-white" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
