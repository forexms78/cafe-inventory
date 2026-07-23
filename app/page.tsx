'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Item, Category, Unit, CafeUser, CATEGORIES } from '@/types';
import { getSession } from '@/lib/auth';
import { Plus } from 'lucide-react';
import CategoryTabs from '@/components/CategoryTabs';
import LowStockBanner from '@/components/LowStockBanner';
import ItemRow from '@/components/ItemRow';
import SortableItemRow from '@/components/SortableItemRow';
import AddItemModal from '@/components/AddItemModal';
import { useTheme } from '@/components/ThemeProvider';
import ExplosionOverlay from '@/components/ExplosionOverlay';
import { playExplosionSound } from '@/lib/sounds';
import { fireExplosion } from '@/lib/explosion';
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

export default function Home() {
  const { theme } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('파우더');
  const [user, setUser] = useState<CafeUser | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderItems, setReorderItems] = useState<Item[]>([]);
  const [minEditMode, setMinEditMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const pendingActionRef = useRef<string | null>(null);
  const resetSnapshotRef = useRef<{ id: string; stock: number }[]>([]);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [explosionPhase, setExplosionPhase] = useState<'idle' | 'exploding' | 'stress' | 'rebuilding'>('idle');
  const [rebuildProgress, setRebuildProgress] = useState(0);
  const explosionCleanupRef = useRef<(() => void) | null>(null);
  const logPendingRef = useRef<Map<string, {
    originalOldValue: number;
    latestNewValue: number;
    timer: ReturnType<typeof setTimeout>;
    fired: boolean;
    logId: string | null;
  }>>(new Map());
  const toastDismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/items', { cache: 'no-store' });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
    const session = getSession();
    if (session) setUser(session);
  }, [fetchItems]);

  // 30초마다 자동 갱신
  useEffect(() => {
    const id = setInterval(fetchItems, 30_000);
    return () => clearInterval(id);
  }, [fetchItems]);

  // 탭으로 돌아올 때 즉시 갱신
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchItems(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchItems]);

  // 폭파 이펙트 진행 중 unmount 시 타이머·캔버스 정리
  useEffect(() => {
    return () => {
      explosionCleanupRef.current?.();
      explosionCleanupRef.current = null;
    };
  }, []);

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

  // 메뉴 탭에서 넘어온 액션(?action=...) — URL은 즉시 정리하고, 품목 로드 후 1회 실행
  useEffect(() => {
    const action = new URLSearchParams(window.location.search).get('action');
    if (action) {
      pendingActionRef.current = action;
      window.history.replaceState(null, '', '/');
    }
  }, []);

  useEffect(() => {
    if (loading || !pendingActionRef.current) return;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action === 'add') setShowAddItem(true);
    else if (action === 'minEdit') setMinEditMode(true);
    else if (action === 'delete') setDeleteMode(true);
    else if (action === 'reorder') handleReorderStart();
    else if (action === 'reset') setShowResetConfirm(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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

  const handleStockChange = async (id: string, field: 'stock' | 'pantry_stock' | 'office_stock', value: number) => {
    // 초기화 후 값을 입력하면 리셋 타이머를 즉시 확정 — 타이머가 나중에 입력값을 덮어쓰는 경쟁 조건 방지
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
      resetSnapshotRef.current = [];
      fetch('/api/items/reset', { method: 'POST' }).catch(() => {});
    }

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

    const itemName = items.find(i => i.id === id)?.name ?? id;
    const fieldLabel = field === 'stock' ? '매장' : field === 'pantry_stock' ? '팬트리' : '사무실';
    const logKey = `${id}-${field}`;
    const prevValue = prev as number;

    // 연속 변경 디바운스: 1.5초 내 동일 품목+필드 변경은 한 줄로 묶음
    let pending = logPendingRef.current.get(logKey);
    const originalOldValue = pending ? pending.originalOldValue : prevValue;

    if (pending) {
      clearTimeout(pending.timer);
      pending.latestNewValue = value;
    } else {
      pending = { originalOldValue: prevValue, latestNewValue: value, timer: null!, fired: false, logId: null };
      logPendingRef.current.set(logKey, pending);
    }

    const capturedPending = pending;
    capturedPending.timer = setTimeout(async () => {
      const entry = logPendingRef.current.get(logKey);
      if (!entry) return;
      entry.fired = true;
      logPendingRef.current.delete(logKey);
      try {
        const res = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemName,
            field,
            oldValue: entry.originalOldValue,
            newValue: entry.latestNewValue,
            user: user?.name ?? '비로그인',
          }),
        });
        const data = await res.json();
        entry.logId = data.id ?? null;
      } catch {}
    }, 1500);

    const toastId = `undo-${id}-${field}`;
    const TOAST_DURATION = 5000;

    const existingTimer = toastDismissTimersRef.current.get(toastId);
    if (existingTimer) clearTimeout(existingTimer);

    const dismissTimer = setTimeout(() => {
      toast.dismiss(toastId);
      toastDismissTimersRef.current.delete(toastId);
    }, TOAST_DURATION);
    toastDismissTimersRef.current.set(toastId, dismissTimer);

    toast(`${itemName} ${fieldLabel} ${originalOldValue} → ${value}`, {
      id: toastId,
      duration: TOAST_DURATION,
      action: {
        label: '실행취소',
        onClick: () => {
          clearTimeout(toastDismissTimersRef.current.get(toastId));
          toastDismissTimersRef.current.delete(toastId);
          setItems(current => current.map(i => i.id === id ? { ...i, [field]: originalOldValue } : i));
          fetch('/api/items', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, [field]: originalOldValue }),
          }).catch(() => {});
          const cur = logPendingRef.current.get(logKey);
          if (cur && !cur.fired) {
            clearTimeout(cur.timer);
            logPendingRef.current.delete(logKey);
          } else if (capturedPending.logId) {
            fetch(`/api/logs?id=${capturedPending.logId}`, { method: 'DELETE' }).catch(() => {});
          }
          toast.success('실행취소 완료', { duration: 2000 });
        },
      },
    });
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
    await fetch('/api/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchItems();
  };

  const handleExplode = () => {
    if (explosionPhase !== 'idle') return;
    const rects = Array.from(document.querySelectorAll('[data-explodable]')).map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    });
    // 캔버스를 즉시 DOM에 삽입 — React 리렌더 대기 없음
    playExplosionSound();
    explosionCleanupRef.current = fireExplosion(rects, () => {
      setExplosionPhase('stress');
      explosionCleanupRef.current = null;
    });
    setExplosionPhase('exploding');
  };

  const handleStartRebuilding = () => {
    setExplosionPhase('rebuilding');
    setRebuildProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      const increment = Math.random() * 4 + (progress > 80 ? 0.4 : 1.5);
      progress = Math.min(100, progress + increment);
      setRebuildProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          // 폭파 시 직접 설정한 visibility:hidden 을 React가 모르므로 여기서 복원
          document.querySelectorAll('[data-explodable]').forEach(
            el => { (el as HTMLElement).style.visibility = ''; }
          );
          setExplosionPhase('idle');
          setRebuildProgress(0);
        }, 600);
      }
    }, 60);
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

  const RESET_TOAST_ID = 'reset-all-toast';
  const RESET_TOAST_DURATION = 15000;

  const handleResetAll = () => {
    resetSnapshotRef.current = items.map(i => ({ id: i.id, stock: i.stock }));
    setItems(prev => prev.map(i => ({ ...i, stock: 0 })));
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    const existingResetTimer = toastDismissTimersRef.current.get(RESET_TOAST_ID);
    if (existingResetTimer) clearTimeout(existingResetTimer);
    const resetDismissTimer = setTimeout(() => {
      toast.dismiss(RESET_TOAST_ID);
      toastDismissTimersRef.current.delete(RESET_TOAST_ID);
    }, RESET_TOAST_DURATION);
    toastDismissTimersRef.current.set(RESET_TOAST_ID, resetDismissTimer);

    toast('전체 카운터 재고를 초기화했습니다', {
      id: RESET_TOAST_ID,
      duration: RESET_TOAST_DURATION,
      action: {
        label: '실행취소',
        onClick: () => {
          clearTimeout(toastDismissTimersRef.current.get(RESET_TOAST_ID));
          toastDismissTimersRef.current.delete(RESET_TOAST_ID);
          handleUndoReset();
        },
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
    <>
      {explosionPhase === 'stress' && (
        <div className="fixed inset-0 z-[9999] bg-gray-950 flex flex-col items-center justify-center select-none">
          <style>{`
            @keyframes stress-pop {
              0%   { transform: scale(0.2) rotate(-8deg); opacity: 0; }
              55%  { transform: scale(1.18) rotate(3deg); opacity: 1; }
              75%  { transform: scale(0.94) rotate(-1deg); }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes stress-sub {
              0%   { transform: translateY(24px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes stress-btn {
              0%   { transform: translateY(32px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          <p
            className="text-pink-400 text-5xl font-bold text-center leading-tight"
            style={{ fontFamily: 'var(--font-jua)', animation: 'stress-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          >
            아가님<br/>스트레스 뿌셔!
          </p>
          <p
            className="text-white text-2xl font-bold text-center mt-5"
            style={{ fontFamily: 'var(--font-jua)', animation: 'stress-sub 0.4s ease-out 0.35s both' }}
          >
            오늘도 화이팅!
          </p>
          <button
            onClick={handleStartRebuilding}
            className="mt-10 px-8 py-4 rounded-2xl text-lg font-bold text-gray-900 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all"
            style={{ fontFamily: 'var(--font-jua)', animation: 'stress-btn 0.4s ease-out 0.7s both' }}
          >
            재건축하기
          </button>
        </div>
      )}
      <ExplosionOverlay visible={explosionPhase === 'rebuilding'} progress={rebuildProgress} />
    <main
      className="max-w-4xl mx-auto px-4 py-6 w-full"
      style={{
        // opacity는 건드리지 않음 — 카드는 cloneNode 후 개별 visibility:hidden으로 처리
        // stress/rebuilding 단계에서는 그 화면이 z-index로 전체를 덮음
        opacity: explosionPhase === 'stress' || explosionPhase === 'rebuilding' ? 0 : 1,
        pointerEvents: explosionPhase !== 'idle' ? 'none' : undefined,
        transition: 'none',
      }}
    >

      {/* 헤더 */}
      <div data-explodable className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {theme === 'usagi' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/themes/usagi-main.webp"
              alt="우사기"
              width={64}
              height={64}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain bg-white border-2 border-[#f3d2da] shadow-sm shrink-0 animate-[usagi-bounce_2.4s_ease-in-out_infinite]"
            />
          )}
          <div>
            <h1>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/dessert39-logo.svg"
                alt="DESSERT39 재고관리"
                width={270}
                height={73}
                className="brand-logo h-7 w-auto"
              />
            </h1>
            <p className="text-xs text-pink-300 mt-1">재고관리 · 신사역점</p>
          </div>
          {(user?.role === 'owner' || user?.role === 'developer') && (
            <button
              onClick={handleExplode}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-500 border border-orange-200 rounded-full bg-white hover:bg-orange-50 active:bg-orange-100 transition-colors mt-1"
            >
              폭파
            </button>
          )}
        </div>
        {user && (
          <button
            onClick={() => setShowAddItem(true)}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-pink-500 text-white shadow-sm hover:bg-pink-600 active:scale-95 transition-all"
            aria-label="품목 추가"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 검색 */}
      <div data-explodable ref={searchRef} className="relative mb-4">
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

      {/* 부족·주의 요약 스트립 — 칩 탭 시 해당 행으로 스크롤·하이라이트 */}
      <div data-explodable>
        <LowStockBanner items={items} loading={loading} onSelect={handleSearchSelect} />
      </div>

      {/* 카테고리 탭 */}
      <div data-explodable><CategoryTabs active={activeCategory} onChange={setActiveCategory} /></div>

      {/* 활성 모드 표시 + 종료 (드로어 제거로 여기서 끔) */}
      {(minEditMode || deleteMode) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {minEditMode && (
            <button
              onClick={() => setMinEditMode(false)}
              className="h-11 px-4 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold hover:bg-pink-200 transition-colors"
            >
              최소수량 수정 중 · 완료
            </button>
          )}
          {deleteMode && (
            <button
              onClick={() => setDeleteMode(false)}
              className="h-11 px-4 rounded-full bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transition-colors"
            >
              삭제 모드 켜짐 · 끄기
            </button>
          )}
        </div>
      )}

      {/* 재고 테이블 */}
      <div data-explodable className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden mb-8">
        {loading ? (
          <div className="py-16 text-center text-pink-300 text-sm">불러오는 중...</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {/* 리스트 헤더 — 행과 동일한 폭 배열 */}
            <div className="flex items-center gap-1 pl-3 pr-7 py-2 bg-pink-50/70 border-b border-pink-100 text-[11px] font-bold text-gray-400 tracking-wide">
              {reorderMode && <span className="w-7 shrink-0" />}
              <span className="flex-1 min-w-0 pl-1">품목</span>
              <span className="w-[132px] shrink-0 text-center">매장</span>
              <span className="w-11 shrink-0 text-center">팬트리</span>
              <span className="w-11 shrink-0 text-center">사무실</span>
              {user && !reorderMode && deleteMode && <span className="w-12 shrink-0" />}
            </div>
            <SortableContext items={sortedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-pink-50">
                {sortedItems.length === 0 ? (
                  <div className="py-12 text-center text-pink-200 text-sm">품목이 없습니다</div>
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
                      deleteMode={deleteMode}
                      onStockChange={handleStockChange}
                      onProductNameChange={handleProductNameChange}
                      onExpiryChange={handleExpiryChange}
                      onMinQtyChange={handleMinQtyChange}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>
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

      {/* 카테고리 인덱스 레일 — 기존 탭 상태 재사용 점프 (시안 C) */}
      {!reorderMode && (
        <nav
          aria-label="카테고리 바로가기"
          data-explodable
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 w-11 py-1 flex flex-col items-center lg:hidden"
        >
          {/* 시각 폭 32px 필, 터치 판정은 버튼 44px */}
          <span aria-hidden className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 rounded-full bg-white border border-pink-100 shadow-md" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              aria-label={cat}
              aria-current={activeCategory === cat}
              className="relative w-11 h-11 flex items-center justify-center"
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                  activeCategory === cat ? 'bg-[var(--brand)] text-white' : 'text-gray-400'
                }`}
              >
                {cat[0]}
              </span>
            </button>
          ))}
        </nav>
      )}

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

      {/* 모달들 */}
      <AddItemModal open={showAddItem} initialCategory={activeCategory}
        onClose={() => setShowAddItem(false)} onAdd={handleAdd} />
    </main>
    </>
  );
}
