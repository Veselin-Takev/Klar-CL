// ═══════════════════════════════════════════════════════════════════════════
// P2-BEFUND, NICHT BEHOBEN: Dieses Widget erzeugt Daten, die es nicht gibt.
// Angezeigte Verläufe, Werte und Trends sind erfunden — für die bedienende
// Person aber nicht von echten zu unterscheiden.
//
// Nicht stillschweigend entfernt, weil das eine Produktentscheidung ist:
// entweder echte Daten anbinden oder das Widget streichen. Ein drittes
// „Demodaten mit Hinweis" gibt es nicht — ein Hinweis, den man wegklickt,
// macht die Zahl nicht wahr.
// ═══════════════════════════════════════════════════════════════════════════
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Target, Trophy, TrendingUp } from "lucide-react";

const generateMockData = () => {
  const data = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      tasksCompleted: Math.floor(Math.random() * 5) + (i > 15 ? 2 : 0),
      points: Math.floor(Math.random() * 50) + 10 + (i > 10 ? 30 : 0)
    });
  }
  return data;
};

export function DatingWheelStatsWidget() {
  const data = useMemo(() => generateMockData(), []);
  
  const totalTasks = data.reduce((acc, curr) => acc + curr.tasksCompleted, 0);
  const totalPoints = data.reduce((acc, curr) => acc + curr.points, 0);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light p-2 rounded-xl">
          <Target size={20} />
        </div>
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100">Dating-Glücksrad Statistiken</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Deine Fortschritte der letzten 30 Tage</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-100 dark:border-stone-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Gelöste Aufgaben</span>
            <Trophy size={14} className="text-brand dark:text-brand-light" />
          </div>
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalTasks}</span>
        </div>
        <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-100 dark:border-stone-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Gesammelte Punkte</span>
            <TrendingUp size={14} className="text-green-500" />
          </div>
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalPoints}</span>
        </div>
      </div>

      <div className="h-64 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-stone-200 dark:text-stone-800" />
            <XAxis className="text-stone-500 dark:text-stone-400" 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'currentColor' }} 
              minTickGap={20}
            />
            <YAxis className="text-stone-500 dark:text-stone-400" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'currentColor' }}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
              }}
              labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
            />
            <Line 
              type="monotone" 
              dataKey="tasksCompleted" 
              name="Aufgaben" 
              stroke="#F97316" 
              strokeWidth={3} 
              dot={false} 
              activeDot={{ r: 6, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
