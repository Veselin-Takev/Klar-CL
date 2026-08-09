import React, { useState, useEffect } from 'react';
import { Moon, Save, Loader2, Info } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { melde } from "../lib/fehler";

export const SmartPausePlanner: React.FC = () => {
  // 7 days (0 = Monday, 6 = Sunday), 24 hours
  const [schedule, setSchedule] = useState<boolean[][]>(
    Array(7).fill(null).map(() => Array(24).fill(false))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState('');

  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const userId = "demo-user-id"; // In a real app this comes from auth context

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const docRef = doc(db, 'userSettings', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().smartPauseSchedule) {
          setSchedule(docSnap.data().smartPauseSchedule);
        }
      } catch (e) {
        console.error("Failed to load schedule", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSchedule();
  }, []);

  const toggleHour = (dayIdx: number, hourIdx: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIdx] = [...(newSchedule[dayIdx] || [])];
    newSchedule[dayIdx][hourIdx] = !newSchedule[dayIdx][hourIdx];
    setSchedule(newSchedule);
  };

  const saveSchedule = async () => {
    setIsSaving(true);
    setError('');
    try {
      const docRef = doc(db, 'userSettings', userId);
      await setDoc(docRef, { smartPauseSchedule: schedule }, { merge: true });
    } catch (e) {
      melde("SmartPausePlanner", e);
      setError('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return <div className="p-4 text-center text-sm text-stone-500">Lade Zeitplan...</div>;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Moon className="text-indigo-500" size={20} />
          <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">Smart-Pause Planner</h3>
        </div>
        <button 
          onClick={saveSchedule}
          disabled={isSaving}
          className="text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Speichern
        </button>
      </div>

      <div className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl mb-4 border border-stone-100 dark:border-stone-800">
        <Info size={16} className="text-indigo-500 mt-0.5 shrink-0" />
        <p>Wähle die Stunden, in denen du für Matches als "Bin gerade offline" angezeigt werden möchtest. Perfekt für Arbeitszeiten oder Schlaf.</p>
      </div>

      {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[500px]">
          <div className="flex mb-1">
            <div className="w-8 shrink-0"></div>
            {Array.from({length: 24}).map((_, i) => (
              <div key={i} className="flex-1 text-[10px] text-center text-stone-400">
                {i % 4 === 0 ? `${i}` : ''}
              </div>
            ))}
          </div>
          
          <div className="space-y-1">
            {days.map((day, dIdx) => (
              <div key={day} className="flex items-center h-6">
                <div className="w-8 shrink-0 text-[10px] font-medium text-stone-500">{day}</div>
                {Array.from({length: 24}).map((_, hIdx) => {
                  const isActive = schedule[dIdx]?.[hIdx];
                  return (
                    <div key={hIdx} className="flex-1 px-[1px] h-full">
                      <button
                        onClick={() => toggleHour(dIdx, hIdx)}
                        className={`w-full h-full rounded-[2px] transition-colors ${
                          isActive 
                            ? 'bg-indigo-400 dark:bg-indigo-500 hover:bg-indigo-500' 
                            : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                        title={`${day}, ${hIdx}:00 - ${hIdx+1}:00`}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
