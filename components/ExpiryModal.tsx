'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  itemName: string;
  currentExpiry: string | null;
  onClose: () => void;
  onSave: (expiry: string | null) => void;
}

// YYMMDD("260801") 또는 YYYY-MM-DD("2026-08-01") → input[type=date] 용 YYYY-MM-DD
function toInputDate(val: string | null): string {
  if (!val) return '';
  if (val.includes('-') && val.length === 10) return val;
  if (val.length === 6) {
    const yy = val.slice(0, 2);
    const mm = val.slice(2, 4);
    const dd = val.slice(4, 6);
    return `20${yy}-${mm}-${dd}`;
  }
  return '';
}

export default function ExpiryModal({ open, itemName, currentExpiry, onClose, onSave }: Props) {
  const [value, setValue] = useState(toInputDate(currentExpiry));

  useEffect(() => {
    if (open) setValue(toInputDate(currentExpiry));
  }, [open, currentExpiry]);

  const handleSave = () => {
    onSave(value || null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-pink-100">
        <DialogHeader>
          <DialogTitle className="text-pink-700">유통기한 수정</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 -mt-1">{itemName}</p>
        <div className="space-y-4 pt-2">
          <input
            type="date"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full border border-pink-200 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-pink-200 text-pink-400 hover:bg-pink-50"
              onClick={() => { onSave(null); onClose(); }}
            >
              삭제
            </Button>
            <Button
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
              onClick={handleSave}
              disabled={!value}
            >
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
