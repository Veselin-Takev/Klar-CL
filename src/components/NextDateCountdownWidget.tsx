import { useState, useEffect } from 'react';
import { CalendarClock, Heart } from 'lucide-react';

export function NextDateCountdownWidget() {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number} | null>(null);
  const [nextDateName, setNextDateName] = useState<string>('');

  useEffect(() => {
    const checkNextDate = () => {
      const saved = localStorage.getItem('klar_planned_dates');
      if (saved) {
        try {
          const dates = JSON.parse(saved);
          const now = new Date();
          const futureDates = dates.filter((d: any) => new Date(d.date).getTime() > now.getTime());
          
          if (futureDates.length > 0) {
            futureDates.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const next = futureDates[0];
            setNextDateName(next.matchName);
            
            const diffTime = Math.abs(new Date(next.date).getTime() - now.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            setTimeLeft({ days: diffDays, hours: diffHours });
          } else {
            setTimeLeft(null);
          }
        } catch(e) {}
      }
    };
    
    checkNextDate();
    const interval = setInterval(checkNextDate, 60 * 60 * 1000); // Check every hour
    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="bg-gradient-to-br from-brand to-rose-400 border border-brand/20 rounded-3xl p-6 shadow-md text-white relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex items-center gap-2 mb-2 relative z-10">
        <CalendarClock size={20} className="opacity-80" />
        <h3 className="font-semibold text-sm">Vorfreude-Timer</h3>
      </div>
      
      <div className="relative z-10">
        <p className="text-xs opacity-90 mb-4">Date mit {nextDateName} in...</p>
        
        <div className="flex gap-4">
          <div className="text-center">
            <span className="text-3xl font-bold block leading-none">{timeLeft.days}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">Tage</span>
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold block leading-none">:</span>
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold block leading-none">{timeLeft.hours}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">Stunden</span>
          </div>
        </div>
        
        <div className="mt-5 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 flex items-start gap-2">
          <Heart size={14} className="mt-0.5 shrink-0 text-rose-200 fill-current" />
          <p className="text-xs opacity-95">"Bleib du selbst. Das ist mehr als genug."</p>
        </div>
      </div>
    </div>
  );
}
