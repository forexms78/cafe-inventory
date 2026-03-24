import { Item, getStockStatus } from '@/types';

interface Props { items: Item[] }

export default function LowStockBanner({ items }: Props) {
  const dangerItems = items.filter(i => getStockStatus(i) === 'danger');
  const warningItems = items.filter(i => getStockStatus(i) === 'warning');
  const lowItems = [...dangerItems, ...warningItems];

  if (lowItems.length === 0) return null;

  return (
    <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">⚠️</span>
        <p className="text-pink-700 font-semibold text-sm">
          재고 부족 알림 — 총 {lowItems.length}개 품목
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {dangerItems.map(item => (
          <span key={item.id} className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700 border border-red-200">
            🔴 {item.name} (재고 {item.stock})
          </span>
        ))}
        {warningItems.map(item => (
          <span key={item.id} className="text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
            🟡 {item.name} ({item.stock}/{item.min_qty})
          </span>
        ))}
      </div>
    </div>
  );
}
