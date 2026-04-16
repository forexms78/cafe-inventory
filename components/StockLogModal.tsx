'use client';
import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface StockLogEntry {
  timestamp: string;
  itemName: string;
  field: 'stock' | 'pantry_stock' | 'office_stock' | 'bulk_reset';
  oldValue: number;
  newValue: number;
  user: string;
}

type FieldFilter = 'all' | 'stock' | 'pantry_stock' | 'office_stock' | 'bulk_reset';

const FIELD_LABEL: Record<StockLogEntry['field'], string> = {
  stock: '매장',
  pantry_stock: '팬트리',
  office_stock: '사무실',
  bulk_reset: '초기화',
};

const FIELD_COLOR: Record<StockLogEntry['field'], string> = {
  stock: 'bg-pink-100 text-pink-700',
  pantry_stock: 'bg-blue-100 text-blue-700',
  office_stock: 'bg-gray-100 text-gray-600',
  bulk_reset: 'bg-red-100 text-red-700',
};

const FILTER_LABELS: Record<FieldFilter, string> = {
  all: '전체',
  stock: '매장',
  pantry_stock: '팬트리',
  office_stock: '사무실',
  bulk_reset: '초기화',
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDateKey(isoString: string): string {
  return new Date(isoString).toLocaleDateString('ko-KR');
}

export async function appendLog(entry: StockLogEntry) {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch {}
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function StockLogModal({ open, onClose }: Props) {
  const [logs, setLogs] = useState<StockLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldFilter, setFieldFilter] = useState<FieldFilter>('all');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/logs')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setLogs([]); return; }
        setLogs(data.map((d: {
          created_at: string;
          item_name: string;
          field: StockLogEntry['field'];
          old_value: number;
          new_value: number;
          user_name: string;
        }) => ({
          timestamp: d.created_at,
          itemName: d.item_name,
          field: d.field,
          oldValue: d.old_value,
          newValue: d.new_value,
          user: d.user_name,
        })));
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filteredLogs = useMemo(() => {
    if (fieldFilter === 'all') return logs;
    return logs.filter(l => l.field === fieldFilter);
  }, [logs, fieldFilter]);

  const groupedLogs = useMemo(() => {
    const groups: { dateKey: string; entries: StockLogEntry[] }[] = [];
    for (const log of filteredLogs) {
      const dateKey = getDateKey(log.timestamp);
      const existing = groups.find(g => g.dateKey === dateKey);
      if (existing) {
        existing.entries.push(log);
      } else {
        groups.push({ dateKey, entries: [log] });
      }
    }
    return groups;
  }, [filteredLogs]);

  const handleClear = async () => {
    await fetch('/api/logs', { method: 'DELETE' });
    setLogs([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-pink-100 max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-pink-50 flex-shrink-0">
          <DialogTitle className="text-pink-700 flex items-center justify-between">
            <span>재고 변경 로그</span>
            <span className="text-xs font-normal text-gray-400">{filteredLogs.length} / {logs.length}건</span>
          </DialogTitle>
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {(Object.keys(FILTER_LABELS) as FieldFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFieldFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  fieldFilter === f
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-pink-300 hover:text-pink-600'
                }`}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <p className="py-10 text-center text-sm text-pink-200">불러오는 중...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-300">변경 이력이 없습니다.</p>
          ) : (
            groupedLogs.map(({ dateKey, entries }) => (
              <div key={dateKey}>
                <div className="sticky top-0 z-10 px-6 py-2 bg-gray-50 border-y border-pink-50 flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">{formatDate(entries[0].timestamp)}</span>
                  <span className="text-xs text-gray-400">{entries.length}건</span>
                </div>
                <div className="divide-y divide-pink-50">
                  {entries.map((log, i) => {
                    if (log.field === 'bulk_reset') {
                      return (
                        <div key={i} className="px-6 py-3 bg-red-50/40 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                전체 초기화
                              </span>
                              <span className="text-xs text-gray-500">{log.user}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 truncate max-w-[260px]">{log.itemName}</p>
                            {log.oldValue > 0 && (
                              <p className="text-xs text-gray-400">재고 있던 항목 {log.oldValue}개 초기화</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(log.timestamp)}</span>
                        </div>
                      );
                    }

                    const diff = log.newValue - log.oldValue;
                    const isIncrease = diff > 0;

                    return (
                      <div key={i} className="px-6 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{log.itemName}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${FIELD_COLOR[log.field]}`}>
                              {FIELD_LABEL[log.field]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{log.user}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${isIncrease ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </p>
                          <p className="text-xs text-gray-400">{log.oldValue} → {log.newValue}</p>
                          <p className="text-xs text-gray-300">{formatTime(log.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {logs.length > 0 && (
          <div className="px-6 py-3 border-t border-pink-50 flex-shrink-0">
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
