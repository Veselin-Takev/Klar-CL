import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const localTheme = localStorage.getItem('klar_theme') as Theme | null;
    if (localTheme) return localTheme;
  }
  return 'system';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  
  if (typeof window !== 'undefined') {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
          // Load user theme preference
          getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
            if (docSnap.exists() && docSnap.data().theme) {
              setThemeState(docSnap.data().theme as Theme);
            }
          });
        } else {
          setUserId(null);
          // Load local theme preference
          const localTheme = localStorage.getItem('klar_theme') as Theme | null;
          if (localTheme) {
            setThemeState(localTheme);
          }
        }
      });
      return unsubscribe;
    } catch (e) {
      console.warn("Firebase not fully initialized yet", e);
      // Fallback for no firebase
      const localTheme = localStorage.getItem('klar_theme') as Theme | null;
      if (localTheme) {
        setThemeState(localTheme);
      }
    }
  }, []);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('klar_theme', newTheme);
    
    if (userId) {
      try {
        await setDoc(doc(db, 'users', userId), { theme: newTheme }, { merge: true });
      } catch (e) {
        console.warn("Could not save theme to Firestore", e);
      }
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return { theme: 'system' as Theme, setTheme: () => {} }; // Fallback
  }
  return context;
};
