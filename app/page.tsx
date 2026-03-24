'use client';
import { useState, useEffect, useCallback } from 'react';
import { Item, Category, CATEGORIES, CafeUser, getStockStatus } from '@/types';
import { getSession, saveSession, clearSession } from '@/lib/auth';
import CategoryTabs from '@/components/CategoryTabs';
import ItemRow from '@/components/ItemRow';
import AddItemModal from '@/components/AddItemModal';
import LoginModal from '@/components/LoginModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { Button } from '@/components/ui/button';

const BAKERY_GROUPS: { label: string; match: (name: string) => boolean }[] = [
  { label: '크로칸슈', match: (n) => n.includes('크로칸슈') },
  { label: '쿠키슈',   match: (n) => n.includes('쿠키슈') },
  { label: '크루아상', match: (n) => n.includes('크루아상') },
  { label: '소금빵',   match: (n) => ['소금빵', '소금식빵', '팥식빵', '말차 식빵', '모찌 식빵'].some(k => n === k || n.includes(k)) },
  { label: '청크',     match: (n) => n.includes('청크') },
  { label: '도넛',     match: (n) => n.includes('도넛') },
  { label: '핫도그',   match: (n) => n.includes('핫도그') },
  { label: '깨찰빵',   match: (n) => n.includes('깨찰빵') },
  { label: '베이글',   match: (n) => n.includes('베이글') },
];

