import React, { useState, useEffect } from 'react';
import { Vibrate, Volume2, RotateCcw, Play, Sun, Moon, Monitor, Palette } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export const HapticSettings: React.FC = () => {
  const [intensity, setIntensity] = useState<number>(100);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [patternType, setPatternType] = useState<string>('medium');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });

  const updateTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new Event('themechange'));
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    triggerHaptic('LIGHT_TAP');
  };

  useEffect(() => {
    const storedIntensity = localStorage.getItem('klar_haptic_intensity');
    if (storedIntensity !== null) {
      setIntensity(parseInt(storedIntensity, 10));
    }
    const storedEnabled = localStorage.getItem('klar_haptic_enabled');
    if (storedEnabled !== null) {
      setIsEnabled(storedEnabled === 'true');
    }
    const storedPattern = localStorage.getItem('klar_haptic_pattern');
    if (storedPattern) {
      setPatternType(storedPattern);
    }
  }, []);

  const handleIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setIntensity(val);
    localStorage.setItem('klar_haptic_intensity', val.toString());
  };

  const toggleEnabled = () => {
    const newVal = !isEnabled;
    setIsEnabled(newVal);
    localStorage.setItem('klar_haptic_enabled', newVal.toString());
  };

  const handlePatternChange = (type: string) => {
    setPatternType(type);
    localStorage.setItem('klar_haptic_pattern', type);
    setTimeout(() => {
      triggerHaptic('LIGHT_TAP');
    }, 100);
  };

  const resetToDefault = () => {
    setIntensity(50);
    setIsEnabled(true);
    setPatternType('medium');
    localStorage.setItem('klar_haptic_intensity', '50');
    localStorage.setItem('klar_haptic_enabled', 'true');
    localStorage.setItem('klar_haptic_pattern', 'medium');
  };

  const testVibration = () => {
    triggerHaptic('LIGHT_TAP');
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light rounded-full flex items-center justify-center">
            <Vibrate size={20} />
          </div>
          <div>
            <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">Haptisches Feedback</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Vibration für Aktionen</p>
          </div>
        </div>
        <button 
          onClick={toggleEnabled}
          className={`w-12 h-6 rounded-full transition-colors relative ${isEnabled ? 'bg-brand dark:bg-brand-light' : 'bg-stone-200 dark:bg-stone-700'}`}
        >
          <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </button>
      </div>

      {isEnabled && (
        <>
          <div className="mb-6">
            <p className="text-sm text-stone-700 dark:text-stone-300 mb-3 font-medium">Muster</p>
            <div className="flex gap-2">
              <select
                value={patternType}
                onChange={(e) => handlePatternChange(e.target.value)}
                className="w-full bg-stone-100 dark:bg-stone-800 border-none text-stone-700 dark:text-stone-300 rounded-xl py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-brand focus:outline-none appearance-none"
              >
                <option value="soft">Soft</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-stone-700 dark:text-stone-300 mb-3 font-medium">Intensität</p>
            <div className="flex items-center gap-4">
              <Volume2 size={16} className="text-stone-400 shrink-0 opacity-50" />
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="10"
                value={intensity}
                onChange={handleIntensityChange}
                className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brand dark:accent-brand-light"
              />
              <Vibrate size={20} className="text-stone-500 shrink-0" />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-stone-400 font-medium">
              <span>Aus</span>
              <span>Mittel</span>
              <span>Max</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={testVibration}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand dark:bg-brand-light text-white rounded-xl font-medium hover:opacity-90 transition-opacity text-sm"
            >
              <Play size={16} />
              Test Vibration
            </button>
            <button
              onClick={resetToDefault}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-sm"
            >
              <RotateCcw size={16} />
              Reset to Default
            </button>
          </div>
        </>
      )}

      <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light rounded-full flex items-center justify-center">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">Theme Settings</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Erscheinungsbild anpassen</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => updateTheme('light')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${theme === 'light' ? 'bg-brand/10 dark:bg-brand-light/10 border-brand/20 dark:border-brand-light/20 text-brand dark:text-brand-light' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
          >
            <Sun size={18} className="mx-auto mb-2" />
            Hell
          </button>
          <button 
            onClick={() => updateTheme('dark')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${theme === 'dark' ? 'bg-brand/10 dark:bg-brand-light/10 border-brand/20 dark:border-brand-light/20 text-brand dark:text-brand-light' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
          >
            <Moon size={18} className="mx-auto mb-2" />
            Dunkel
          </button>
          <button 
            onClick={() => updateTheme('system')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${theme === 'system' ? 'bg-brand/10 dark:bg-brand-light/10 border-brand/20 dark:border-brand-light/20 text-brand dark:text-brand-light' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
          >
            <Monitor size={18} className="mx-auto mb-2" />
            System
          </button>
        </div>
      </div>

    </div>
  );
};
