import React, { useState, useEffect } from 'react';
import { Moon, Save, Loader2, Info } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { melde } from "../lib/fehler";
import { useAuth } from "../lib/AuthContext";

export const SmartPausePlanner: React.FC = () => {
  // 7 days (0 = Monday, 6 = Sunday), 24 hours
  const [schedule, setSchedule] = useState<boolean[][]>(
    Array(7).fill(null).map(() => Array(24).fill(false))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState('');

  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  // BEFUND 10.08.2026: Hier stand const userId = "demo-user-id" mit dem
  // Kommentar "In a real app this comes from auth context". Gelesen und
  // geschrieben wurde nach userSettings/demo-user-id -- eine Sammlung, fuer
  // die es in firestore.rules KEINE Regel gibt. Bei Deny-by-default heisst
  // das: immer abgelehnt, fuer jedes Konto.
  //
  // Der Pausenplaner hat also nie funktioniert, und niemand haette es
  // gemerkt: Der Ladefehler landete nur in der Konsole, die Oberflaeche
  // zeigte danach den leeren Standardplan, als waere nichts gewesen.
  //
  // Richtiger Ort laut Datenmodell ist das Feld userSettings im eigenen
  // Nutzerdokument -- isValidUserUpdate in firestore.rules fuehrt es
  // ausdruecklich in der erlaubten Liste.
  const { user } = useAuth();
  const userId = user?.uid ?? null;

  useEffect(() => {
    const loadSchedule = async () => {
      if (!userId) { setIsLoaded(true); return; }
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        const gespeichert = docSnap.data()?.userSettings?.smartPauseSchedule;
        if (Array.isArray(gespeichert)) setSchedule(gespeichert);
      } catch (e) {
        // Sichtbar machen statt verschlucken: Bisher stand hier nur ein
        // console.error, und die Oberflaeche zeigte danach den leeren
        // Standardplan -- nicht zu unterscheiden von "noch nichts gespeichert".
        melde("SmartPausePlanner/laden", e);
        setError('Zeitplan konnte nicht geladen werden.');
      } finally {
        setIsLoaded(true);
      }
    };
    loadSchedule();
  }, [userId]);

  const toggleHour = (dayIdx: number, hourIdx: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIdx] = [...(newSchedule[dayIdx] || [])];
    newSchedule[dayIdx][hourIdx] = !newSchedule[dayIdx][hourIdx];
    setSchedule(newSchedule);
  };

  const saveSchedule = async () => {
    if (!userId) { setError('Nicht angemeldet.'); return; }
    setIsSaving(true);
    setError('');
    try {
      const docRef = doc(db, 'users', userId);
      // Bestehende Einstellungen mitnehmen: setDoc mit merge ersetzt ein
      // verschachteltes Objekt vollstaendig, andere Eintraege unter
      // userSettings gingen sonst verloren.
      const vorhanden = (await getDoc(docRef)).data()?.userSettings ?? {};
      await setDoc(
        docRef,
        {
          userSettings: { ...vorhanden, smartPauseSchedule: schedule },
          // isValidUserUpdate erlaubt genau diese beiden Felder zusammen.
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
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
