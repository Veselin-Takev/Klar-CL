import { useState, useEffect } from 'react';
import { MessageCircle, CalendarHeart, Sparkles, Heart, Lock, CheckCircle, X, Trophy, Flame, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationService } from '../services/notificationService';

type BadgeId = 'starter' | 'planner' | 'magnet' | 'pro' | 'duelist' | 'konversations_profi' | 'icebreaker_experte';

interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: React.ElementType;
  goal: number;
  progressKey: string;
}

const BADGES: Badge[] = [
  {
    id: 'starter',
    name: 'Conversation Starter',
    description: 'Beginne 3 neue Konversationen.',
    icon: MessageCircle,
    goal: 3,
    progressKey: 'stats_conversations_started'
  },
  {
    id: 'planner',
    name: 'Thoughtful Planner',
    description: 'Nutze den Date Planner 2 mal.',
    icon: CalendarHeart,
    goal: 2,
    progressKey: 'stats_dates_planned'
  },
  {
    id: 'magnet',
    name: 'First 5 Verbindungen',
    description: 'Sammle deine ersten 5 Verbindungen.',
    icon: Heart,
    goal: 5,
    progressKey: 'stats_matches_collected'
  },
  {
    id: 'pro',
    name: 'Profile Pro',
    description: 'Optimiere dein Profil mit dem KI-Coach.',
    icon: Sparkles,
    goal: 1,
    progressKey: 'stats_profile_optimized'
  }
,  {
    id: 'duelist',
    name: 'Dating Duelist',
    description: 'Gewinne 3 Dating-Duelle.',
    icon: Trophy,
    goal: 3,
    progressKey: 'stats_duels_won'
  },  {
    id: 'konversations_profi',
    name: 'Thoughtful Conversationalist',
    description: 'Zeige tiefgründige Gesprächsführung (5 Interaktionen).',
    icon: Compass,
    goal: 5,
    progressKey: 'stats_match_compass_activity'
  },
  {
    id: 'icebreaker_experte',
    name: 'Icebreaker-Experte',
    description: 'Führe 3 erfolgreiche Icebreaker-Konversationen.',
    icon: Flame,
    goal: 3,
    progressKey: 'stats_successful_icebreakers'
  }
];

