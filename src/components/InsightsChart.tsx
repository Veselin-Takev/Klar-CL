import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Target, CheckCircle2, Circle, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationService } from '../services/notificationService';

const data = [
  { name: 'Mo', initiated: 2, replies: 1 },
  { name: 'Di', initiated: 3, replies: 2 },
  { name: 'Mi', initiated: 5, replies: 4 },
  { name: 'Do', initiated: 4, replies: 3 },
  { name: 'Fr', initiated: 6, replies: 5 },
  { name: 'Sa', initiated: 8, replies: 7 },
  { name: 'So', initiated: 7, replies: 6 },
];

const goalLabels: Record<string, string> = {
  relationship: 'Feste Beziehung finden',
  casual: 'Lockere Dates',
  friends: 'Neue Leute kennenlernen',
  undecided: 'Offen bleiben & Entdecken'
};

const goalMilestones: Record<string, string[]> = {
  relationship: ['Profil optimiert', '3 tiefe Gespräche geführt', 'Erstes Date planen'],
  casual: ['Profil erstellt', '5 lockere Chats', 'Spontanes Treffen vereinbaren'],
  friends: ['Interessen geteilt', '3 Gleichgesinnte gefunden', 'Auf einen Kaffee verabreden'],
  undecided: ['Profil ausgefüllt', 'Verschiedene Verbindungen entdeckt', 'Erstes lockeres Treffen']
};

export function InsightsChart() {
  const [userGoal, setUserGoal] = useState<string>('undecided');
  const [completedMilestones, setCompletedMilestones] = useState<number>(0);

  useEffect(() => {
    const savedGoal = localStorage.getItem('userGoal');
    if (savedGoal) {
      setUserGoal(savedGoal);
    }
    const savedMilestones = localStorage.getItem('klar_completed_milestones');
    if (savedMilestones) {
      setCompletedMilestones(parseInt(savedMilestones, 10));
    }
  }, []);

  const milestones = goalMilestones[userGoal] || goalMilestones['undecided'] || [];
  const goalTitle = goalLabels[userGoal] || goalLabels['undecided'] || 'Dein Ziel';

  const completeNextMilestone = () => {
    if (completedMilestones < milestones.length - 1) {
      const newCount = completedMilestones + 1;
      setCompletedMilestones(newCount);
      localStorage.setItem('klar_completed_milestones', newCount.toString());
      localStorage.setItem('klar_last_milestone_engagement', Date.now().toString());
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981']
      });
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-brand dark:text-brand-light" />
          <h3 className="font-medium text-stone-900 dark:text-stone-100">Dating Insights</h3>
        </div>
        <button 
          onClick={() => NotificationService.simulateInactivity()}
          className="text-[10px] uppercase font-semibold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          title="Simulate 48h Inactivity"
        >
          Test Push
        </button>
      </div>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
        Deine Aktivität der letzten 7 Tage
      </p>
      
      {/* Chart Section */}
      <div className="h-48 w-full -ml-4 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-stone-200 dark:text-stone-800" />
            <XAxis className="text-stone-500 dark:text-stone-400" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
            <YAxis className="text-stone-500 dark:text-stone-400" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" name="Gestartet" dataKey="initiated" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" name="Antworten" dataKey="replies" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Milestone Tracker Section */}
      <div className="pt-6 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-brand dark:text-brand-light" />
            <h3 className="font-medium text-stone-900 dark:text-stone-100">Dein Ziel: {goalTitle}</h3>
          </div>
          {completedMilestones < milestones.length - 1 && (
            <button 
              onClick={completeNextMilestone}
              className="px-3 py-1.5 bg-brand dark:bg-brand-light text-white dark:text-stone-900 shadow-sm rounded-full text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <PartyPopper size={14} />
              Erreichen
            </button>
          )}
        </div>
        
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before: before:from-transparent before:via-stone-200 dark:before:via-stone-800 before:to-transparent">
          {milestones.map((milestone, index) => {
            const isCompleted = index <= completedMilestones;
            const isCurrent = index === completedMilestones;
            
            return (
              <motion.div 
                key={index} 
                initial={false}
                animate={{ 
                  scale: isCurrent ? 1.02 : 1,
                  opacity: isCompleted ? 1 : 0.6
                }}
                className="relative flex items-center gap-4"
              >
                <motion.div 
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted ? 'var(--color-brand)' : 'transparent',
                    borderColor: isCompleted ? 'var(--color-brand)' : 'var(--color-stone-200)',
                  }}
                  className={`flex items-center justify-center w-6 h-6 rounded-full border-2 shrink-0 z-10 bg-white dark:bg-stone-900 ${
                    isCompleted 
                      ? 'border-brand dark:border-brand-light text-brand dark:text-brand-light' 
                      : 'border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle2 size={16} className="text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="circle"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Circle size={10} className="fill-current text-stone-300 dark:text-stone-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <div className={`flex-1 p-3 rounded-xl border transition-colors duration-300 ${
                  isCurrent 
                    ? 'border-brand/30 dark:border-brand-light/30 bg-brand/5 dark:bg-brand-light/5' 
                    : isCompleted
                      ? 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800'
                      : 'border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50'
                }`}>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isCompleted ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'
                  }`}>
                    {milestone}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
