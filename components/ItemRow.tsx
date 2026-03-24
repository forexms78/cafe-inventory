'use client';
import { Item, CafeUser, getStockStatus } from '@/types';
import { Button } from '@/components/ui/button';

interface Props {
  item: Item;
  user: CafeUser | null;
  showOfficeStock: boolean;
  showExpiry: boolean;
  onStockChange: (id: string, delta: number) => void;
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

export default function ItemRow({ item, user, showOfficeStock, showExpiry, onStockChange, onDelete }: Props) {
  const status = getStockStatus(item);
  const canEdit = !!user;

  return (
    <tr className={`${ROW_COLORS[status]} transition-colors hover:brightness-95`}>
      <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
      <td className="px-4 py-3 text-sm text-gray-400 text-center">{item.min_qty}</td>
      <td className="px-4 py-3 text-center">
        {canEdit ? (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onStockChange(item.id, -1)}
              disabled={item.stock <= 0}
              className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-base leading-none transition-colors"
            >
              −
            </button>
            <span className={`w-8 text-center text-sm ${STOCK_COLORS[status]}`}>
              {item.stock}
            </span>
            <button
              onClick={() => onStockChange(item.id, +1)}
              className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 font-bold text-base leading-none transition-colors"
            >
              +
            </button>
          </div>
        ) : (
          <span className={`text-sm ${STOCK_COLORS[status]}`}>{item.stock}</span>
        )}
      </td>
      {showOfficeStock && (
        <td className="px-4 py-3 text-sm text-center text-gray-500">
          {item.office_stock != null ? item.office_stock : '-'}
        </td>
      )}
      {showExpiry && (
        <td className="px-4 py-3 text-sm text-center text-gray-400">
          {item.expiry_date ?? '-'}
        </td>
      )}
      {canEdit && (
        <td className="px-4 py-3 text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="text-pink-300 hover:text-red-500 hover:bg-red-50 text-xs"
          >
            삭제
          </Button>
        </td>
      )}
    </tr>
  );
}
