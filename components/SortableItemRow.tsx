'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ItemRow, { ItemRowRef } from '@/components/ItemRow';
import { Item, CafeUser } from '@/types';
import { forwardRef } from 'react';

interface Props {
  item: Item;
  user: CafeUser | null;
  showExpiry: boolean;
  onStockChange: (id: string, field: 'stock' | 'pantry_stock' | 'office_stock', value: number) => void;
  onProductNameChange: (id: string, name: string | null) => void;
  onExpiryChange: (id: string, expiry: string | null) => void;
  onDelete: (id: string) => void;
}

const SortableItemRow = forwardRef<ItemRowRef, Props>(function SortableItemRow(props, ref) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });

  return (
    <ItemRow
      ref={ref}
      {...props}
      reorderMode
      dragRef={setNodeRef}
      dragStyle={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
        position: isDragging ? 'relative' : undefined,
      }}
      dragHandleProps={{ ...attributes, ...listeners } as Record<string, unknown>}
    />
  );
});

export default SortableItemRow;
