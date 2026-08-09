import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';

const data = [
  { name: 'Woche 1', gespraeche: 4, qualitaet: 60 },
  { name: 'Woche 2', gespraeche: 6, qualitaet: 65 },
  { name: 'Woche 3', gespraeche: 5, qualitaet: 80 },
  { name: 'Woche 4', gespraeche: 8, qualitaet: 90 },
];

export const DatingSuccessChartWidget: React.FC = () => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-brand dark:text-brand-light" size={20} />
        <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">Dating-Erfolg</h3>
      </div>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
        Gesprächsaktivität und Beziehungsqualität im letzten Monat.
      </p>
      
      <div className="h-48 w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGespraeche" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorQualitaet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-bg-opacity, white)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 500 }}
              labelStyle={{ fontSize: '12px', color: '#78716c', marginBottom: '4px' }}
            />
            <Area type="monotone" dataKey="gespraeche" name="Gespräche" stroke="#fb923c" fillOpacity={1} fill="url(#colorGespraeche)" />
            <Area type="monotone" dataKey="qualitaet" name="Qualität (%)" stroke="#6366f1" fillOpacity={1} fill="url(#colorQualitaet)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
