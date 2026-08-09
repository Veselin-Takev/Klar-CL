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
import { motion } from "motion/react";
import { TrendingUp, Clock, MessageSquare, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const mockData = [
  { name: "Mo", depth: 3, response: 80 },
  { name: "Di", depth: 5, response: 60 },
  { name: "Mi", depth: 4, response: 90 },
  { name: "Do", depth: 7, response: 40 },
  { name: "Fr", depth: 8, response: 30 },
  { name: "Sa", depth: 9, response: 25 },
  { name: "So", depth: 6, response: 50 },
];

export function CoachInsightsWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={20} className="text-brand dark:text-brand-light" />
        <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">Coach Insights</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 mb-2">
            <MessageSquare size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Gesprächstiefe</span>
          </div>
          <div className="text-2xl font-serif text-stone-900 dark:text-stone-100 mb-1">
            Hoch
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            +24% vs letzte Woche
          </div>
        </div>
        
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 mb-2">
            <Clock size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Antwortzeit</span>
          </div>
          <div className="text-2xl font-serif text-stone-900 dark:text-stone-100 mb-1">
            2.4h
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            -45m vs letzte Woche
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Trend der Woche</h4>
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-brand dark:bg-brand-light" />
              <span className="text-stone-500 dark:text-stone-400">Tiefe</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-600" />
              <span className="text-stone-500 dark:text-stone-400">Zeit</span>
            </div>
          </div>
        </div>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1C1917" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#1C1917" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDepthDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E7E5E4" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#E7E5E4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716C' }} dy={10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 600, color: '#1C1917', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="depth" 
                stroke="currentColor" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorDepth)" 
                className="text-brand dark:text-brand-light"
              />
              <Area 
                type="monotone" 
                dataKey="response" 
                stroke="#D6D3D1" 
                strokeWidth={2}
                fillOpacity={0} 
                className="dark:stroke-stone-700"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl p-4 flex gap-3">
        <Activity size={20} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-400 mb-1">Coach Analyse</h4>
          <p className="text-xs text-amber-800/80 dark:text-amber-500/80 leading-relaxed">
            Deine Gespräche am Wochenende sind deutlich tiefgründiger. Versuche, diesen Vibe auch in die Woche mitzunehmen.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
