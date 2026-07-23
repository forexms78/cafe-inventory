'use client';
import { Item, getStockStatus } from '@/types';
import { TriangleAlert, CircleCheck } from 'lucide-react';

interface Props {
  items: Item[];
  loading: boolean;
  onSelect: (item: Item) => void;
}

const totalStock = (i: Item) => i.stock + (i.pantry_stock ?? 0) + (i.office_stock ?? 0);

// 부족·주의 요약 스트립 — 로딩/0건/칩 모두 같은 h-11 슬롯이라 레이아웃 밀림 없음
export default function LowStockBanner({ items, loading, onSelect }: Props) {
  const danger = items.filter(i => getStockStatus(i) === 'danger');
  const warning = items.filter(i => getStockStatus(i) === 'warning');

  return (
    <div className="h-11 mb-4">
      {loading ? (
        <div className="flex gap-2 overflow-hidden" aria-hidden="true">
          <span className="h-11 w-24 rounded-xl bg-pink-100 animate-pulse shrink-0" />
          <span className="h-11 w-32 rounded-xl bg-pink-100 animate-pulse shrink-0" />
          <span className="h-11 w-28 rounded-xl bg-pink-100 animate-pulse shrink-0" />
        </div>
      ) : danger.length === 0 && warning.length === 0 ? (
        <p className="h-11 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <CircleCheck className="w-4 h-4 shrink-0" />
          모든 품목 정상
        </p>
      ) : (
        <div className="flex gap-2 h-11 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* V-C 카운트 칩 — 잉크 채움 */}
          <span className="h-11 px-4 rounded-xl bg-gray-800 text-white flex items-center gap-1.5 text-[13px] font-bold shrink-0 whitespace-nowrap">
            <TriangleAlert className="w-4 h-4 shrink-0" />
            {[
              danger.length > 0 && `부족 ${danger.length}`,
              warning.length > 0 && `주의 ${warning.length}`,
            ].filter(Boolean).join(' · ')}
          </span>
          {danger.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              aria-label={`${item.name} 재고 ${totalStock(item)} — 품목으로 이동`}
              className="h-11 px-3.5 rounded-xl bg-red-50 flex items-center gap-2 text-[13px] shrink-0 whitespace-nowrap hover:brightness-95 transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-[2px] bg-red-400 shrink-0" />
              <span className="font-semibold text-red-600">{item.name}</span>
              <span className="font-bold text-red-600 tabular-nums">{totalStock(item)}</span>
            </button>
          ))}
          {warning.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              aria-label={`${item.name} 재고 ${totalStock(item)} — 품목으로 이동`}
              className="h-11 px-3.5 rounded-xl bg-yellow-50 flex items-center gap-2 text-[13px] shrink-0 whitespace-nowrap hover:brightness-95 transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-[2px] bg-yellow-400 shrink-0" />
              <span className="font-semibold text-yellow-600">{item.name}</span>
              <span className="font-bold text-yellow-600 tabular-nums">{totalStock(item)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
