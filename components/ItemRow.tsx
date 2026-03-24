'use client';
import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Item, CafeUser, getStockStatus } from '@/types';
import { Button } from '@/components/ui/button';
import PriceCompareModal from '@/components/PriceCompareModal';
import ExpiryModal from '@/components/ExpiryModal';

interface Props {
  item: Item;
  user: CafeUser | null;
  showExpiry: boolean;
  highlighted?: boolean;
  reorderMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  dragStyle?: React.CSSProperties;
  dragRef?: (el: HTMLTableRowElement | null) => void;
  onStockChange: (id: string, field: 'stock' | 'pantry_stock' | 'office_stock', value: number) => void;
  onProductNameChange: (id: string, name: string | null) => void;
  onExpiryChange: (id: string, expiry: string | null) => void;
  onDelete: (id: string) => void;
}

export interface ItemRowRef {
  focusStock: () => void;
}

const ROW_COLORS = {
  danger: 'bg-red-50 border-l-4 border-l-red-400',
  warning: 'bg-yellow-50 border-l-4 border-l-yellow-400',
  ok: 'bg-white border-l-4 border-l-transparent',
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
  isPercent?: boolean;
  onStockChange: (id: string, field: 'stock' | 'pantry_stock' | 'office_stock', value: number) => void;
  onEnterKey?: () => void;
  onTabKey?: () => void;
}>(function StockCell({ value, field, itemId, colorClass, canEdit, isPercent, onStockChange, onEnterKey, onTabKey }, ref) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
      onStockChange(itemId, field, parsed);
    }
    setEditing(false);
  }, [inputVal, itemId, field, onStockChange]);

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
        const next = Math.max(0, valueRef.current + delta);
        onStockChange(itemId, field, next);
      }, 150);
    }, 400);
    // timeout도 정리할 수 있게 intervalRef에 저장 (약식 처리)
    (intervalRef as React.MutableRefObject<any>).current = timeout;
  }, [itemId, field, onStockChange]);

  if (!canEdit) return <span className={`text-sm ${colorClass}`}>{displayValue}</span>;

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => onStockChange(itemId, field, Math.max(0, value - 1))}
        onMouseDown={() => startLongPress(-1)}
        onMouseUp={stopLongPress}
        onMouseLeave={stopLongPress}
        onTouchStart={() => startLongPress(-1)}
        onTouchEnd={stopLongPress}
        disabled={value <= 0}
        className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm leading-none transition-colors flex-shrink-0 select-none"
      >
        −
      </button>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commitEdit(); onEnterKey?.(); }
            else if (e.key === 'Tab') { e.preventDefault(); commitEdit(); onTabKey?.(); }
            else if (e.key === 'Escape') setEditing(false);
          }}
          className="w-12 text-center text-sm border border-pink-300 rounded-md outline-none focus:ring-1 focus:ring-pink-400 py-0.5"
        />
      ) : (
        <button
          onClick={handleClickNum}
          data-stock-btn={field}
          className={`w-10 text-center text-sm ${field === 'stock' ? colorClass : 'text-gray-600 font-medium'} hover:underline underline-offset-2 cursor-text`}
          title="클릭하여 직접 입력"
        >
          {displayValue}
        </button>
      )}
      <button
        onClick={() => onStockChange(itemId, field, value + 1)}
        onMouseDown={() => startLongPress(1)}
        onMouseUp={stopLongPress}
        onMouseLeave={stopLongPress}
        onTouchStart={() => startLongPress(1)}
        onTouchEnd={stopLongPress}
        className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 font-bold text-sm leading-none transition-colors flex-shrink-0 select-none"
      >
        +
      </button>
    </div>
  );
});

