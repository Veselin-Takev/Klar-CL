import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Trash2, Plus, Check } from 'lucide-react';
import { allProfiles } from '../data';

export interface PlannedDate {
  id: string;
  remindMe?: boolean;
  profileId: string;
  matchName: string;
  idea: string;
  date: string;
}

export function DateCalendar() {
  const [dates, setDates] = useState<PlannedDate[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [idea, setIdea] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [remindMe, setRemindMe] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('klar_planned_dates');
    if (saved) {
      try {
        setDates(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to parse dates", e);
      }
    }
  }, []);

  const saveDates = (newDates: PlannedDate[]) => {
    setDates(newDates);
    localStorage.setItem('klar_planned_dates', JSON.stringify(newDates));
  };

  const handleAdd = () => {
    if (!selectedProfileId || !idea || !date || !time) return;
    
    const verbindung = allProfiles.find(p => p.id === selectedProfileId);
    if (!verbindung) return;

    const dateTime = new Date(`${date}T${time}`).toISOString();
    
    const newDate: PlannedDate = {
      id: Date.now().toString(),
      profileId: verbindung.id,
      matchName: verbindung.name,
      idea,
      date: dateTime,
      remindMe,
    };
    
    saveDates([...dates, newDate].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setShowAddModal(false);
    setSelectedProfileId('');
    setIdea('');
    setDate('');
    setTime('');
  };

  const handleDelete = (id: string) => {
    saveDates(dates.filter(d => d.id !== id));
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return {
      dateStr: d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' }),
      timeStr: d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <CalendarIcon className="text-brand dark:text-brand-light" size={24} />
          Date Calendar
        </h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="p-2 bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light rounded-full hover:bg-brand/20 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {dates.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
          <CalendarIcon size={48} className="mx-auto text-stone-300 dark:text-stone-700 mb-4" />
          <p className="text-stone-500 dark:text-stone-400 font-medium">Noch keine Dates geplant.</p>
          <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">Nutze den Date Planner und füge hier deine Dates hinzu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dates.map((d) => {
            const { dateStr, timeStr } = formatDateTime(d.date);
            const verbindung = allProfiles.find(p => p.id === d.profileId);
            return (
              <div key={d.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="flex-shrink-0 flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 w-16 h-16 rounded-xl border border-stone-100 dark:border-stone-800">
                  <span className="text-xs font-medium text-stone-500 uppercase">{dateStr.split(',')[0]}</span>
                  <span className="text-lg font-bold text-stone-900 dark:text-stone-100">{dateStr.split(' ')[1]?.replace('.', '')}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {verbindung && <img src={verbindung.photoUrl} alt={verbindung.name} className="w-5 h-5 rounded-full object-cover" />}
                    <h4 className="font-semibold text-stone-900 dark:text-stone-100 truncate">Date mit {d.matchName}</h4>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 truncate flex items-center gap-1.5 mb-1">
                    <MapPin size={14} /> {d.idea}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-500 flex items-center gap-1.5">
                    <Clock size={12} /> {timeStr} Uhr
                  </p>
                </div>
                
                {/* ── BEFUND 10.08.2026, zwei Fehler an einer Stelle ──────────
                    1. Der Teilen-Knopf stand INNERHALB des Löschen-Knopfes.
                       HTML verbietet das; der Browser meldete „<button> cannot
                       be a descendant of <button>". Folge im Betrieb: Ein Tipp
                       auf „Teilen" löste beide Handler aus — der Termin wurde
                       geteilt UND gelöscht.
                    2. Zwischen den Knöpfen stand ein wörtliches `\n` im JSX.
                       JSX gibt das als Text aus; im Screenshot vom 10.08. steht
                       genau dieses „\n" neben dem Kalendersymbol.
                    Jetzt zwei gleichrangige Knöpfe nebeneinander. */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const text = `Date mit ${d.matchName} am ${dateStr} um ${timeStr} Uhr. Ort: ${d.idea}`;
                      if (navigator.share) {
                        navigator.share({
                          title: 'Neues Date',
                          text: text
                        }).catch(console.error);
                      } else {
                        alert('Teilen nicht unterstützt. Manuell eintragen: ' + text);
                      }
                    }}
                    className="p-2 text-stone-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-colors"
                    title="In Kalender-App exportieren (Sync)"
                  >
                    <CalendarIcon size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors"
                    title="Termin löschen"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md shadow-md border border-stone-200 dark:border-stone-800">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">Neues Date eintragen</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Verbindung</label>
                <select 
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="" disabled>Wähle ein Verbindung...</option>
                  {allProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Idee / Ort</label>
                <input 
                  type="text" 
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="z.B. Kaffee bei The Barn"
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Datum</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Uhrzeit</label>
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
            </div>

            
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${remindMe ? 'bg-brand dark:bg-brand-light text-white' : 'border border-stone-300 dark:border-stone-600'}`}>
                  {remindMe && <Check size={14} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Erinnerung aktivieren</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">2 Stunden vorher an Ort & Checkliste erinnern</p>
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={remindMe} 
                  onChange={(e) => setRemindMe(e.target.checked)} 
                />
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleAdd}
                disabled={!selectedProfileId || !idea || !date || !time}
                className="flex-1 py-3 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-xl text-sm font-medium disabled:opacity-50 transition-opacity"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
