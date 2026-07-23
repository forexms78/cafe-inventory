'use client';
import { Croissant, Heart, Moon, Sparkles } from 'lucide-react';
import { useTheme, Theme } from './ThemeProvider';

const THEMES: { id: Theme; Icon?: typeof Heart; label: string; img?: string }[] = [
  { id: 'default', Icon: Sparkles, label: '기본' },
  { id: 'pink', Icon: Heart, label: '핑크' },
  { id: 'bakery', Icon: Croissant, label: '베이커리' },
  { id: 'dark', Icon: Moon, label: '다크' },
  { id: 'usagi', label: '우사기', img: '/themes/usagi-main.webp' },
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
          ) : t.Icon ? (
            <t.Icon className="w-4 h-4 text-pink-500" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
