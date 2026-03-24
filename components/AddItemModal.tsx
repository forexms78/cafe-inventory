'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category } from '@/types';

interface Props {
  open: boolean;
  category: Category;
  onClose: () => void;
  onAdd: (name: string, minQty: string, expiryDate?: string) => void;
}

const HAS_EXPIRY: Category[] = ['오믈렛및마카롱', '도쿄롤', '케익'];

export default function AddItemModal({ open, category, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [minQty, setMinQty] = useState('1');
  const [expiry, setExpiry] = useState('');

  const hasExpiry = HAS_EXPIRY.includes(category);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), minQty || '1', hasExpiry && expiry ? expiry : undefined);
    setName(''); setMinQty('1'); setExpiry('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-pink-100">
        <DialogHeader>
          <DialogTitle className="text-pink-700">{category} 품목 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input
            placeholder="품목명"
            value={name}
            onChange={e => setName(e.target.value)}
            className="border-pink-200 focus:border-pink-400"
          />
          <Input
            placeholder="최소 수량 (예: 2, 1box, 절반)"
            value={minQty}
            onChange={e => setMinQty(e.target.value)}
            className="border-pink-200 focus:border-pink-400"
          />
          {hasExpiry && (
            <Input
              placeholder="유통기한 (예: 260801)"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              className="border-pink-200 focus:border-pink-400"
            />
          )}
          <Button
            className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-xl h-11"
            onClick={handleAdd}
          >
            추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
