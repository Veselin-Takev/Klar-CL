// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Battery, BatteryMedium, BatteryLow, BatteryCharging, HeartPulse } from 'lucide-react';

export function SocialEnergyWidget() {
  const [energyLevel, setEnergyLevel] = useState(100);
  const [suggestion, setSuggestion] = useState("Voll aufgeladen! Ein perfekter Tag für neue Verbindungen.");
  const [powerSavingMode, setPowerSavingMode] = useState(false);
  const [powerSavingUntil, setPowerSavingUntil] = useState<number | null>(null);

  useEffect(() => {
    // We calculate the energy based on the date history
    const saved = localStorage.getItem("klar_date_history");
    if (saved) {
      try {
        const history = JSON.parse(saved);
        // Let's assume dates in the last 14 days drain energy
        const now = new Date();
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        let datesRecent = 0;
        
        // This is a naive implementation since date strings might vary,
        // but we'll try to find dates within 14 days. Or we just count total dates if it's a small array
        // We'll simulate it by looking at length for the MVP
        datesRecent = history.length;
        
        let newEnergy = 100 - (datesRecent * 15);
        
        const savedPowerSaving = localStorage.getItem("klar_power_saving_until");
        if (savedPowerSaving) {
          const until = parseInt(savedPowerSaving);
          if (until > Date.now()) {
            setPowerSavingMode(true);
            setPowerSavingUntil(until);
          } else {
            localStorage.removeItem("klar_power_saving_until");
          }
        }
        if (newEnergy < 20) newEnergy = 20; // min 20%
        
        setEnergyLevel(newEnergy);
        
        if (newEnergy > 80) {
          setSuggestion("Hohe soziale Energie! Du bist bereit, neue Leute kennenzulernen und offene Gespräche zu führen.");
        } else if (newEnergy > 40) {
          setSuggestion("Gute Balance. Ein Date am Wochenende wäre super, aber nimm dir auch Zeit für dich.");
        } else {
          setSuggestion("Deine soziale Batterie ist niedrig. Mache eine Dating-Pause für mentale Gesundheit. Mach etwas für dich!");
        }
      } catch (e) {}
    }
  }, []);

  
  const togglePowerSaving = () => {
    if (powerSavingMode) {
      setPowerSavingMode(false);
      setPowerSavingUntil(null);
      localStorage.removeItem("klar_power_saving_until");
    } else {
      setPowerSavingMode(true);
      const until = Date.now() + 48 * 60 * 60 * 1000;
      setPowerSavingUntil(until);
      localStorage.setItem("klar_power_saving_until", until.toString());
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-sm">
          <HeartPulse size={16} className="text-brand dark:text-brand-light" />
          Soziale Energie
        </h4>
        <div className="flex items-center gap-1 text-xs font-bold text-stone-500">
          {energyLevel > 80 ? (
            <Battery size={16} className="text-emerald-500" />
          ) : energyLevel > 40 ? (
            <BatteryMedium size={16} className="text-amber-500" />
          ) : (
            <BatteryLow size={16} className="text-rose-500" />
          )}
          {energyLevel}%
        </div>
      </div>
      
      {/* Battery bar */}
      <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${energyLevel > 80 ? 'bg-emerald-500' : energyLevel > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
          style={{ width: `${energyLevel}%` }}
        ></div>
      </div>
      
      <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
        {suggestion}
      </p>
    
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-stone-700 dark:text-stone-300">Energiespar-Modus</span>
          <span className="text-[9px] text-stone-500">
            {powerSavingMode 
              ? `Aktiv bis ${new Date(powerSavingUntil || 0).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} Uhr` 
              : 'Reduziert Benachrichtigungen'}
          </span>
        </div>
        <button 
          onClick={togglePowerSaving}
          className={`w-9 h-5 rounded-full relative transition-colors ${powerSavingMode ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${powerSavingMode ? 'left-4.5 translate-x-[18px]' : 'left-0.5 translate-x-0'}`} />
        </button>
      </div>
    </div>
  );
}
