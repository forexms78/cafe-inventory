'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'pink' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: 'pink', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('pink');

  useEffect(() => {
    const saved = localStorage.getItem('cafe-theme') as Theme | null;
    const valid: Theme = (saved === 'pink' || saved === 'dark') ? saved : 'pink';
    setThemeState(valid);
    document.documentElement.setAttribute('data-theme', valid);
    document.documentElement.classList.toggle('dark', valid === 'dark');
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('cafe-theme', t);
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
