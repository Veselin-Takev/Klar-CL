import { useState, useEffect } from "react";
import { CalendarDays, Sparkles, MapPin, Clock, Plus, Trash2 } from "lucide-react";
import { allProfiles } from "../data";
import { motion } from "motion/react";
import { fetchDateIdeas } from "../lib/api";
import { melde } from "../lib/fehler";

interface DatePlannerWidgetProps {
  userInterests: string[];
  location: string | null;
}

export function DatePlannerWidget({ userInterests }: DatePlannerWidgetProps) {
  const [planningIdea, setPlanningIdea] = useState<number | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [planTime, setPlanTime] = useState('');

  const [ideas, setIdeas] = useState<{ title: string; description: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plannerMode, setPlannerMode] = useState<'ideas' | 'availability'>('ideas');
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [newAvailDate, setNewAvailDate] = useState("");
  const [newAvailTime, setNewAvailTime] = useState("");
  
  useEffect(() => {
    const saved = localStorage.getItem('klar_date_availabilities');
    if (saved) {
      try {
        setAvailabilities(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);
  
  const handleSaveAvailability = () => {
    if (!newAvailDate || !newAvailTime) return;
    const dt = new Date(`${newAvailDate}T${newAvailTime}`).toISOString();
    const updated = [...availabilities, { id: Date.now().toString(), date: dt }];
    setAvailabilities(updated);
    localStorage.setItem('klar_date_availabilities', JSON.stringify(updated));
    setNewAvailDate("");
    setNewAvailTime("");
  };
  
  const handleRemoveAvailability = (id: string) => {
    const updated = availabilities.filter(a => a.id !== id);
    setAvailabilities(updated);
    localStorage.setItem('klar_date_availabilities', JSON.stringify(updated));
  };

   
  const [allUpcomingDates, setAllUpcomingDates] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const updateDate = () => {
      const saved = localStorage.getItem('klar_planned_dates');
      if (!saved) return;
      try {
        const parsedDates = JSON.parse(saved);
        const now = new Date();
        const futureDates = parsedDates
          .filter((d: any) => new Date(d.date).getTime() > now.getTime() - (60 * 60 * 1000))
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
        if (futureDates.length > 0) {
          setAllUpcomingDates(futureDates);
          const nextDate = futureDates[0];
           
          
          const diffMs = new Date(nextDate.date).getTime() - now.getTime();
          if (diffMs <= 0) {
            setTimeRemaining("Jetzt!");
          } else {
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            const parts = [];
            if (diffDays > 0) parts.push(`${diffDays}t`);
            if (diffDays > 0 || diffHours > 0) parts.push(`${diffHours}h`);
            parts.push(`${diffMinutes}m`);
            setTimeRemaining(`In ${parts.join(' ')}`);
          }
        } else {
           
          setAllUpcomingDates([]);
        }
      } catch (e) {}
    };
    
    updateDate();
    const interval = setInterval(updateDate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const downloadICS = (title: string, description: string, dateStr: string, matchName: string) => {
    const startDate = new Date(dateStr);
    const endDate = new Date(startDate.getTime() + 120 * 60000); // 2 hours

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Klar Dating//Date Planner */} //DE',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:Date mit ${matchName}`,
      `DESCRIPTION:${title} - ${description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `date_${matchName.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFetchDateIdeas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const interestsStr = userInterests.join(", ");
      const result = await fetchDateIdeas(interestsStr);
      setIdeas(result);
    } catch (e) {
      melde("DatePlannerWidget", e);
      setError("Fehler beim Laden von Date-Ideen.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDate = (ideaTitle: string, ideaDescription: string) => {
    if (!selectedProfileId || !planDate || !planTime) return;
    const profile = allProfiles.find(p => p.id === selectedProfileId);
    if (!profile) return;
    
    const newDate = {
      id: Date.now().toString(),
      profileId: selectedProfileId,
      matchName: profile.name,
      idea: ideaTitle,
      description: ideaDescription,
      date: `${planDate}T${planTime}:00` };
    
    const saved = localStorage.getItem('klar_planned_dates');
    const dates = saved ? JSON.parse(saved) : [];
    dates.push(newDate);
    localStorage.setItem('klar_planned_dates', JSON.stringify(dates));

    // Optional Auto-Sync could be placed here
    
    setPlanningIdea(null);
    setSelectedProfileId('');
    setPlanDate('');
    setPlanTime('');
    
    // Force state update
    const event = new Event('storage');
    window.dispatchEvent(event);
    // Reload local storage for our own view
    setAllUpcomingDates(prev => {
        const d = [...prev, newDate];
        return d.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPlannerMode('ideas')}
              className={`text-sm font-semibold ${plannerMode === 'ideas' ? 'text-brand dark:text-brand-light' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
            >
              Ideen & Dates
            </button>
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <button 
              onClick={() => setPlannerMode('availability')}
              className={`text-sm font-semibold ${plannerMode === 'availability' ? 'text-brand dark:text-brand-light' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
            >
              Zeiten markieren
            </button>
          </div>
          <h3 className="sr-only">Date Planner</h3>
  
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Lokale Unternehmungen für deine Verbindungen
          </p>
        </div>
        <button 
          onClick={handleFetchDateIdeas} 
          disabled={isLoading}
          className="text-stone-400 hover:text-brand dark:hover:text-brand-light transition-colors p-1.5 bg-stone-100 dark:bg-stone-800 rounded-full disabled:opacity-50"
          title="Neue Vorschläge generieren"
        >
          <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span>
        </button>
      </div>
      
      
      {plannerMode === 'availability' ? (
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
            Markiere dir feste Zeiten im Kalender, um dich selbst zu motivieren und verbindlicher an Dates ranzugehen.
          </p>
          
          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700 mb-6">
            <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-brand dark:text-brand-light" />
              Neuen Slot markieren
            </h4>
            <div className="flex gap-2 mb-3">
              <input 
                type="date" 
                value={newAvailDate}
                onChange={e => setNewAvailDate(e.target.value)}
                className="flex-1 text-sm p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700"
              />
              <input 
                type="time" 
                value={newAvailTime}
                onChange={e => setNewAvailTime(e.target.value)}
                className="w-24 text-sm p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700"
              />
            </div>
            <button 
              onClick={handleSaveAvailability}
              disabled={!newAvailDate || !newAvailTime}
              className="w-full py-2 bg-brand hover:bg-brand/90 dark:bg-brand-light dark:hover:bg-brand-light/90 text-white dark:text-stone-900 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Zeitpunkt reservieren
            </button>
          </div>
          
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Reservierte Zeiten</h4>
          {availabilities.length === 0 ? (
             <p className="text-sm text-stone-500 italic">Noch keine Zeiten markiert.</p>
          ) : (
            <div className="space-y-2">
              {availabilities.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(avail => {
                const d = new Date(avail.date);
                return (
                  <div key={avail.id} className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand/10 dark:bg-brand-light/10 flex items-center justify-center text-brand dark:text-brand-light">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-xs text-stone-500">
                          {d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveAvailability(avail.id)}
                      className="p-2 text-stone-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {allUpcomingDates.length > 0 && (
        <div className="mb-4 space-y-3">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Geplante Dates</h4>
          {allUpcomingDates.map((dateItem: any, idx: number) => {
            const isNext = idx === 0;
            return (
              <div key={idx} className={`p-3 border rounded-xl relative overflow-hidden ${isNext ? 'bg-brand/10 border-brand/20 dark:bg-brand-light/10 dark:border-brand-light/20' : 'bg-stone-50 dark:bg-stone-800/50 border-stone-100 dark:border-stone-800'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isNext ? 'text-brand dark:text-brand-light' : 'text-stone-700 dark:text-stone-300'}`}>
                    <Clock size={12} />
                    {isNext ? `Nächstes Date: ${timeRemaining}` : new Date(dateItem.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' Uhr'}
                  </h4>
                </div>
                <p className={`text-sm font-medium mb-1 ${isNext ? 'text-stone-900 dark:text-stone-100' : 'text-stone-900 dark:text-stone-100'}`}>
                  Mit {dateItem.matchName}
                </p>
                <p className={`text-xs mb-3 ${isNext ? 'text-stone-700 dark:text-stone-300' : 'text-stone-600 dark:text-stone-400'}`}>
                  {dateItem.idea || "Date-Vorbereitungs-Checkliste checken!"}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  <button 
                    onClick={() => {
                      const start = new Date(dateItem.date);
                      const end = new Date(start.getTime() + 120 * 60000);
                      const format = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '').split('Z')[0] + 'Z';
                      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Date+mit+${encodeURIComponent(dateItem.matchName)}&dates=${format(start)}/${format(end)}&details=${encodeURIComponent(dateItem.idea || '')}`;
                      window.open(url, '_blank');
                    }}
                    className="flex-1 py-1.5 px-2 bg-white dark:bg-stone-800 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                  >
                    Google Calendar
                  </button>
                  <button 
                    onClick={() => downloadICS(dateItem.idea || "Date", "Date Erinnerung", dateItem.date, dateItem.matchName)}
                    className="flex-1 py-1.5 px-2 bg-white dark:bg-stone-800 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                  >
                    Apple (.ics)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {isLoading && ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-stone-500">
            <Sparkles className="animate-pulse mb-3 text-brand" size={24} />
            <p className="text-sm font-medium animate-pulse">Plane perfekte Dates...</p>
          </div>
        ) : error && ideas.length === 0 ? (
          <div className="text-center py-6 text-sm text-stone-500 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
            {error}
          </div>
        ) : (
          <div className="space-y-3">
            {ideas.map((idea, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex flex-col gap-1"
              >
                <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <MapPin size={14} className="text-brand dark:text-brand-light" />
                  {idea.title}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-snug">
                  {idea.description}
                </p>
                
                {planningIdea === idx ? (
                  <div className="mt-3 p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 flex flex-col gap-2">
                    <select
                      value={selectedProfileId}
                      onChange={e => setSelectedProfileId(e.target.value)}
                      className="w-full text-xs p-1.5 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                    >
                      <option value="">Verbindung auswählen...</option>
                      {allProfiles.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    
                    <div className="flex gap-2">
                      <input 
                        type="date" 
                        value={planDate}
                        onChange={e => setPlanDate(e.target.value)}
                        className="flex-1 text-xs p-1.5 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                      />
                      <input 
                        type="time" 
                        value={planTime}
                        onChange={e => setPlanTime(e.target.value)}
                        className="flex-1 text-xs p-1.5 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => setPlanningIdea(null)}
                        className="flex-1 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                      >
                        Abbrechen
                      </button>
                      <button 
                        onClick={() => handleSaveDate(idea.title, idea.description)}
                        disabled={!selectedProfileId || !planDate || !planTime}
                        className="flex-1 py-1.5 bg-brand hover:bg-brand/90 dark:bg-brand-light dark:hover:bg-brand-light/90 text-white dark:text-stone-900 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Speichern
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setPlanningIdea(idx)}
                    className="mt-2 py-1.5 px-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 self-start flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} />
                    Date planen
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      </>
      )} {/* end plannerMode switch */}
    </div>
  );
}
