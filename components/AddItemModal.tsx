'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category, CATEGORIES } from '@/types';

interface Props {
  open: boolean;
  initialCategory: Category;
  onClose: () => void;
  onAdd: (category: Category, name: string, minQty: string, initialStock: number, expiryDate?: string) => void;
}

const HAS_EXPIRY: Category[] = ['오믈렛및마카롱', '도쿄롤', '케익'];

export default function AddItemModal({ open, initialCategory, onClose, onAdd }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<Category>(initialCategory);
  const [name, setName] = useState('');
  const [minQty, setMinQty] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [expiry, setExpiry] = useState('');

  useEffect(() => {
    if (open) setSelectedCategory(initialCategory);
  }, [open, initialCategory]);

  const hasExpiry = HAS_EXPIRY.includes(selectedCategory);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(
      selectedCategory,
      name.trim(),
      minQty || '0',
      parseInt(initialStock) || 0,
      hasExpiry && expiry ? expiry : undefined,
    );
    setName(''); setMinQty(''); setInitialStock(''); setExpiry('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-pink-100">
        <DialogHeader>
          <DialogTitle className="text-pink-700">품목 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* 카테고리 선택 */}
          <div>
            <p className="text-xs text-pink-400 mb-2 font-medium">카테고리</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    selectedCategory === cat
                      ? 'bg-pink-500 text-white border-pink-500'
                      : 'bg-white text-pink-500 border-pink-200 hover:bg-pink-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 품목명 */}
          <div>
            <p className="text-xs text-pink-400 mb-1.5 font-medium">품목명</p>
            <Input
              placeholder="예) 바닐라 파우더"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="border-pink-200 focus:border-pink-400"
              autoFocus
            />
          </div>

          {/* 최소 수량 + 초기 재고 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-pink-400 mb-1.5 font-medium">최소 수량</p>
              <Input
                placeholder="예) 2, 1box"
                value={minQty}
                onChange={e => setMinQty(e.target.value)}
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
            <div>
              <p className="text-xs text-pink-400 mb-1.5 font-medium">초기 재고</p>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={initialStock}
                onChange={e => setInitialStock(e.target.value)}
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
          </div>

          {/* 유통기한 (해당 카테고리만) */}
          {hasExpiry && (
            <div>
              <p className="text-xs text-pink-400 mb-1.5 font-medium">유통기한</p>
              <Input
                placeholder="예) 260801"
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
          )}

          <Button
            className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-xl h-11"
            onClick={handleAdd}
            disabled={!name.trim()}
          >
            {selectedCategory} 추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
