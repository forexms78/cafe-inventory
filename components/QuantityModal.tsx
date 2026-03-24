'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Item } from '@/types';

interface Props {
  item: Item | null;
  onClose: () => void;
  onSave: (id: string, stock: number, officeStock?: number) => void;
}

export default function QuantityModal({ item, onClose, onSave }: Props) {
  const [stock, setStock] = useState(0);
  const [officeStock, setOfficeStock] = useState(0);

  useEffect(() => {
    if (item) {
      setStock(item.stock);
      setOfficeStock(item.office_stock ?? 0);
    }
  }, [item]);

  if (!item) return null;

  const hasOfficeStock = item.office_stock !== null && item.office_stock !== undefined;

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-pink-100">
        <DialogHeader>
          <DialogTitle className="text-pink-700">{item.name} 재고 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">매장 재고</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStock(s => Math.max(0, s - 1))}
                className="w-10 h-10 rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 text-lg font-bold"
              >
                −
              </Button>
              <Input
                type="number"
                value={stock}
                onChange={e => setStock(Math.max(0, Number(e.target.value)))}
                className="text-center w-20 border-pink-200 focus:border-pink-400 text-lg font-semibold"
                min={0}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStock(s => s + 1)}
                className="w-10 h-10 rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 text-lg font-bold"
              >
                +
              </Button>
            </div>
          </div>

          {hasOfficeStock && (
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">사무실 재고</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOfficeStock(s => Math.max(0, s - 1))}
                  className="w-10 h-10 rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 text-lg font-bold"
                >
                  −
                </Button>
                <Input
                  type="number"
                  value={officeStock}
                  onChange={e => setOfficeStock(Math.max(0, Number(e.target.value)))}
                  className="text-center w-20 border-pink-200 focus:border-pink-400 text-lg font-semibold"
                  min={0}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOfficeStock(s => s + 1)}
                  className="w-10 h-10 rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 text-lg font-bold"
                >
                  +
                </Button>
              </div>
            </div>
          )}

          <Button
            className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-xl h-11"
            onClick={() => {
              onSave(item.id, stock, hasOfficeStock ? officeStock : undefined);
              onClose();
            }}
          >
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
