'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import StockLogModal from '@/components/StockLogModal';
import { Item, Category, Unit, CafeUser, getStockStatus, CATEGORIES } from '@/types';
import { getSession, saveSession, clearSession } from '@/lib/auth';
import CategoryTabs from '@/components/CategoryTabs';
import ItemRow from '@/components/ItemRow';
import SortableItemRow from '@/components/SortableItemRow';
import AddItemModal from '@/components/AddItemModal';
import LoginModal from '@/components/LoginModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import MenuDrawer from '@/components/MenuDrawer';
import ThemeButton from '@/components/ThemeButton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

const CATEGORY_OFFSETS: Record<Category, number> = {
  '파우더': 0,
  '시럽': 1000,
  '이외품목': 2000,
  '베이커리': 3000,
  '오믈렛 및 마카롱': 4000,
  '도쿄롤': 5000,
  '케익': 6000,
};

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
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderItems, setReorderItems] = useState<Item[]>([]);
  const [minEditMode, setMinEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const resetSnapshotRef = useRef<{ id: string; stock: number }[]>([]);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleClickCount = useRef(0);
  const titleClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const showExpiry = ['오믈렛 및 마카롱', '도쿄롤', '케익'].includes(activeCategory);
  const sortedItems = reorderMode ? reorderItems : categoryItems;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleReorderStart = () => {
    setMinEditMode(false);
    setReorderItems([...categoryItems]);
    setReorderMode(true);
  };

  const handleMinQtyChange = async (id: string, minQty: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, min_qty: minQty } : i));
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, min_qty: minQty }),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setReorderItems(prev => {
        const oldIndex = prev.findIndex(i => i.id === active.id);
        const newIndex = prev.findIndex(i => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleReorderSave = async () => {
    const offset = CATEGORY_OFFSETS[activeCategory];
    const updates = reorderItems.map((item, index) => ({
      id: item.id,
      sort_order: offset + index,
    }));
    await Promise.all(updates.map(u =>
      fetch('/api/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, sort_order: u.sort_order }),
      })
    ));
    setItems(prev => {
      const updated = [...prev];
      updates.forEach(u => {
        const i = updated.findIndex(item => item.id === u.id);
        if (i !== -1) updated[i] = { ...updated[i], sort_order: u.sort_order };
      });
      return updated.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    });
    setReorderMode(false);
  };

  const handleTitleClick = () => {
    titleClickCount.current += 1;
    if (titleClickTimer.current) clearTimeout(titleClickTimer.current);
    if (titleClickCount.current >= 3) {
      titleClickCount.current = 0;
      setShowLogModal(true);
    } else {
      titleClickTimer.current = setTimeout(() => {
        titleClickCount.current = 0;
      }, 2000);
    }
  };

  const searchResults = searchQuery.trim().length > 0
    ? items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSelect = (item: Item) => {
    setSearchQuery('');
    setSearchOpen(false);
    setActiveCategory(item.category);
    setHighlightedId(item.id);
    setTimeout(() => {
      document.getElementById(`item-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => setHighlightedId(null), 2500);
  };

  const handleAlertClick = (item: Item) => {
    setActiveCategory(item.category);
    setHighlightedId(item.id);
    setTimeout(() => {
      document.getElementById(`item-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => setHighlightedId(null), 2500);
  };

  const handleStockChange = async (id: string, field: 'stock' | 'pantry_stock' | 'office_stock', value: number) => {
    const prev = items.find(i => i.id === id)?.[field] ?? 0;
    setItems(current => current.map(i => i.id === id ? { ...i, [field]: value } : i));

    const patchItem = async (): Promise<Item | null> => {
      const res = await fetch('/api/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });
      if (!res.ok) return null;
      return res.json();
    };

    let saved = await patchItem();

    if (!saved) {
      setItems(current => current.map(i => i.id === id ? { ...i, [field]: prev } : i));
      toast.error('저장 실패. 다시 시도해주세요.');
      return;
    }

    if (saved[field] !== value) {
      // DB에 저장된 값이 의도한 값과 다름 → 1회 재시도
      saved = await patchItem();
      if (!saved || saved[field] !== value) {
        // 재시도 후도 불일치 → DB 실제 값으로 UI 동기화 후 경고
        const dbValue = saved ? saved[field] ?? prev : prev;
        setItems(current => current.map(i => i.id === id ? { ...i, [field]: dbValue } : i));
        toast.error('저장 오류가 발생했습니다. 새로고침 후 확인해주세요.');
        return;
      }
    }

    toast.success('저장됨', { id: 'stock-save' });
    const itemName = items.find(i => i.id === id)?.name ?? id;
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        itemName,
        field,
        oldValue: prev as number,
        newValue: value,
        user: user?.name ?? '비로그인',
      }),
    }).catch(() => {});
  };

  const handleProductNameChange = async (id: string, name: string | null) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, product_name: name } : i));
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, product_name: name }),
    });
  };

  const handleExpiryChange = async (id: string, expiry: string | null) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, expiry_date: expiry } : i));
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, expiry_date: expiry }),
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

  const handleUndoReset = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    const snapshot = resetSnapshotRef.current;
    if (snapshot.length === 0) return;
    setItems(prev => prev.map(i => {
      const snap = snapshot.find(s => s.id === i.id);
      return snap ? { ...i, stock: snap.stock } : i;
    }));
    resetSnapshotRef.current = [];
    toast.success('초기화가 취소되었습니다');
  };

  const handleResetAll = () => {
    resetSnapshotRef.current = items.map(i => ({ id: i.id, stock: i.stock }));
    setItems(prev => prev.map(i => ({ ...i, stock: 0 })));
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    toast('전체 카운터 재고를 초기화했습니다', {
      duration: 15000,
      action: {
        label: '실행취소',
        onClick: handleUndoReset,
      },
    });
    undoTimerRef.current = setTimeout(async () => {
      const res = await fetch('/api/items/reset', { method: 'POST' });
      if (!res.ok) {
        const snapshot = resetSnapshotRef.current;
        setItems(prev => prev.map(i => {
          const snap = snapshot.find(s => s.id === i.id);
          return snap ? { ...i, stock: snap.stock } : i;
        }));
        toast.error('초기화 실패. 다시 시도해주세요.');
      } else {
        fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            itemName: '전체 카운터 초기화',
            field: 'bulk_reset',
            oldValue: resetSnapshotRef.current.filter(s => s.stock > 0).length,
            newValue: 0,
            user: user?.name ?? '비로그인',
          }),
        }).catch(() => {});
      }
      resetSnapshotRef.current = [];
      undoTimerRef.current = null;
    }, 15000);
  };

  const handleAdd = async (category: Category, name: string, unit: Unit, minQty: string, initialStock: number, expiryDate?: string) => {
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        name,
        unit,
        min_qty: minQty,
        stock: initialStock,
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
          <h1 className="text-4xl font-bold text-pink-700 theme-title" style={{ fontFamily: 'var(--font-jua)' }}>
            재고 관
            <span onClick={handleTitleClick} className="cursor-default select-none">리</span>
          </h1>
          <p className="text-xs text-pink-300 mt-1">디저트39 신사역점</p>
        </div>
        <div className="flex items-center gap-2">
        <ThemeButton />
        <button
          onClick={() => setShowDrawer(true)}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 active:bg-pink-100 transition-colors"
          aria-label="메뉴 열기"
        >
          <span className="block w-5 h-0.5 bg-pink-400 rounded-full" />
          <span className="block w-5 h-0.5 bg-pink-400 rounded-full" />
          <span className="block w-5 h-0.5 bg-pink-400 rounded-full" />
        </button>
        </div>
      </div>

      {/* 검색 */}
      <div ref={searchRef} className="relative mb-4">
        <input
          type="text"
          placeholder="품목 검색..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          className="w-full border border-pink-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 placeholder-pink-200"
        />
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white border border-pink-100 rounded-xl shadow-lg z-50 overflow-hidden">
            {searchResults.map(item => (
              <button
                key={item.id}
                onClick={() => handleSearchSelect(item)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-pink-50 transition-colors text-left"
              >
                <span className="font-medium text-gray-800">{item.name}</span>
                <span className="text-xs text-pink-400 bg-pink-50 px-2 py-0.5 rounded-full">{item.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 카테고리 탭 */}
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      {/* 재고 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden mb-8">
        {loading ? (
          <div className="py-16 text-center text-pink-300 text-sm">불러오는 중...</div>
        ) : (
          <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-full min-w-[500px]">
            <thead className="bg-pink-50/70 border-b border-pink-100">
              <tr>
                {reorderMode && <th className="w-8" />}
                <th className="px-4 py-3 text-left text-xs font-semibold text-pink-500 uppercase tracking-wide">품목</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-pink-500 uppercase tracking-wide">최소</th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-pink-500 uppercase tracking-wide">재고</th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-pink-500 uppercase tracking-wide">팬트리</th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-pink-500 uppercase tracking-wide">사무실</th>
                {showExpiry && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-pink-500 uppercase tracking-wide whitespace-nowrap">유통기한</th>
                )}
                {user && !reorderMode && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <SortableContext items={sortedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <tbody className="divide-y divide-pink-50">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-pink-200 text-sm">품목이 없습니다</td>
                </tr>
              ) : reorderMode ? (
                sortedItems.map(item => (
                  <SortableItemRow
                    key={item.id}
                    item={item}
                    user={user}
                    showExpiry={showExpiry}
                    onStockChange={handleStockChange}
                    onProductNameChange={handleProductNameChange}
                    onExpiryChange={handleExpiryChange}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                sortedItems.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    user={user}
                    showExpiry={showExpiry}
                    highlighted={highlightedId === item.id}
                    minEditMode={minEditMode}
                    onStockChange={handleStockChange}
                    onProductNameChange={handleProductNameChange}
                    onExpiryChange={handleExpiryChange}
                    onMinQtyChange={handleMinQtyChange}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
            </SortableContext>
          </table>
          </DndContext>
          </div>
        )}
        {reorderMode && (
          <div className="p-4 border-t border-pink-50">
            <Button size="sm" onClick={handleReorderSave}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white">
              위치변경 저장
            </Button>
          </div>
        )}
      </div>

      {/* 재고 부족 알림 섹션 */}
      <div>
        <h2 className="text-lg font-bold text-pink-700 mb-3" style={{ fontFamily: 'var(--font-jua)' }}>
          재고 부족 알림
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      {/* 전체 초기화 확인 다이얼로그 */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>전체 카운터 재고 초기화</DialogTitle>
            <DialogDescription>
              모든 카테고리의 카운터 재고를 0으로 초기화합니다.
              실행 후 15초 안에 실행취소할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              취소
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { handleResetAll(); setShowResetConfirm(false); }}
            >
              초기화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 드로어 */}
      <MenuDrawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        user={user}
        activeCategory={activeCategory}
        minEditMode={minEditMode}
        reorderMode={reorderMode}
        onAddItem={() => setShowAddItem(true)}
        onToggleMinEdit={() => setMinEditMode(v => !v)}
        onReorderStart={handleReorderStart}
        onReorderSave={handleReorderSave}
        onResetConfirm={() => setShowResetConfirm(true)}
        onChangePw={() => setShowChangePw(true)}
        onLogout={() => { clearSession(); setUser(null); }}
        onLogin={() => setShowLogin(true)}
      />

      {/* 모달들 */}
      <AddItemModal open={showAddItem} initialCategory={activeCategory}
        onClose={() => setShowAddItem(false)} onAdd={handleAdd} />
      <LoginModal open={showLogin}
        onSuccess={u => { saveSession(u); setUser(u); setShowLogin(false); }}
        onClose={() => setShowLogin(false)} />
      <ChangePasswordModal open={showChangePw} onClose={() => setShowChangePw(false)} />
      <StockLogModal open={showLogModal} onClose={() => setShowLogModal(false)} />
    </main>
  );
}
