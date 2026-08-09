import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { hapticFeedback, HAPTIC_PATTERNS } from '../lib/haptics';
import { motion } from 'motion/react';

export function QuickThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial state
    const isDarkNow = document.documentElement.classList.contains('dark');
    setIsDark(isDarkNow);
    
    // Optional observer if it changes from outside
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    hapticFeedback(HAPTIC_PATTERNS.LIGHT_TAP);
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="fixed bottom-24 left-6 z-40 bg-white/90 dark:bg-stone-800/90 backdrop-blur-md border border-stone-200 dark:border-stone-700 shadow-lg w-12 h-12 rounded-full flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors"
      title="Hell-/Dunkelmodus wechseln"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </motion.button>
  );
}
