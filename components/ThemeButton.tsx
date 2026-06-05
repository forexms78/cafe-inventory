'use client';
import { useTheme, Theme } from './ThemeProvider';

const THEMES: { id: Theme; icon: string; label: string; img?: string }[] = [
  { id: 'pink', icon: '💗', label: '핑크' },
  { id: 'dark', icon: '🌙', label: '다크' },
  { id: 'usagi', icon: '🐰', label: '우사기', img: '/themes/usagi-main.webp' },
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
          aria-pressed={theme === t.id}
          className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-all overflow-hidden ${
            theme === t.id
              ? 'bg-pink-100 shadow-sm ring-2 ring-pink-300'
              : 'hover:bg-pink-50'
          }`}
        >
          {t.img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.img} alt="" className="w-5 h-5 rounded-md object-contain bg-white" />
          ) : (
            t.icon
          )}
        </button>
      ))}
    </div>
  );
}
