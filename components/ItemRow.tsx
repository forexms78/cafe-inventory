'use client';
import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Item, CafeUser, getStockStatus, Unit } from '@/types';
import { Plus, Minus, ShoppingCart, Pencil } from 'lucide-react';
import PriceCompareModal from '@/components/PriceCompareModal';
import ExpiryModal from '@/components/ExpiryModal';
import { playClickSound } from '@/lib/sounds';

interface Props {
  item: Item;
  user: CafeUser | null;
  showExpiry: boolean;
  highlighted?: boolean;
  reorderMode?: boolean;
  minEditMode?: boolean;
  deleteMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  dragStyle?: React.CSSProperties;
  dragRef?: (el: HTMLDivElement | null) => void;
  onStockChange: (id: string, field: 'stock' | 'pantry_stock' | 'office_stock', value: number) => void;
  onProductNameChange: (id: string, name: string | null) => void;
  onExpiryChange: (id: string, expiry: string | null) => void;
  onMinQtyChange?: (id: string, minQty: string) => void;
  onDelete: (id: string) => void;
}

export interface ItemRowRef {
  focusStock: () => void;
}

const ROW_COLORS = {
  danger: 'bg-red-50',
  warning: 'bg-yellow-50',
  ok: 'bg-white',
};

const BAR_COLORS = {
  danger: 'bg-red-400',
  warning: 'bg-yellow-400',
};

const STOCK_COLORS = {
  danger: 'text-red-600 font-bold',
  warning: 'text-yellow-600 font-semibold',
  ok: 'text-emerald-600 font-medium',
};

interface StockCellRef {
  startEditing: () => void;
}

const StockCell = forwardRef<StockCellRef, {
  value: number;
  field: 'stock' | 'pantry_stock' | 'office_stock';
  itemId: string;
  colorClass: string;
  canEdit: boolean;
  unit?: Unit;
  compact?: boolean;
  onStockChange: (id: string, field: 'stock' | 'pantry_stock' | 'office_stock', value: number) => void;
  onEnterKey?: () => void;
  onTabKey?: () => void;
}>(function StockCell({ value, field, itemId, colorClass, canEdit, unit, compact, onStockChange, onEnterKey, onTabKey }, ref) {
  const isPercent = unit === '%';
  const maxVal = isPercent ? 100 : Infinity;
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);

  useEffect(() => { valueRef.current = value; }, [value]);

  useImperativeHandle(ref, () => ({
    startEditing: () => {
      setInputVal(isPercent ? `${value}%` : String(value));
      setEditing(true);
      setTimeout(() => inputRef.current?.select(), 0);
    },
  }));

  const displayValue = isPercent ? `${value}%` : String(value);

  const handleClickNum = () => {
    setInputVal(isPercent ? `${value}%` : String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = useCallback(() => {
    const stripped = inputVal.replace('%', '').trim();
    const parsed = parseInt(stripped, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onStockChange(itemId, field, Math.min(maxVal, Math.max(0, parsed)));
    }
    setEditing(false);
  }, [inputVal, itemId, field, onStockChange, maxVal]);

  const stopLongPress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startLongPress = useCallback((delta: number) => {
    // 400ms 딜레이 후 빠른 반복 시작
    const timeout = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        const next = Math.min(maxVal, Math.max(0, valueRef.current + delta));
        playClickSound(delta > 0 ? 'plus' : 'minus');
        onStockChange(itemId, field, next);
      }, 150);
    }, 400);
    // timeout도 정리할 수 있게 intervalRef에 저장 (약식 처리)
    intervalRef.current = timeout;
  }, [itemId, field, onStockChange, maxVal]);

  if (!canEdit) return <span className={`text-sm tabular-nums ${colorClass}`}>{displayValue}</span>;

  const editInput = (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={inputVal}
      onChange={e => setInputVal(e.target.value)}
      onBlur={commitEdit}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); commitEdit(); onEnterKey?.(); }
        else if (e.key === 'Tab') { e.preventDefault(); commitEdit(); onTabKey?.(); }
        else if (e.key === 'Escape') setEditing(false);
      }}
      className="w-11 h-9 text-center text-sm border border-pink-300 rounded-md outline-none focus:ring-1 focus:ring-pink-400"
    />
  );

  // 팬트리·사무실 — 숫자만 표시, 탭하면 직접 입력 (시안 준수)
  if (compact) {
    return editing ? editInput : (
      <button
        onClick={handleClickNum}
        data-stock-btn={field}
        className={`min-w-11 h-11 text-sm tabular-nums ${colorClass} hover:underline underline-offset-2 cursor-text`}
        title="클릭하여 직접 입력"
      >
        {displayValue}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-0.5">
      <button
        onClick={() => { playClickSound('minus'); onStockChange(itemId, field, Math.max(0, value - 1)); }}
        onMouseDown={() => startLongPress(-1)}
        onMouseUp={stopLongPress}
        onMouseLeave={stopLongPress}
        onTouchStart={() => startLongPress(-1)}
        onTouchEnd={stopLongPress}
        disabled={value <= 0}
        aria-label="감소"
        className="w-11 h-11 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0 select-none"
      >
        <Minus className="w-4 h-4" />
      </button>
      {editing ? editInput : (
        <button
          onClick={handleClickNum}
          data-stock-btn={field}
          className={`w-9 h-11 text-center text-base tabular-nums ${colorClass} hover:underline underline-offset-2 cursor-text`}
          title="클릭하여 직접 입력"
        >
          {displayValue}
        </button>
      )}
      <button
        onClick={() => { playClickSound('plus'); onStockChange(itemId, field, Math.min(maxVal, value + 1)); }}
        onMouseDown={() => startLongPress(1)}
        onMouseUp={stopLongPress}
        onMouseLeave={stopLongPress}
        onTouchStart={() => startLongPress(1)}
        onTouchEnd={stopLongPress}
        disabled={value >= maxVal}
        aria-label="증가"
        className="w-11 h-11 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0 select-none"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
});

