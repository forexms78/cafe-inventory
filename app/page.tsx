'use client';
import { useState, useEffect, useCallback } from 'react';
import { Item, Category, CATEGORIES, CafeUser, getStockStatus } from '@/types';
import { getSession, saveSession, clearSession } from '@/lib/auth';
import LowStockBanner from '@/components/LowStockBanner';
import CategoryTabs from '@/components/CategoryTabs';
import ItemRow from '@/components/ItemRow';
import QuantityModal from '@/components/QuantityModal';
import AddItemModal from '@/components/AddItemModal';
import LoginModal from '@/components/LoginModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('파우더');
  const [user, setUser] = useState<CafeUser | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const sortedItems = [...categoryItems].sort((a, b) => {
    const order = { danger: 0, warning: 1, ok: 2 };
    return order[getStockStatus(a)] - order[getStockStatus(b)];
  });

  const handleSaveStock = async (id: string, stock: number, officeStock?: number) => {
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stock, office_stock: officeStock }),
    });
    fetchItems();
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
          <h1 className="text-2xl font-bold text-pink-700">재고 관리</h1>
          <p className="text-xs text-pink-400 mt-0.5">카페 재고 현황</p>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-xs text-pink-500 bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-full">
                {user.name} · {user.role === 'owner' ? '오너' : '매니저'}
              </span>
              {user.role === 'owner' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangePw(true)}
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 text-xs"
                >
                  비밀번호 변경
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => { clearSession(); setUser(null); }}
                className="border-pink-200 text-pink-600 hover:bg-pink-50 text-xs"
              >
                로그아웃
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowLogin(true)}
              className="bg-pink-500 hover:bg-pink-600 text-white text-xs"
            >
              로그인
            </Button>
          )}
        </div>
      </div>

      {/* 재고 부족 알림 배너 */}
      <LowStockBanner items={items} />

      {/* 카테고리 탭 */}
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      {/* 재고 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
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
                  <td colSpan={6} className="py-12 text-center text-pink-200 text-sm">
                    품목이 없습니다
                  </td>
                </tr>
              ) : (
                sortedItems.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    user={user}
                    showOfficeStock={showOfficeStock}
                    showExpiry={showExpiry}
                    onEdit={setEditingItem}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        )}

        {user && (
          <div className="p-4 border-t border-pink-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddItem(true)}
              className="w-full border-dashed border-pink-300 text-pink-500 hover:bg-pink-50 hover:text-pink-600"
            >
              + {activeCategory} 품목 추가
            </Button>
          </div>
        )}
      </div>

      {/* 모달들 */}
      <QuantityModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveStock}
      />
      <AddItemModal
        open={showAddItem}
        category={activeCategory}
        onClose={() => setShowAddItem(false)}
        onAdd={handleAdd}
      />
      <LoginModal
        open={showLogin}
        onSuccess={u => { saveSession(u); setUser(u); setShowLogin(false); }}
        onClose={() => setShowLogin(false)}
      />
      <ChangePasswordModal
        open={showChangePw}
        onClose={() => setShowChangePw(false)}
      />
    </main>
  );
}