function getShortName(name: string, groupLabel: string): string {
  const stripped = name.replace(groupLabel, '').trim();
  return stripped.length > 0 ? stripped : name;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('파우더');
  const [user, setUser] = useState<CafeUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/items');
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
    const session = getSession();
    if (session) setUser(session);
  }, [fetchItems]);

  const categoryItems = items.filter(i => i.category === activeCategory);
  const showOfficeStock = categoryItems.some(i => i.office_stock !== null && i.office_stock !== undefined);
  const showExpiry = ['오믈렛및마카롱', '도쿄롤', '케익'].includes(activeCategory);

  const sortedItems = categoryItems;

  const handleAlertClick = (item: Item) => {
    setActiveCategory(item.category);
    setHighlightedId(item.id);
    setTimeout(() => {
      document.getElementById(`item-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => setHighlightedId(null), 2500);
  };

  const handleStockChange = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock + delta);
    setItems(prev => prev.map(i => i.id === id ? { ...i, stock: newStock } : i));
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stock: newStock }),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch('/api/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchItems();
  };

  const handleAdd = async (name: string, minQty: string, expiryDate?: string) => {
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: activeCategory,
        name,
        min_qty: minQty,
        stock: 0,
        expiry_date: expiryDate ?? null,
      }),
    });
    fetchItems();
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-pink-700" style={{ fontFamily: 'var(--font-jua)' }}>재고 관리</h1>
          <p className="text-xs text-pink-300 mt-1">카페 재고 현황</p>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-xs text-pink-500 bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-full">
                {user.name} · {user.role === 'owner' ? '오너' : '매니저'}
              </span>
              {user.role === 'owner' && (
                <Button variant="outline" size="sm" onClick={() => setShowChangePw(true)}
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 text-xs">
                  비밀번호 변경
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { clearSession(); setUser(null); }}
                className="border-pink-200 text-pink-600 hover:bg-pink-50 text-xs">
                로그아웃
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setShowLogin(true)}
              className="bg-pink-500 hover:bg-pink-600 text-white text-xs">
              로그인
            </Button>
          )}
        </div>
      </div>

      {/* 카테고리 탭 */}
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      {/* 재고 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden mb-8">
        {loading ? (
          <div className="py-16 text-center text-pink-300 text-sm">불러오는 중...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-pink-50/70 border-b border-pink-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-pink-500 uppercase tracking-wide">품목</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-pink-500 uppercase tracking-wide">최소</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-pink-500 uppercase tracking-wide">재고</th>
                {showOfficeStock && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-pink-500 uppercase tracking-wide">사무실</th>
                )}
                {showExpiry && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-pink-500 uppercase tracking-wide">유통기한</th>
                )}
                {user && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-pink-200 text-sm">품목이 없습니다</td>
                </tr>
              ) : (
                sortedItems.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    user={user}
                    showOfficeStock={showOfficeStock}
                    showExpiry={showExpiry}
                    highlighted={highlightedId === item.id}
                    onStockChange={handleStockChange}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
        {user && (
          <div className="p-4 border-t border-pink-50">
            <Button variant="outline" size="sm" onClick={() => setShowAddItem(true)}
              className="w-full border-dashed border-pink-300 text-pink-500 hover:bg-pink-50 hover:text-pink-600">
              + {activeCategory} 품목 추가
            </Button>
          </div>
        )}
      </div>

      {/* 재고 부족 알림 섹션 */}
      <div>
        <h2 className="text-lg font-bold text-pink-700 mb-3" style={{ fontFamily: 'var(--font-jua)' }}>
          재고 부족 알림
        </h2>
        <div className="flex flex-col gap-3">
          {CATEGORIES.map(category => {
            const catItems = items.filter(i => i.category === category);
            const dangerItems = catItems.filter(i => getStockStatus(i) === 'danger');
            const warningItems = catItems.filter(i => getStockStatus(i) === 'warning');
            const lowItems = [...dangerItems, ...warningItems];
            const isOk = !loading && lowItems.length === 0;

            return (
              <div key={category} className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
                {/* 카테고리 헤더 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-pink-50 bg-pink-50/50">
                  <span className="font-bold text-pink-700 text-base" style={{ fontFamily: 'var(--font-jua)' }}>
                    {category}
                  </span>
                  {!loading && isOk && (
                    <span className="text-xs text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      정상
                    </span>
                  )}
                </div>

                {/* 부족 품목 목록 (스크롤) */}
                {!isOk && !loading && (
                  <div className="max-h-52 overflow-y-auto divide-y divide-pink-50">
                    {category === '베이커리' ? (
                      <>
                        {BAKERY_GROUPS.map(group => {
                          const groupItems = lowItems.filter(i => group.match(i.name));
                          if (groupItems.length === 0) return null;
                          return (
                            <div key={group.label} className="flex items-start gap-3 px-4 py-2.5 hover:bg-pink-50/40 transition-colors">
                              <span className="text-xs font-bold text-gray-500 w-14 shrink-0 pt-0.5">{group.label}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {groupItems.map(item => {
                                  const isDanger = getStockStatus(item) === 'danger';
                                  return (
                                    <button
                                      key={item.id}
                                      onClick={() => handleAlertClick(item)}
                                      className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-colors ${
                                        isDanger
                                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                      }`}
                                    >
                                      {getShortName(item.name, group.label)} ({item.stock})
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {lowItems.filter(i => !BAKERY_GROUPS.some(g => g.match(i.name))).map(item => {
                          const isDanger = getStockStatus(item) === 'danger';
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleAlertClick(item)}
                              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-pink-50/40 transition-colors ${isDanger ? 'bg-red-50/30' : 'bg-yellow-50/30'}`}
                            >
                              <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDanger ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                재고 {item.stock}
                              </span>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {dangerItems.map(item => (
                          <div key={item.id} onClick={() => handleAlertClick(item)}
                            className="flex items-center justify-between px-4 py-2.5 bg-red-50/40 cursor-pointer hover:bg-red-100/60 transition-colors">
                            <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">최소 {item.min_qty}</span>
                              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">재고 {item.stock}</span>
                            </div>
                          </div>
                        ))}
                        {warningItems.map(item => (
                          <div key={item.id} onClick={() => handleAlertClick(item)}
                            className="flex items-center justify-between px-4 py-2.5 bg-yellow-50/40 cursor-pointer hover:bg-yellow-100/60 transition-colors">
                            <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">최소 {item.min_qty}</span>
                              <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{item.stock} / {item.min_qty}</span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* 정상 */}
                {isOk && (
                  <div className="px-4 py-2.5 text-xs text-gray-400">모든 품목이 충분합니다.</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 모달들 */}
      <AddItemModal open={showAddItem} category={activeCategory}
        onClose={() => setShowAddItem(false)} onAdd={handleAdd} />
      <LoginModal open={showLogin}
        onSuccess={u => { saveSession(u); setUser(u); setShowLogin(false); }}
        onClose={() => setShowLogin(false)} />
      <ChangePasswordModal open={showChangePw} onClose={() => setShowChangePw(false)} />
    </main>
  );
}
