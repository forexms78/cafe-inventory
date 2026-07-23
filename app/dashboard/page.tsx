import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getDb } from '@/lib/db';
import { Item, CATEGORIES, getStockStatus } from '@/types';

export const dynamic = 'force-dynamic';

async function getItems(): Promise<Item[]> {
  try {
    const { results } = await getDb()
      .prepare('SELECT * FROM items ORDER BY sort_order NULLS LAST')
      .all<Item>();
    return results;
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const items = await getItems();

  const danger = items.filter(i => getStockStatus(i) === 'danger');
  const warning = items.filter(i => getStockStatus(i) === 'warning');
  const ok = items.filter(i => getStockStatus(i) === 'ok');

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      {/* 헤더 — 탭바가 페이지 이동을 담당하므로 "메인으로" 링크 없음 */}
      <div className="flex items-end justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-pink-700 theme-title theme-jua">
          현황
        </h1>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' })} 기준
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm py-16 text-center px-4">
          <p className="text-sm text-gray-400">아직 등록된 품목이 없습니다</p>
          <p className="text-xs text-gray-300 mt-1">재고 탭에서 품목을 추가해 보세요</p>
        </div>
      ) : (
      <>
      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="bg-white border border-pink-100 rounded-2xl py-3 text-center shadow-sm">
          <p className="text-xl font-bold text-pink-700">{items.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">전체</p>
        </div>
        {/* V-C: 부족 타일만 틴트+보더 1순위 강조 — 나머지는 수치 색만 */}
        <div className="bg-red-50 border border-red-200 rounded-2xl py-3 text-center shadow-sm">
          <p className="text-xl font-bold text-red-600">{danger.length}</p>
          <p className="text-xs text-red-600 mt-0.5">부족</p>
        </div>
        <div className="bg-white border border-pink-100 rounded-2xl py-3 text-center shadow-sm">
          <p className="text-xl font-bold text-yellow-600">{warning.length}</p>
          <p className="text-xs text-yellow-600 mt-0.5">주의</p>
        </div>
        <div className="bg-white border border-pink-100 rounded-2xl py-3 text-center shadow-sm">
          <p className="text-xl font-bold text-emerald-600">{ok.length}</p>
          <p className="text-xs text-emerald-600 mt-0.5">정상</p>
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

          const countLabel = [
            dangerItems.length > 0 && `부족 ${dangerItems.length}`,
            warningItems.length > 0 && `주의 ${warningItems.length}`,
          ].filter(Boolean).join(' · ');

          return (
            <div key={category} className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-pink-50 bg-pink-50/50">
                <span className="font-bold text-pink-700 text-sm truncate min-w-0 theme-jua">
                  {category}
                </span>
                {isOk ? (
                  <span className="text-xs text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                    정상
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 shrink-0">{countLabel}</span>
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
                      className="relative flex items-center justify-between gap-2 px-4 py-2.5 min-h-11 bg-white hover:bg-pink-50 transition-colors"
                    >
                      {/* V-C 이중 표기 — 좌측 상태 바 + 수치 색 (행 배경은 화이트 유지) */}
                      <span aria-hidden="true" className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-red-400" />
                      <span className="text-sm text-gray-800 font-medium truncate min-w-0">{item.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">최소 {item.min_qty}</span>
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          재고 {item.stock}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </Link>
                  ))}
                  {warningItems.map(item => (
                    <Link
                      key={item.id}
                      href="/"
                      className="relative flex items-center justify-between gap-2 px-4 py-2.5 min-h-11 bg-white hover:bg-pink-50 transition-colors"
                    >
                      <span aria-hidden="true" className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-yellow-400" />
                      <span className="text-sm text-gray-800 font-medium truncate min-w-0">{item.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">최소 {item.min_qty}</span>
                        <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                          {item.stock} / {item.min_qty}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>
      )}
    </main>
  );
}
