import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Woche 1', aktivitat: 12, verbindungen: 2, gespraeche: 8 },
  { name: 'Woche 2', aktivitat: 19, verbindungen: 3, gespraeche: 12 },
  { name: 'Woche 3', aktivitat: 15, verbindungen: 1, gespraeche: 10 },
  { name: 'Woche 4', aktivitat: 22, verbindungen: 4, gespraeche: 16 },
];

export const DatingActivityDashboardWidget: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="text-brand dark:text-brand-light" size={20} />
        <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">Dating-Aktivität (30 Tage)</h3>
      </div>
      
      <div className="h-48 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#78716c' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#78716c' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#1c1917', marginBottom: '4px' }}
            />
            <Line type="monotone" dataKey="aktivitat" name="App-Besuche" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} />
            <Line type="monotone" dataKey="gespraeche" name="Gespräche" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 text-center border border-stone-100 dark:border-stone-700">
          <div className="text-xl font-bold text-stone-900 dark:text-stone-100">68</div>
          <div className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">App-Besuche</div>
        </div>
        <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 text-center border border-stone-100 dark:border-stone-700">
          <div className="text-xl font-bold text-stone-900 dark:text-stone-100">10</div>
          <div className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">Verbindungen</div>
        </div>
        <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 text-center border border-stone-100 dark:border-stone-700">
          <div className="text-xl font-bold text-stone-900 dark:text-stone-100">46</div>
          <div className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">Nachrichten</div>
        </div>
      </div>
    </div>
  );
};
