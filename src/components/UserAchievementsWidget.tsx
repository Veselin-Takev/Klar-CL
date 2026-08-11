import React, { useState, useEffect } from 'react';
import { Award, Star, MessageSquare, Flame } from 'lucide-react';

export const UserAchievementsWidget: React.FC = () => {
  const [achievements, setAchievements] = useState([
    { id: 'profile', title: 'Profil-Meister', description: 'Profil zu 100% ausgefüllt', icon: Star, unlocked: false },
    { id: 'icebreaker', title: 'Eisbrecher', description: 'Erste Nachricht gesendet', icon: MessageSquare, unlocked: false },
    { id: 'conversation', title: 'Gesprächig', description: '3 Tage in Folge gechattet', icon: Flame, unlocked: false },
  ]);

  useEffect(() => {
    // Check unlock status based on localStorage / simulated data
    const checkAchievements = () => {
      const bio = localStorage.getItem('klar_user_bio') || '';
      const interestsStr = localStorage.getItem('userInterests');
      let interestsCount = 0;
      try {
        interestsCount = interestsStr ? JSON.parse(interestsStr).length : 0;
      } catch(e) {}
      
      const profileUnlocked = bio.length > 20 && interestsCount >= 3;
      
      const hasChats = localStorage.getItem('klar_chats_started') === 'true';
      const icebreakerUnlocked = hasChats;

      const chatStreak = parseInt(localStorage.getItem('klar_chat_streak') || '0', 10);
      const conversationUnlocked = chatStreak >= 3;

      setAchievements(prev => prev.map(a => {
        if (a.id === 'profile') return { ...a, unlocked: profileUnlocked };
        if (a.id === 'icebreaker') return { ...a, unlocked: icebreakerUnlocked };
        if (a.id === 'conversation') return { ...a, unlocked: conversationUnlocked };
        return a;
      }));
    };

    checkAchievements();
    window.addEventListener('storage', checkAchievements);
    return () => window.removeEventListener('storage', checkAchievements);
  }, []);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Award className="text-brand dark:text-brand-light" size={20} />
        <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">Auszeichnungen</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          return (
            <div key={achievement.id} className={`flex flex-col items-center text-center p-3 rounded-xl border ${achievement.unlocked ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-stone-50 dark:bg-stone-800/50 border-stone-100 dark:border-stone-700 opacity-60'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${achievement.unlocked ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' : 'bg-stone-200 dark:bg-stone-700 text-stone-400'}`}>
                <Icon size={20} />
              </div>
              <span className={`text-xs font-semibold mb-1 ${achievement.unlocked ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500'}`}>{achievement.title}</span>
              <span className="text-[10px] text-stone-500 leading-tight">{achievement.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
