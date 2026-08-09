import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';

export const HapticIntensityToggle: React.FC = () => {
  const [hapticIntensity, setHapticIntensity] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('klar_haptic_intensity');
      if (stored !== null) return parseInt(stored, 10);
      
      const oldSetting = localStorage.getItem('klar_haptic_feedback');
      if (oldSetting === 'Off') return 0;
      if (oldSetting === 'Low') return 50;
      return 100;
    }
    return 100;
  });

  const updateHapticIntensity = (value: number) => {
    setHapticIntensity(value);
    localStorage.setItem('klar_haptic_intensity', value.toString());
    if (value > 0) {
      import('../lib/haptics').then(({ hapticFeedback }) => hapticFeedback(50));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Smartphone size={20} className="text-stone-500 dark:text-stone-400" />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Haptisches Feedback
            </span>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400 ml-8 mt-0.5">Vibrationen in der App anpassen</span>
        </div>
        <button 
          onClick={() => updateHapticIntensity(hapticIntensity > 0 ? 0 : 50)}
          className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${hapticIntensity > 0 ? 'bg-brand dark:bg-brand-light' : 'bg-stone-300 dark:bg-stone-600'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${hapticIntensity > 0 ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
      
      {hapticIntensity > 0 && (
        <div className="flex flex-col gap-2 ml-8 mt-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-medium text-stone-500">Intensität</span>
            <span className="text-xs font-bold text-stone-500">{hapticIntensity}%</span>
          </div>
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs text-stone-400">Schwach</span>
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="10"
              value={hapticIntensity} 
              onChange={(e) => updateHapticIntensity(parseInt(e.target.value, 10))}
              className="flex-1 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brand dark:accent-brand-light"
            />
            <span className="text-xs text-stone-400">Stark</span>
          </div>
        </div>
      )}
    </div>
  );
};
