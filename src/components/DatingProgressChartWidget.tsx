import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

const generateActivityData = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: `${d.getDate()}.${d.getMonth() + 1}`,
      interaction: Math.min(100, Math.max(30, 60 + Math.floor(Math.random() * 20) + (30 - i))),
      compatibility: Math.min(100, Math.max(40, 50 + Math.floor(Math.random() * 15) + (30 - i) * 0.8)),
    });
  }
  return data;
};

export function DatingProgressChartWidget() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setData(generateActivityData());
  }, []);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-brand/10 dark:bg-brand/20 flex items-center justify-center">
          <TrendingUp size={16} className="text-brand dark:text-brand-light" />
        </div>
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Dating-Fortschritts-Dashboard</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Entwicklung der letzten 30 Tage</p>
        </div>
      </div>
      <div className="flex-1 min-h-[200px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-bg-opacity, white)' }}
              labelStyle={{ color: '#57534e', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" name="Interaktionsqualität" dataKey="interaction" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" name="Kompatibilitäts-Score" dataKey="compatibility" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