const ItemRow = forwardRef<ItemRowRef, Props>(function ItemRow(
  { item, user, showExpiry, highlighted, reorderMode, minEditMode, deleteMode, dragHandleProps, dragStyle, dragRef, onStockChange, onProductNameChange, onExpiryChange, onMinQtyChange, onDelete },
  ref
) {
  const status = getStockStatus(item);
  const canEdit = !!user;
  const unit = item.unit ?? '개';

  const stockRef = useRef<StockCellRef>(null);
  const pantryRef = useRef<StockCellRef>(null);
  const officeRef = useRef<StockCellRef>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const [editingProductName, setEditingProductName] = useState(false);
  const [productNameInput, setProductNameInput] = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);

  useImperativeHandle(ref, () => ({
    focusStock: () => stockRef.current?.startEditing(),
  }));

  const goToNextRowStock = useCallback(() => {
    const nextRow = rowRef.current?.nextElementSibling as HTMLElement | null;
    if (nextRow) {
      const btn = nextRow.querySelector('[data-stock-btn="stock"]') as HTMLElement | null;
      btn?.click();
    }
  }, []);

  const startProductNameEdit = () => {
    setProductNameInput(item.product_name ?? '');
    setEditingProductName(true);
  };

  const commitProductNameEdit = () => {
    const trimmed = productNameInput.trim();
    onProductNameChange(item.id, trimmed || null);
    setEditingProductName(false);
  };

  const combinedRef = useCallback((el: HTMLDivElement | null) => {
    (rowRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    dragRef?.(el);
  }, [dragRef]);

  return (
    <>
      {item.product_name && (
        <PriceCompareModal
          open={showPriceModal}
          itemName={item.name}
          productName={item.product_name}
          onClose={() => setShowPriceModal(false)}
        />
      )}
      <ExpiryModal
        open={showExpiryModal}
        itemName={item.name}
        currentExpiry={item.expiry_date ?? null}
        onClose={() => setShowExpiryModal(false)}
        onSave={(expiry) => onExpiryChange(item.id, expiry)}
      />
    <div
      ref={reorderMode ? combinedRef : rowRef}
      id={`item-${item.id}`}
      style={dragStyle}
      className={`relative flex items-center gap-1 px-3 py-2 ${ROW_COLORS[status]} transition-all hover:brightness-95 ${highlighted ? 'ring-2 ring-inset ring-pink-400 animate-pulse' : ''}`}
    >
      {status !== 'ok' && (
        <span aria-hidden="true" className={`absolute left-0 top-2 bottom-2 w-1 rounded-r ${BAR_COLORS[status]}`} />
      )}
      {reorderMode && (
        <span
          className="w-7 h-11 flex items-center justify-center text-gray-300 cursor-grab active:cursor-grabbing touch-none shrink-0"
          {...dragHandleProps}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
            <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
            <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
          </svg>
        </span>
      )}

      {/* 품목명 + 최소·단위·유통기한 */}
      <div className="flex-1 min-w-0 pl-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[15px] font-semibold text-gray-800 truncate">{item.name}</span>

          {/* 가격비교 버튼 (product_name 있을 때) */}
          {item.product_name && (
            <button
              onClick={() => setShowPriceModal(true)}
              title="가격 비교"
              aria-label="가격 비교"
              className="text-pink-400 hover:text-pink-600 transition-colors shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}

          {/* 제품 상세명 편집 — 모바일에서는 숨김 */}
          {canEdit && (
            editingProductName ? (
              <input
                autoFocus
                type="text"
                value={productNameInput}
                onChange={e => setProductNameInput(e.target.value)}
                onBlur={commitProductNameEdit}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitProductNameEdit();
                  if (e.key === 'Escape') setEditingProductName(false);
                }}
                placeholder="상세 제품명 입력..."
                className="text-xs border border-pink-300 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-pink-400 w-40"
              />
            ) : (
              <button
                onClick={startProductNameEdit}
                title={item.product_name ? '제품명 수정' : '제품명 추가'}
                className="hidden sm:inline-flex items-center gap-0.5 text-xs text-gray-300 hover:text-pink-400 transition-colors whitespace-nowrap"
              >
                <Pencil className="w-3 h-3 shrink-0" />
                {item.product_name ?? '제품명'}
              </button>
            )
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-1 text-[11px] text-gray-400 mt-0.5">
          {minEditMode && canEdit ? (
            <label className="flex items-center gap-1">
              최소
              <input
                key={`${item.id}-min`}
                type="text"
                defaultValue={item.min_qty}
                onBlur={e => {
                  const val = e.target.value.trim();
                  if (val && val !== item.min_qty) onMinQtyChange?.(item.id, val);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') { e.currentTarget.value = item.min_qty; e.currentTarget.blur(); }
                }}
                className="w-12 text-center text-xs border border-pink-300 rounded-md outline-none focus:ring-1 focus:ring-pink-400 py-0.5"
              />
            </label>
          ) : (
            <span className="whitespace-nowrap">최소 {item.min_qty} · {unit}</span>
          )}
          {showExpiry && (
            canEdit ? (
              <button
                onClick={() => setShowExpiryModal(true)}
                className="text-gray-400 hover:text-pink-500 hover:underline underline-offset-2 transition-colors whitespace-nowrap"
                title="유통기한 수정"
              >
                · {item.expiry_date ?? '+ 유통기한'}
              </button>
            ) : (
              <span className="whitespace-nowrap">· {item.expiry_date ?? '-'}</span>
            )
          )}
        </div>
      </div>

      {/* 매장 — 44px 스테퍼 */}
      <div className="w-[132px] shrink-0 flex justify-center">
        <StockCell
          ref={stockRef}
          value={item.stock}
          field="stock"
          itemId={item.id}
          colorClass={STOCK_COLORS[status]}
          canEdit={canEdit}
          unit={unit}
          onStockChange={onStockChange}
          onEnterKey={() => pantryRef.current?.startEditing()}
          onTabKey={() => pantryRef.current?.startEditing()}
        />
      </div>

      {/* 팬트리 */}
      <div className="w-11 shrink-0 flex justify-center">
        <StockCell
          ref={pantryRef}
          value={item.pantry_stock ?? 0}
          field="pantry_stock"
          itemId={item.id}
          colorClass="text-gray-600 font-medium"
          canEdit={canEdit}
          compact
          onStockChange={onStockChange}
          onEnterKey={() => officeRef.current?.startEditing()}
          onTabKey={() => officeRef.current?.startEditing()}
        />
      </div>

      {/* 사무실 */}
      <div className="w-11 shrink-0 flex justify-center">
        <StockCell
          ref={officeRef}
          value={item.office_stock ?? 0}
          field="office_stock"
          itemId={item.id}
          colorClass="text-gray-600 font-medium"
          canEdit={canEdit}
          compact
          onStockChange={onStockChange}
          onEnterKey={goToNextRowStock}
          onTabKey={goToNextRowStock}
        />
      </div>

      {canEdit && deleteMode && (
        <button
          onClick={() => onDelete(item.id)}
          className="w-12 h-11 shrink-0 text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          삭제
        </button>
      )}
    </div>
    </>
  );
});

export default ItemRow;
