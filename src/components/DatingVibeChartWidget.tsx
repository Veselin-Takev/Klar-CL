import { useState, useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Activity, MessageCircle } from "lucide-react";

type Mood = "excited" | "relaxed" | "neutral" | "nervous" | "frustrated";

interface MoodEntry {
  date: string;
  mood: Mood;
}

const MOOD_VALUES: Record<Mood, number> = {
  excited: 5,
  relaxed: 4,
  neutral: 3,
  nervous: 2,
  frustrated: 1,
};

const MOOD_LABELS: Record<number, string> = {
  5: "Begeistert",
  4: "Entspannt",
  3: "Neutral",
  2: "Nervös",
  1: "Frustriert",
};

export function DatingVibeChartWidget() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const savedMoods = localStorage.getItem('klar_dating_moods');
    const savedJournals = localStorage.getItem('klar_journal_entries');
    
    let entries: MoodEntry[] = [];
    let journals: any[] = [];
    
    if (savedMoods) {
      try { entries = JSON.parse(savedMoods); } catch (e) {}
    }
    if (savedJournals) {
      try { journals = JSON.parse(savedJournals); } catch (e) {}
    }

    // Generate last 14 days data
    const chartData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0] || '';
      const entry = entries.find(e => e.date === dateStr);
      
      // Find a journal entry from this date
      const journalMatch = journals.find(j => {
        const jDate = new Date(j.createdAt || Date.now()).toISOString().split('T')[0] || '';
        return jDate === dateStr;
      });
      
      chartData.push({
        date: dateStr?.split('-').slice(1).join('.'), // MM.DD
        value: entry ? MOOD_VALUES[entry.mood] : null,
        fullDate: dateStr,
        journalText: journalMatch ? (journalMatch.recap || journalMatch.content || "").substring(0, 80) + "..." : null,
      });
    }

    // Fill nulls with previous values or 3 (neutral) if no previous
    let lastVal = 3;
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i]!.value !== null) {
        lastVal = chartData[i]!.value as number;
      } else {
        chartData[i]!.value = lastVal;
      }
    }

    setData(chartData);
  }, []);

  const CustomTooltip = ({ active, payload,  }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white dark:bg-stone-800 p-3 rounded-xl shadow-lg border border-stone-100 dark:border-stone-700 max-w-[200px]">
          <p className="text-xs text-stone-500 mb-1">{dataPoint.fullDate}</p>
          <p className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-2">
            {MOOD_LABELS[dataPoint.value] || 'Stimmung'}
          </p>
          {dataPoint.journalText && (
            <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-700">
              <div className="flex items-center gap-1.5 text-xs text-brand mb-1">
                <MessageCircle size={12} /> <span className="font-medium">Tagebuch</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 italic line-clamp-3">
                "{dataPoint.journalText}"
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-brand/10 dark:bg-brand-light/10 flex items-center justify-center">
          <Activity size={20} className="text-brand dark:text-brand-light" />
        </div>
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100">Dating-Vibe Verlauf</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Dein Stimmungstrend der letzten 14 Tage</p>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] w-full mt-2 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVibe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#888888' }} 
              dy={10}
            />
            <YAxis 
              domain={[1, 5]} 
              ticks={[1, 2, 3, 4, 5]} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(val) => MOOD_LABELS[val] || ''}
              tick={{ fontSize: 10, fill: '#888888' }}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#4F46E5" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorVibe)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
