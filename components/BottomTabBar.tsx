'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, ChartPie, History, Menu } from 'lucide-react';
import { Item, getStockStatus } from '@/types';

const TABS = [
  { href: '/', label: '재고', Icon: Package },
  { href: '/dashboard', label: '현황', Icon: ChartPie },
  { href: '/logs', label: '기록', Icon: History },
  { href: '/menu', label: '메뉴', Icon: Menu },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();
  // null = 로딩 중(배지 숨김 — 배지는 absolute라 레이아웃 밀림 없음)
  const [lowCount, setLowCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchLowCount = () => {
      fetch('/api/items', { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : []))
        .then((data: Item[]) => {
          if (!cancelled && Array.isArray(data)) {
            setLowCount(data.filter(i => getStockStatus(i) === 'danger').length);
          }
        })
        .catch(() => {}); // 실패 시 배지만 생략 — 탭바 자체는 정상 동작
    };
    fetchLowCount();
    // app/page.tsx와 동일한 갱신 패턴 — 30초 인터벌 + 탭 복귀 시 즉시
    const id = setInterval(fetchLowCount, 30_000);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchLowCount(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pathname]); // 경로 이동 시에도 재조회

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-pink-100 lg:inset-y-0 lg:left-0 lg:right-auto lg:w-20 lg:border-t-0 lg:border-r"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-4 max-w-4xl mx-auto lg:grid-cols-1 lg:gap-1 lg:pt-6 lg:px-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`h-14 flex flex-col items-center justify-center gap-0.5 lg:h-16 transition-colors ${
                active ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'
              }`}
            >
              <span
                className={`relative w-12 h-6 flex items-center justify-center rounded-full ${
                  active ? 'bg-pink-100' : ''
                }`}
              >
                <Icon className="w-[22px] h-[22px]" />
                {href === '/dashboard' && lowCount !== null && lowCount > 0 && (
                  <span className="absolute -top-1 right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {lowCount}
                  </span>
                )}
              </span>
              <span className={`text-[10.5px] ${active ? 'font-bold' : 'font-semibold'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
