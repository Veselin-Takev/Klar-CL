import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, BrainCircuit } from 'lucide-react';
import { melde } from "../lib/fehler";

export function WeeklyMoodSummaryWidget() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Aggregate from reflection logs
    const saved = localStorage.getItem('klar_reflection_logs');
    if (saved) {
      try {
        const logs = JSON.parse(saved);
        // Create 7 days template
        const last7Days = Array.from({length: 7}).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            dateStr: d.toLocaleDateString('de-DE'),
            shortLabel: d.toLocaleDateString('de-DE', { weekday: 'short' }),
            moodScore: 0,
            count: 0
          };
        });

        logs.forEach((log: any) => {
          const dateStr = new Date(log.date).toLocaleDateString('de-DE');
          const day = last7Days.find(d => d.dateStr === dateStr);
          if (day) {
            day.count++;
            if (log.mood === 'good') day.moodScore += 1;
            else if (log.mood === 'bad') day.moodScore -= 1;
          }
        });

        last7Days.forEach(day => {
          if (day.count > 0) {
            day.moodScore = day.moodScore / day.count; // Average between -1 and 1
          }
        });

        setData(last7Days);
      } catch (e) {
        melde("WeeklyMoodSummaryWidget", e);
      }
    } else {
        const mock = [
            { shortLabel: 'Mo', moodScore: 0.5 },
            { shortLabel: 'Di', moodScore: 1 },
            { shortLabel: 'Mi', moodScore: -0.5 },
            { shortLabel: 'Do', moodScore: 0 },
            { shortLabel: 'Fr', moodScore: 1 },
            { shortLabel: 'Sa', moodScore: 1 },
            { shortLabel: 'So', moodScore: 0.5 }
        ];
        setData(mock);
    }
  }, []);

  const avgMood = data.length ? data.reduce((acc, curr) => acc + curr.moodScore, 0) / data.length : 0;
  
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
          <Activity size={24} />
        </div>
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100">Wochen-Resümee</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Deine Date-Stimmung</p>
        </div>
      </div>
      
      <div className="h-40 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="shortLabel" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{fill: 'rgba(0,0,0,0.05)'}}
              formatter={(value: any) => {
                  if (value > 0.3) return ['Gut', 'Stimmung'];
                  if (value < -0.3) return ['Schlecht', 'Stimmung'];
                  return ['Neutral', 'Stimmung'];
              }}
            />
            <Bar dataKey="moodScore" fill="#a855f7" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {avgMood < -0.2 && (
        <div className="flex items-start gap-2 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800/30">
          <BrainCircuit size={16} className="text-purple-600 mt-0.5 shrink-0" />
          <p className="text-xs text-stone-700 dark:text-stone-300">
            <strong>AI-Coach Tipp:</strong> Dein Stimmungstrend ist leicht negativ. Gönn dir eine Pause vom Dating und lade deine Batterien wieder auf.
          </p>
        </div>
      )}
    </div>
  );
}