export function DatingMilestones() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [unlockDates, setUnlockDates] = useState<Record<string, string>>({});

  useEffect(() => {
    
    // Load stats from localStorage
    const loadStats = () => {
      const currentStats: Record<string, number> = {};
      const dates: Record<string, string> = {};
      
      BADGES.forEach(badge => {
        const val = localStorage.getItem(badge.progressKey);
        currentStats[badge.progressKey] = val ? parseInt(val, 10) : 0;
        
        const dateKey = `${badge.progressKey}_date`;
        let dateVal = localStorage.getItem(dateKey);
        if (!dateVal && (currentStats[badge.progressKey] || 0) >= badge.goal) {
           dateVal = new Date().toLocaleDateString('de-DE');
           localStorage.setItem(dateKey, dateVal);
        }
        if (dateVal) {
          dates[badge.progressKey] = dateVal;
        }
      });
      
      // For demo purposes, we will mock some progress if none exists
      if (Object.keys(currentStats).every(k => currentStats[k] === 0)) {
        currentStats['stats_conversations_started'] = 1;
        currentStats['stats_dates_planned'] = 2; // unlocked!
        currentStats['stats_profile_optimized'] = 0;
        
        const today = new Date().toLocaleDateString('de-DE');
        localStorage.setItem('stats_dates_planned_date', today);
        dates['stats_dates_planned'] = today;
      }
      
      setStats(currentStats);
      setUnlockDates(dates);
      
      let newlyUnlocked = false;
      let lastUnlockedId: string | null = null;
      let lastUnlockedName: string | null = null;
      
      BADGES.forEach(badge => {
        const isUnlocked = (currentStats[badge.progressKey] || 0) >= badge.goal;
        const celebratedKey = `${badge.progressKey}_celebrated`;
        const isCelebrated = localStorage.getItem(celebratedKey) === 'true';
        
        if (isUnlocked && !isCelebrated) {
          const dateKey = `${badge.progressKey}_date`;
          if (!localStorage.getItem(dateKey)) {
            const today = new Date().toLocaleDateString('de-DE');
            localStorage.setItem(dateKey, today);
            dates[badge.progressKey] = today;
          }
          
          localStorage.setItem(celebratedKey, 'true');
          newlyUnlocked = true;
          lastUnlockedId = badge.id;
          lastUnlockedName = badge.name;
        }
      });
      
      if (newlyUnlocked && lastUnlockedId) {
        if (lastUnlockedName) {
           NotificationService.notifyMilestoneUnlocked(lastUnlockedName);
        }
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'],
            zIndex: 9999
          });
        });
        setNewlyUnlockedBadge(lastUnlockedId);
        setTimeout(() => setNewlyUnlockedBadge(null), 3500);
      }
      
      setUnlockDates({...dates});
      
    };

    loadStats();
    
    const interval = setInterval(loadStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg shadow-sm">
            <Trophy size={16} />
          </div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Interaktive Meilensteine</h3>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">Sammle Badges durch aktive Nutzung. Klicke für Details.</p>
        <div className="grid grid-cols-2 gap-3">
          {BADGES.map(badge => {
            const currentProgress = stats[badge.progressKey] || 0;
            const isUnlocked = currentProgress >= badge.goal;
            const Icon = badge.icon;
            const progressPercent = Math.min(100, Math.round((currentProgress / badge.goal) * 100));

            return (
              <motion.div 
                key={badge.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={newlyUnlockedBadge === badge.id ? { 
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, -5, 0],
                } : {}}
                transition={{ duration: 0.5 }}
                onClick={() => setSelectedBadge(badge)}
                className={`p-3 rounded-xl border relative overflow-hidden transition-all duration-300 cursor-pointer ${
                  isUnlocked 
                    ? 'bg-brand/5 border-brand/20 dark:bg-brand-light/10 dark:border-brand-light/20 shadow-sm' 
                    : 'bg-stone-50 border-stone-100 dark:bg-stone-800/50 dark:border-stone-800 opacity-70 grayscale-[50%]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-lg ${
                    isUnlocked 
                      ? 'bg-brand text-white dark:bg-brand-light dark:text-stone-900 shadow-sm' 
                      : 'bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400'
                  }`}>
                    <Icon size={20} />
                  </div>
                  {isUnlocked ? (
                    <CheckCircle size={16} className="text-brand dark:text-brand-light" />
                  ) : (
                    <Lock size={16} className="text-stone-400" />
                  )}
                </div>
                
                <h4 className={`text-sm font-semibold mb-1 ${isUnlocked ? 'text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'}`}>
                  {badge.name}
                </h4>
                <p className="text-xs text-stone-500 line-clamp-2 mb-2 hidden">
                  {badge.description}
                </p>

                {!isUnlocked && (
                  <div className="mt-auto pt-2 border-t border-stone-100 dark:border-stone-800/50">
                    <div className="flex justify-between text-[10px] text-stone-500 mb-1 font-medium">
                      <span>{currentProgress} / {badge.goal}</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-brand/50 dark:bg-brand-light/50 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
                {isUnlocked && unlockDates[badge.progressKey] && (
                  <div className="mt-auto pt-2 border-t border-brand/10 dark:border-brand-light/10">
                     <p className="text-[10px] text-brand/70 dark:text-brand-light/70 font-medium">
                       Erreicht: {unlockDates[badge.progressKey]}
                     </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 "
              onClick={() => setSelectedBadge(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-md relative z-10 p-6 text-center"
            >
              <button 
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-2 bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6 flex justify-center pt-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  (stats[selectedBadge.progressKey] || 0) >= selectedBadge.goal
                    ? 'bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light shadow-inner border border-brand/20'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-400 border border-stone-200 dark:border-stone-700'
                }`}>
                  <selectedBadge.icon size={48} />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-stone-900 dark:text-stone-100 mb-2">
                {selectedBadge.name}
              </h2>
              <p className="text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
                {selectedBadge.description}
              </p>

              {(stats[selectedBadge.progressKey] || 0) >= selectedBadge.goal ? (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl border border-green-100 dark:border-green-900/30 flex items-center justify-center gap-2 font-medium">
                  <CheckCircle size={18} />
                  Freigeschaltet am {unlockDates[selectedBadge.progressKey] || new Date().toLocaleDateString('de-DE')}
                </div>
              ) : (
                <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-100 dark:border-stone-800">
                  <div className="flex justify-between text-sm text-stone-500 mb-2 font-medium">
                    <span>Fortschritt</span>
                    <span>{stats[selectedBadge.progressKey] || 0} / {selectedBadge.goal}</span>
                  </div>
                  <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand dark:bg-brand-light h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(((stats[selectedBadge.progressKey] || 0) / selectedBadge.goal) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
