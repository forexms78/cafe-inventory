'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const [target, setTarget] = useState<'owner' | 'manager'>('manager');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!newPw.trim()) return;
    setLoading(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: target, newPassword: newPw }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMsg('비밀번호가 변경되었습니다.');
      setNewPw('');
      setTimeout(() => { setMsg(''); onClose(); }, 1200);
    } else {
      setMsg(data.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-pink-100">
        <DialogHeader>
          <DialogTitle className="text-pink-700">비밀번호 변경</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            {(['owner', 'manager'] as const).map(r => (
              <button
                key={r}
                onClick={() => setTarget(r)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  target === r
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-pink-600 border-pink-200 hover:bg-pink-50'
                }`}
              >
                {r === 'owner' ? '오너' : '매니저'}
              </button>
            ))}
          </div>
          <Input
            type="password"
            placeholder="새 비밀번호"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChange()}
            className="border-pink-200 focus:border-pink-400"
          />
          {msg && <p className={`text-sm text-center ${msg.includes('변경') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</p>}
          <Button
            className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-xl h-11"
            onClick={handleChange}
            disabled={loading}
          >
            {loading ? '변경 중...' : '변경'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
