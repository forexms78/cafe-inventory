'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category, CATEGORIES, Unit, UNITS } from '@/types';

interface Props {
  open: boolean;
  initialCategory: Category;
  onClose: () => void;
  onAdd: (category: Category, name: string, unit: Unit, minQty: string, initialStock: number, expiryDate?: string) => void;
}

const HAS_EXPIRY: Category[] = ['오믈렛 및 마카롱', '도쿄롤', '케익'];

const UNIT_DESC: Record<Unit, string> = {
  '개': '낱개',
  '박스': '박스',
  '봉': '봉지',
  '병': '병',
  '%': '잔여량',
};

export default function AddItemModal({ open, initialCategory, onClose, onAdd }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<Category>(initialCategory);
  const [selectedUnit, setSelectedUnit] = useState<Unit>('개');
  const [name, setName] = useState('');
  const [minQty, setMinQty] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [expiry, setExpiry] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedCategory(initialCategory);
      setSelectedUnit('개');
      setName('');
      setMinQty('');
      setInitialStock('');
      setExpiry('');
    }
  }, [open, initialCategory]);

  const hasExpiry = HAS_EXPIRY.includes(selectedCategory);
  const isPercent = selectedUnit === '%';

  const handleAdd = () => {
    if (!name.trim()) return;
    const stock = parseInt(initialStock) || 0;
    const clampedStock = isPercent ? Math.min(100, Math.max(0, stock)) : stock;
    onAdd(
      selectedCategory,
      name.trim(),
      selectedUnit,
      minQty || (isPercent ? '0' : '0'),
      clampedStock,
      hasExpiry && expiry ? expiry : undefined,
    );
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-pink-100">
        <DialogHeader>
          <DialogTitle className="text-pink-700">품목 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">

          {/* 카테고리 */}
          <div>
            <p className="text-xs text-pink-400 mb-2 font-medium">카테고리</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    selectedCategory === cat
                      ? 'bg-pink-500 text-white border-pink-500'
                      : 'bg-white text-pink-500 border-pink-200 hover:bg-pink-50'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 단위 */}
          <div>
            <p className="text-xs text-pink-400 mb-2 font-medium">단위</p>
            <div className="flex gap-2">
              {UNITS.map(u => (
                <button key={u} onClick={() => setSelectedUnit(u)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    selectedUnit === u
                      ? 'bg-pink-500 text-white border-pink-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-pink-200 hover:bg-pink-50'
                  }`}>
                  <div>{u}</div>
                  <div className={`text-xs mt-0.5 ${selectedUnit === u ? 'text-pink-100' : 'text-gray-400'}`}>
                    {UNIT_DESC[u]}
                  </div>
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
              <p className="text-xs text-pink-400 mb-1.5 font-medium">
                최소 수량{isPercent ? ' (%)' : ` (${selectedUnit})`}
              </p>
              <Input
                placeholder={isPercent ? '예) 30' : '예) 2'}
                value={minQty}
                onChange={e => setMinQty(e.target.value)}
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
            <div>
              <p className="text-xs text-pink-400 mb-1.5 font-medium">
                초기 재고{isPercent ? ' (%)' : ` (${selectedUnit})`}
              </p>
              <Input
                type="number"
                min={0}
                max={isPercent ? 100 : undefined}
                placeholder={isPercent ? '0~100' : '0'}
                value={initialStock}
                onChange={e => setInitialStock(e.target.value)}
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
          </div>

          {/* 유통기한 */}
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
