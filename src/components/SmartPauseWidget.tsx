import React, { useState, useEffect } from 'react';
import { Moon, WifiOff, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export const SmartPauseWidget: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [scheduleConfig, setScheduleConfig] = useState(() => {
    const saved = localStorage.getItem('klar_smart_pause_config');
    if (saved) return JSON.parse(saved);
    return {
      days: [1, 2, 3, 4, 5], // Mon-Fri
      startHour: 18,
      endHour: 22
    };
  });
  
  useEffect(() => {
    const savedSchedule = localStorage.getItem('klar_smart_pause_schedule');
    if (savedSchedule === 'true') setHasSchedule(true);
    
    const savedPaused = localStorage.getItem('klar_smart_pause');
    if (savedPaused === 'true') setIsPaused(true);
  }, []);
  
  useEffect(() => {
    if (!hasSchedule) return;
    const interval = setInterval(() => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      
      const inSchedule = scheduleConfig.days.includes(day) && 
                         hour >= scheduleConfig.startHour && 
                         hour < scheduleConfig.endHour;
                         
      if (inSchedule) {
         if (!isPaused) {
           setIsPaused(true);
           localStorage.setItem('klar_smart_pause', 'true');
         }
      } else {
         if (isPaused) {
           setIsPaused(false);
           localStorage.setItem('klar_smart_pause', 'false');
         }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [hasSchedule, isPaused, scheduleConfig]);
  
  const toggleSchedule = () => {
    const nextState = !hasSchedule;
    setHasSchedule(nextState);
    localStorage.setItem('klar_smart_pause_schedule', String(nextState));
  };
  
  const togglePause = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    localStorage.setItem('klar_smart_pause', String(nextState));
  };
  
  const updateConfig = (newConfig: any) => {
    setScheduleConfig(newConfig);
    localStorage.setItem('klar_smart_pause_config', JSON.stringify(newConfig));
  };

  const toggleDay = (dayIndex: number) => {
    const newDays = scheduleConfig.days.includes(dayIndex)
      ? scheduleConfig.days.filter((d: number) => d !== dayIndex)
      : [...scheduleConfig.days, dayIndex];
    updateConfig({ ...scheduleConfig, days: newDays });
  };

  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Moon className={isPaused ? "text-indigo-500" : "text-stone-400"} size={20} />
          <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">Smart-Pause-Modus</h3>
        </div>
        <button 
          role="switch"
          aria-checked={isPaused}
          aria-label="Smart-Pause-Modus"
          onClick={togglePause}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isPaused ? 'bg-indigo-500' : 'bg-stone-300 dark:bg-stone-700'
          }`}
        >
          <span 
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isPaused ? 'translate-x-6' : 'translate-x-1'
            }`} 
          />
        </button>
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
        Erscheine für deine Matches als "Bin gerade offline". Du kannst die App weiterhin nutzen, ohne antworten zu müssen.
      </p>
      
      {isPaused && (
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg mb-4">
          <WifiOff size={14} /> 
          Dein Profil wird deinen Matches aktuell als "offline" angezeigt.
        </div>
      )}

      <div className="border-t border-stone-100 dark:border-stone-800 pt-4 mt-2">
        <div className="flex justify-between items-center mb-2">
           <span className="text-sm font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
             <Clock size={16} className="text-stone-400" />
             Zeitplan Automatisierung
           </span>
           <button 
            role="switch"
            aria-checked={hasSchedule}
            aria-label="Zeitplan-Automatisierung"
            onClick={toggleSchedule}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              hasSchedule ? 'bg-indigo-500' : 'bg-stone-200 dark:bg-stone-700'
            }`}
          >
            <span 
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                hasSchedule ? 'translate-x-5' : 'translate-x-1'
              }`} 
            />
          </button>
        </div>
        
        {hasSchedule && (
          <div className="mt-3">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full text-xs font-medium text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <span>
                Aktiv: {scheduleConfig.days.length} Tage, {scheduleConfig.startHour}:00 - {scheduleConfig.endHour}:00 Uhr
              </span>
              {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {showSettings && (
              <div className="mt-3 p-3 border border-stone-100 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-900/50 animate-in fade-in slide-in-from-top-2">
                <div className="mb-4">
                  <label className="text-xs font-medium text-stone-700 dark:text-stone-300 mb-2 block">Aktive Tage</label>
                  <div className="flex justify-between gap-1">
                    {[1, 2, 3, 4, 5, 6, 0].map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                          scheduleConfig.days.includes(day)
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-stone-100 text-stone-500 dark:bg-stone-800 border border-transparent hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                      >
                        {dayNames[day]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-stone-700 dark:text-stone-300 mb-1 block">Von</label>
                    <select 
                      value={scheduleConfig.startHour}
                      onChange={(e) => updateConfig({ ...scheduleConfig, startHour: parseInt(e.target.value) })}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-1.5 text-sm"
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={`start-${i}`} value={i}>{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-stone-700 dark:text-stone-300 mb-1 block">Bis</label>
                    <select 
                      value={scheduleConfig.endHour}
                      onChange={(e) => updateConfig({ ...scheduleConfig, endHour: parseInt(e.target.value) })}
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-1.5 text-sm"
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={`end-${i}`} value={i}>{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
