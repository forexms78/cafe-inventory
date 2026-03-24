'use client';
import { useState, useRef } from 'react';
import { Item, CafeUser, getStockStatus } from '@/types';
import { Button } from '@/components/ui/button';

interface Props {
  item: Item;
  user: CafeUser | null;
  showExpiry: boolean;
  highlighted?: boolean;
  onStockChange: (id: string, field: 'stock' | 'pantry_stock' | 'office_stock', value: number) => void;
  onDelete: (id: string) => void;
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

function StockCell({
  value,
  field,
  itemId,
  colorClass,
  canEdit,
  onStockChange,
}: {
  value: number;
  field: 'stock' | 'pantry_stock' | 'office_stock';
  itemId: string;
  colorClass: string;
  canEdit: boolean;
  onStockChange: (id: string, field: 'stock' | 'pantry_stock' | 'office_stock', value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClickNum = () => {
    setInputVal(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onStockChange(itemId, field, parsed);
    }
    setEditing(false);
  };

  if (!canEdit) return <span className={`text-sm ${colorClass}`}>{value}</span>;

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => onStockChange(itemId, field, Math.max(0, value - 1))}
        disabled={value <= 0}
        className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm leading-none transition-colors flex-shrink-0"
      >
        −
      </button>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
          className="w-10 text-center text-sm border border-pink-300 rounded-md outline-none focus:ring-1 focus:ring-pink-400 py-0.5"
          min={0}
        />
      ) : (
        <button
          onClick={handleClickNum}
          className={`w-8 text-center text-sm ${field === 'stock' ? colorClass : 'text-gray-600 font-medium'} hover:underline underline-offset-2 cursor-text`}
          title="클릭하여 직접 입력"
        >
          {value}
        </button>
      )}
      <button
        onClick={() => onStockChange(itemId, field, value + 1)}
        className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 font-bold text-sm leading-none transition-colors flex-shrink-0"
      >
        +
      </button>
    </div>
  );
}

export default function ItemRow({ item, user, showExpiry, highlighted, onStockChange, onDelete }: Props) {
  const status = getStockStatus(item);
  const canEdit = !!user;

  return (
    <tr
      id={`item-${item.id}`}
      className={`${ROW_COLORS[status]} transition-all hover:brightness-95 ${highlighted ? 'ring-2 ring-inset ring-pink-400 animate-pulse' : ''}`}
    >
      <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">{item.name}</td>
      <td className="px-4 py-3 text-sm text-gray-400 text-center whitespace-nowrap">{item.min_qty}</td>

      {/* 재고 */}
      <td className="px-2 py-3 text-center">
        <StockCell
          value={item.stock}
          field="stock"
          itemId={item.id}
          colorClass={STOCK_COLORS[status]}
          canEdit={canEdit}
          onStockChange={onStockChange}
        />
      </td>

      {/* 팬트리 */}
      <td className="px-2 py-3 text-center">
        <StockCell
          value={item.pantry_stock ?? 0}
          field="pantry_stock"
          itemId={item.id}
          colorClass="text-gray-600 font-medium"
          canEdit={canEdit}
          onStockChange={onStockChange}
        />
      </td>

      {/* 사무실 */}
      <td className="px-2 py-3 text-center">
        <StockCell
          value={item.office_stock ?? 0}
          field="office_stock"
          itemId={item.id}
          colorClass="text-gray-600 font-medium"
          canEdit={canEdit}
          onStockChange={onStockChange}
        />
      </td>

      {showExpiry && (
        <td className="px-4 py-3 text-sm text-center text-gray-400 whitespace-nowrap">
          {item.expiry_date ?? '-'}
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
  );
}
