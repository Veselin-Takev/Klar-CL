import React, { useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';


// Generate mock data for the last 6 months (30 days each)
const historicalMoodData = Array.from({ length: 6 }).map((_, monthIdx) => {
  return Array.from({ length: 30 }).map((_, dayIdx) => {
    // some random variation but keeping a general trend
    const base = 40 + (5 - monthIdx) * 5;
    return {
      day: String(dayIdx + 1),
      stimmung: Math.max(0, Math.min(100, base + Math.random() * 30 - 15))
    };
  });
});

const data = [
  { subject: 'Ehrlichkeit', A: 85, fullMark: 100 },
  { subject: 'Tiefgang', A: 70, fullMark: 100 },
  { subject: 'Energie', A: 90, fullMark: 100 },
  { subject: 'Empathie', A: 80, fullMark: 100 },
  { subject: 'Fokus', A: 65, fullMark: 100 },
];

export const ReflectionRadarWidget: React.FC = () => {
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);

  const currentMonthData = useMemo(() => {
    return historicalMoodData[selectedMonthOffset] || [];
  }, [selectedMonthOffset]);

  const monthLabels = ["Aktueller Monat", "Vor 1 Monat", "Vor 2 Monaten", "Vor 3 Monaten", "Vor 4 Monaten", "Vor 5 Monaten"];

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-brand dark:text-brand-light" size={20} />
          <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">Reflektions-Radar</h3>
        </div>
        <span className="text-xs font-medium text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">Letzte 7 Tage</span>
      </div>
      
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
        So entwickeln sich deine Dating-Interaktionen basierend auf deinen Daily Check-ins.
      </p>

      <div className="h-48 w-full -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#e5e7eb" className="dark:stroke-stone-700" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#78716c', fontSize: 10, fontWeight: 500 }} 
            />
            <Radar
              name="Du"
              dataKey="A"
              stroke="#fb923c"
              fill="#fb923c"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 border-t border-stone-100 dark:border-stone-800 pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-stone-800 dark:text-stone-200">Stimmungs-Entwicklung (30 Tage)</h4>
          <span className="text-xs font-medium text-brand dark:text-brand-light">{monthLabels[selectedMonthOffset]}</span>
        </div>
        
        <div className="mb-4">
          <input 
            type="range" 
            min="0" 
            max="5" 
            value={selectedMonthOffset} 
            onChange={(e) => setSelectedMonthOffset(parseInt(e.target.value))}
            className="w-full accent-brand"
            style={{ direction: 'rtl' }}
          />
          <div className="flex justify-between text-[10px] text-stone-400 font-medium">
            <span>Vor 5 Monaten</span>
            <span>Aktuell</span>
          </div>
        </div>

        <div className="h-32 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentMonthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-bg-opacity, white)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 500 }}
              />
              <Line type="monotone" dataKey="stimmung" name="Stimmung" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
  
      <div className="flex justify-between items-center mt-2 px-2">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-300 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-brand"></span> Deine Entwicklung
        </span>
      </div>
    </div>
  );
};
