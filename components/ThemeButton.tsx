'use client';
import { useTheme, Theme } from './ThemeProvider';

const THEMES: { id: Theme; icon: string; label: string }[] = [
  { id: 'pink', icon: '💗', label: '핑크' },
  { id: 'dark', icon: '🌙', label: '다크' },
];

export default function ThemeButton() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 bg-white border border-pink-200 rounded-xl p-1 theme-button-wrap">
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={`${t.label} 테마`}
          className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-all ${
            theme === t.id
              ? 'bg-pink-100 shadow-sm'
              : 'hover:bg-pink-50'
          }`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
