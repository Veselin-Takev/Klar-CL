import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { hapticFeedback, HAPTIC_PATTERNS } from '../lib/haptics';

export function ThemeSettingsWidget() {
  const [themePref, setThemePref] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') setThemePref('dark');
    else if (stored === 'light') setThemePref('light');
    else setThemePref('system');
  }, []);

  const handleThemeChange = (pref: 'light' | 'dark' | 'system') => {
    hapticFeedback(HAPTIC_PATTERNS.LIGHT_TAP);
    setThemePref(pref);
    
    if (pref === 'system') {
      localStorage.removeItem('theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      localStorage.setItem('theme', pref);
      if (pref === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // In a real app with Firestore:
    // try {
    //   await updateDoc(doc(db, "users", userId), { themePreference: pref });
    // } catch(e) {}
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand/10 dark:bg-brand-light/10 flex items-center justify-center text-brand dark:text-brand-light">
          <Palette size={20} />
        </div>
        <div>
          <h3 className="font-medium">Erscheinungsbild</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Hell, Dunkel oder Systemstandard</p>
        </div>
      </div>
      
      <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl">
        <button
          onClick={() => handleThemeChange('light')}
          className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-colors ${themePref === 'light' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
        >
          <Sun size={18} />
          <span className="text-xs font-medium">Hell</span>
        </button>
        <button
          onClick={() => handleThemeChange('dark')}
          className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-colors ${themePref === 'dark' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
        >
          <Moon size={18} />
          <span className="text-xs font-medium">Dunkel</span>
        </button>
        <button
          onClick={() => handleThemeChange('system')}
          className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-colors ${themePref === 'system' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
        >
          <Monitor size={18} />
          <span className="text-xs font-medium">System</span>
        </button>
      </div>
    </div>
  );
}
