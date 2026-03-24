'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  itemName: string;
  currentExpiry: string | null;
  onClose: () => void;
  onSave: (expiry: string | null) => void;
}

export default function ExpiryModal({ open, itemName, currentExpiry, onClose, onSave }: Props) {
  const [value, setValue] = useState(currentExpiry ?? '');

  useEffect(() => {
    if (open) setValue(currentExpiry ?? '');
  }, [open, currentExpiry]);

  const handleSave = () => {
    onSave(value.trim() || null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-pink-100">
        <DialogHeader>
          <DialogTitle className="text-pink-700">유통기한 수정</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 -mt-1">{itemName}</p>
        <div className="space-y-3 pt-1">
          <Input
            placeholder="유통기한 (예: 260801)"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            className="border-pink-200 focus:border-pink-400"
            autoFocus
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
            >
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
