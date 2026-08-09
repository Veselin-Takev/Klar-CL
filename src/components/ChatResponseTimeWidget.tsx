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
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, TrendingDown } from 'lucide-react';

const generateMockData = () => {
  const data = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
      time: Math.floor(Math.random() * 4) + 1 + (Math.random() * 2), // 1 to 6 hours
    });
  }
  return data;
};

export function ChatResponseTimeWidget() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setData(generateMockData());
  }, []);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
          <Clock size={24} />
        </div>
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100">Deine Reaktionszeit</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Durchschnitt der letzten 30 Tage</p>
        </div>
      </div>
      
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
            <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(val: any) => `\$${val}h`} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ color: '#6b7280', fontSize: '12px' }}
              itemStyle={{ color: '#111827', fontSize: '14px', fontWeight: 'bold' }}
              formatter={(value: any) => [`\$${Number(value).toFixed(1)} Stunden`, 'Reaktionszeit']}
            />
            <Area type="monotone" dataKey="time" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTime)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
        <TrendingDown size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-stone-700 dark:text-stone-300">
          Deine Reaktionszeit ist in der letzten Woche um <strong>15% gesunken</strong>. Du scheinst präsenter in deinen Chats zu sein!
        </p>
      </div>
    </div>
  );
}
