import { useState, useEffect } from 'react';
import { Lightbulb, Utensils, Sun, CloudRain } from 'lucide-react';

export function SmartVorschlaegeWidget() {
  const [nextDate, setNextDate] = useState<any>(null);
  const [weather, setWeather] = useState<'sun' | 'rain'>('sun');

  useEffect(() => {
    const saved = localStorage.getItem('klar_planned_dates');
    setWeather(Math.random() > 0.5 ? 'sun' : 'rain');
    if (saved) {
      try {
        const dates = JSON.parse(saved);
        const now = new Date();
        const futureDates = dates.filter((d: any) => new Date(d.date).getTime() > now.getTime());
        if (futureDates.length > 0) {
          futureDates.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setNextDate(futureDates[0]);
        }
      } catch(e) {}
    }
  }, []);

  const hour = nextDate ? new Date(nextDate.date).getHours() : new Date().getHours();
  let timeContext = '';
  let icon = <Lightbulb size={20} className="text-amber-500" />;
  
  if (nextDate) {
    if (hour < 12) {
      timeContext = `Dein Vormittags-Date mit ${nextDate.matchName} steht an. Ort: ${nextDate.idea}. ${weather === 'rain' ? 'Es soll regnen, pack einen Schirm ein!' : 'Die Sonne scheint, perfektes Wetter!'}`;
      icon = weather === 'rain' ? <CloudRain size={20} className="text-blue-500" /> : <Sun size={20} className="text-amber-500" />;
    } else if (hour < 18) {
      timeContext = `Nachmittags-Date mit ${nextDate.matchName} (${nextDate.idea}). ${weather === 'rain' ? 'Vielleicht lieber nach drinnen verlagern wegen Regen?' : 'Perfektes Wetter für einen Spaziergang!'}`;
      icon = weather === 'rain' ? <CloudRain size={20} className="text-blue-500" /> : <Sun size={20} className="text-amber-500" />;
    } else {
      timeContext = `Dein Abend-Date mit ${nextDate.matchName} (${nextDate.idea}). ${weather === 'rain' ? 'Es wird nass, nimm eine Jacke mit.' : 'Klarer Himmel für heute Abend.'}`;
      icon = <Utensils size={20} className="text-indigo-400" />;
    }
  } else {
    timeContext = 'Kein anstehendes Date gefunden. Zeit, den Date-Planer zu füllen!';
    icon = <Lightbulb size={20} className="text-amber-500" />;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-900 border border-amber-100 dark:border-stone-700 rounded-2xl p-5 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="font-semibold text-stone-800 dark:text-stone-200">Smart-Tipp</h3>
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{timeContext}</p>
    </div>
  );
}
