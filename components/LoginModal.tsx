'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { saveSession } from '@/lib/auth';
import { CafeUser } from '@/types';

interface Props {
  open: boolean;
  onSuccess: (user: CafeUser) => void;
  onClose: () => void;
}

export default function LoginModal({ open, onSuccess, onClose }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    saveSession(data);
    onSuccess(data);
    setPassword('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-pink-100">
        <DialogHeader>
          <DialogTitle className="text-center text-pink-700">비밀번호 입력</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="border-pink-200 focus:border-pink-400 focus:ring-pink-300"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
          >
            {loading ? '확인 중...' : '로그인'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
