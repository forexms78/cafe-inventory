'use client';
import { Item, CafeUser, getStockStatus } from '@/types';
import { Button } from '@/components/ui/button';

interface Props {
  item: Item;
  user: CafeUser | null;
  showOfficeStock: boolean;
  showExpiry: boolean;
  onEdit: (item: Item) => void;
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

export default function ItemRow({ item, user, showOfficeStock, showExpiry, onEdit, onDelete }: Props) {
  const status = getStockStatus(item);
  const canEdit = !!user;

  return (
    <tr className={`${ROW_COLORS[status]} transition-colors hover:brightness-95`}>
      <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
      <td className="px-4 py-3 text-sm text-gray-500 text-center">{item.min_qty}</td>
      <td className={`px-4 py-3 text-sm text-center ${STOCK_COLORS[status]}`}>
        {canEdit ? (
          <button
            onClick={() => onEdit(item)}
            className="underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {item.stock}
          </button>
        ) : (
          item.stock
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
