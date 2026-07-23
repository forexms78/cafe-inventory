'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'default' | 'pink' | 'bakery' | 'dark' | 'usagi';

const THEMES: Theme[] = ['default', 'pink', 'bakery', 'dark', 'usagi'];

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: 'default', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default');

  useEffect(() => {
    // 저장값 마이그레이션: 구 기본 스킨을 저장한 'pink'는 그대로 유효 →
    // V-A 핑크 리파인으로 렌더. 미저장·이상값만 'default'(V-C)로.
    const saved = localStorage.getItem('cafe-theme') as Theme | null;
    const valid: Theme = saved && THEMES.includes(saved) ? saved : 'default';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage는 클라이언트 마운트 후에만 접근 가능
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