const ItemRow = forwardRef<ItemRowRef, Props>(function ItemRow(
  { item, user, showExpiry, highlighted, reorderMode, dragHandleProps, dragStyle, dragRef, onStockChange, onProductNameChange, onExpiryChange, onDelete },
  ref
) {
  const status = getStockStatus(item);
  const canEdit = !!user;
  const isPercent = item.min_qty.includes('%');

  const stockRef = useRef<StockCellRef>(null);
  const pantryRef = useRef<StockCellRef>(null);
  const officeRef = useRef<StockCellRef>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);

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

  const combinedRef = useCallback((el: HTMLTableRowElement | null) => {
    (rowRef as React.MutableRefObject<HTMLTableRowElement | null>).current = el;
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
    <tr
      ref={reorderMode ? combinedRef : rowRef}
      id={`item-${item.id}`}
      style={dragStyle}
      className={`${ROW_COLORS[status]} transition-all hover:brightness-95 ${highlighted ? 'ring-2 ring-inset ring-pink-400 animate-pulse' : ''} ${reorderMode ? 'cursor-default' : ''}`}
    >
      {reorderMode && (
        <td className="pl-3 pr-1 py-3 text-gray-300 cursor-grab active:cursor-grabbing touch-none" {...dragHandleProps}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
            <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
            <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
          </svg>
        </td>
      )}
      <td className="px-2 sm:px-4 py-3 text-sm font-medium text-gray-800 max-w-[130px] sm:max-w-none">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap min-w-0">
          <span className="truncate sm:whitespace-nowrap">{item.name}</span>

          {/* 가격비교 버튼 (product_name 있을 때) */}
          {item.product_name && (
            <button
              onClick={() => setShowPriceModal(true)}
              title="가격 비교"
              className="text-base leading-none hover:scale-110 transition-transform flex-shrink-0"
            >
              🛒
            </button>
          )}

          {/* 제품 상세명 편집 (매니저/오너) — 모바일에서는 숨김 */}
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
                className="hidden sm:inline text-xs text-gray-300 hover:text-pink-400 transition-colors whitespace-nowrap"
              >
                {item.product_name ? `✎ ${item.product_name}` : '+제품명'}
              </button>
            )
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 text-center whitespace-nowrap">{item.min_qty}</td>

      {/* 재고 */}
      <td className="px-2 py-3 text-center">
        <StockCell
          ref={stockRef}
          value={item.stock}
          field="stock"
          itemId={item.id}
          colorClass={STOCK_COLORS[status]}
          canEdit={canEdit}
          isPercent={isPercent}
          onStockChange={onStockChange}
          onEnterKey={() => pantryRef.current?.startEditing()}
          onTabKey={() => pantryRef.current?.startEditing()}
        />
      </td>

      {/* 팬트리 */}
      <td className="px-2 py-3 text-center">
        <StockCell
          ref={pantryRef}
          value={item.pantry_stock ?? 0}
          field="pantry_stock"
          itemId={item.id}
          colorClass="text-gray-600 font-medium"
          canEdit={canEdit}
          onStockChange={onStockChange}
          onEnterKey={() => officeRef.current?.startEditing()}
          onTabKey={() => officeRef.current?.startEditing()}
        />
      </td>

      {/* 사무실 */}
      <td className="px-2 py-3 text-center">
        <StockCell
          ref={officeRef}
          value={item.office_stock ?? 0}
          field="office_stock"
          itemId={item.id}
          colorClass="text-gray-600 font-medium"
          canEdit={canEdit}
          onStockChange={onStockChange}
          onEnterKey={goToNextRowStock}
          onTabKey={goToNextRowStock}
        />
      </td>

      {showExpiry && (
        <td className="px-4 py-3 text-sm text-center whitespace-nowrap min-w-[90px]">
          {canEdit ? (
            <button
              onClick={() => setShowExpiryModal(true)}
              className="text-gray-400 hover:text-pink-500 hover:underline underline-offset-2 transition-colors"
              title="유통기한 수정"
            >
              {item.expiry_date ?? '+ 입력'}
            </button>
          ) : (
            <span className="text-gray-400">{item.expiry_date ?? '-'}</span>
          )}
        </td>
      )}
      {canEdit && (
        <td className="px-4 py-3 text-right">
          <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}
            className="text-pink-300 hover:text-red-500 hover:bg-red-50 text-xs">
            삭제
          </Button>
        </td>
      )}
    </tr>
    </>
  );
});

export default ItemRow;
