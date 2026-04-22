import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Item, CATEGORIES, getStockStatus } from '@/types';

async function getItems(): Promise<Item[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from('items')
    .select('*')
    .order('sort_order', { nullsFirst: false });
  return data ?? [];
}

export default async function DashboardPage() {
  const items = await getItems();

  const danger = items.filter(i => getStockStatus(i) === 'danger');
  const warning = items.filter(i => getStockStatus(i) === 'warning');
  const ok = items.filter(i => getStockStatus(i) === 'ok');

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-pink-700" style={{ fontFamily: 'var(--font-jua)' }}>
          재고 현황
        </h1>
        <Link
          href="/"
          className="text-xs text-pink-400 border border-pink-200 rounded-full px-3 py-1.5 bg-white hover:bg-pink-50 transition-colors"
        >
          메인으로
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="bg-white border border-pink-100 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-pink-700">{items.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">전체</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-red-600">{danger.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">부족</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-orange-500">{warning.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">주의</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-emerald-600">{ok.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">정상</p>
        </div>
      </div>

      {/* 카테고리별 현황 */}
      <h2 className="text-sm font-semibold text-pink-400 uppercase tracking-wider mb-3">
        카테고리별 부족 현황
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIES.map(category => {
          const catItems = items.filter(i => i.category === category);
          const dangerItems = catItems.filter(i => getStockStatus(i) === 'danger');
          const warningItems = catItems.filter(i => getStockStatus(i) === 'warning');
          const isOk = dangerItems.length === 0 && warningItems.length === 0;

          return (
            <div key={category} className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-pink-50 bg-pink-50/50">
                <span className="font-bold text-pink-700 text-sm" style={{ fontFamily: 'var(--font-jua)' }}>
                  {category}
                </span>
                {isOk && (
                  <span className="text-xs text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    정상
                  </span>
                )}
              </div>
              {isOk ? (
                <p className="px-4 py-2.5 text-xs text-gray-400">모든 품목이 충분합니다.</p>
              ) : (
                <div className="divide-y divide-pink-50">
                  {dangerItems.map(item => (
                    <Link
                      key={item.id}
                      href="/"
                      className="flex items-center justify-between px-4 py-2.5 bg-red-50/40 hover:bg-red-100/60 transition-colors"
                    >
                      <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">최소 {item.min_qty}</span>
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          재고 {item.stock}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {warningItems.map(item => (
                    <Link
                      key={item.id}
                      href="/"
                      className="flex items-center justify-between px-4 py-2.5 bg-yellow-50/40 hover:bg-yellow-100/60 transition-colors"
                    >
                      <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">최소 {item.min_qty}</span>
                        <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                          {item.stock} / {item.min_qty}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
