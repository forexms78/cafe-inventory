'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface StockLogEntry {
  timestamp: string;
  itemName: string;
  field: 'stock' | 'pantry_stock' | 'office_stock';
  oldValue: number;
  newValue: number;
  user: string;
}

const FIELD_LABEL: Record<StockLogEntry['field'], string> = {
  stock: '매장',
  pantry_stock: '팬트리',
  office_stock: '사무실',
};

const LOG_KEY = 'cafe_stock_logs';
const MAX_LOGS = 100;

export function appendLog(entry: StockLogEntry) {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const logs: StockLogEntry[] = raw ? JSON.parse(raw) : [];
    logs.unshift(entry);
    if (logs.length > MAX_LOGS) logs.splice(MAX_LOGS);
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch {}
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function StockLogModal({ open, onClose }: Props) {
  const [logs, setLogs] = useState<StockLogEntry[]>([]);

  useEffect(() => {
    if (open) {
      try {
        const raw = localStorage.getItem(LOG_KEY);
        setLogs(raw ? JSON.parse(raw) : []);
      } catch {
        setLogs([]);
      }
    }
  }, [open]);

  const handleClear = () => {
    localStorage.removeItem(LOG_KEY);
    setLogs([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-pink-100 max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-pink-700 flex items-center gap-2">
            🔒 재고 변경 로그
            <span className="text-xs font-normal text-gray-400">최근 {logs.length}건</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto divide-y divide-pink-50 -mx-6 px-6">
          {logs.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-300">변경 이력이 없습니다.</p>
          ) : (
            logs.map((log, i) => {
              const diff = log.newValue - log.oldValue;
              const isIncrease = diff > 0;
              return (
                <div key={i} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{log.itemName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {FIELD_LABEL[log.field]} · {log.user}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${isIncrease ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isIncrease ? '+' : ''}{diff}
                      <span className="text-gray-400 font-normal ml-1">
                        ({log.oldValue} → {log.newValue})
                      </span>
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {new Date(log.timestamp).toLocaleString('ko-KR', {
                        month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {logs.length > 0 && (
          <div className="pt-3 border-t border-pink-50">
            <button
              onClick={handleClear}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
            >
              로그 전체 삭제
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
