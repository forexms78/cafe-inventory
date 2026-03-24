'use client';
import { CATEGORIES, Category } from '@/types';

interface Props {
  active: Category;
  onChange: (c: Category) => void;
}

export default function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 ${
            active === cat
              ? 'bg-pink-500 text-white shadow-sm shadow-pink-200'
              : 'bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
