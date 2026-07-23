'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { Item } from '@/types';

interface LogEntry {
  id: string;
  created_at: string;
  item_name: string;
  field: 'stock' | 'pantry_stock' | 'office_stock' | 'bulk_reset' | string;
  old_value: number;
  new_value: number;
  user_name: string;
}

type DateRange = 'today' | '7d' | '30d' | 'all';
type FieldFilter = 'all' | 'stock' | 'pantry_stock' | 'office_stock' | 'bulk_reset';

const FIELD_LABEL: Record<string, string> = {
  stock: '매장',
  pantry_stock: '팬트리',
  office_stock: '사무실',
  bulk_reset: '초기화',
};

const FIELD_COLOR: Record<string, string> = {
  stock: 'bg-pink-100 text-pink-700',
  pantry_stock: 'bg-blue-100 text-blue-700',
  office_stock: 'bg-gray-100 text-gray-600',
  bulk_reset: 'bg-red-100 text-red-700',
};

const DATE_OPTIONS: { key: DateRange; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: '7d', label: '7일' },
  { key: '30d', label: '30일' },
  { key: 'all', label: '전체' },
];

const FIELD_OPTIONS: { key: FieldFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'stock', label: '매장' },
  { key: 'pantry_stock', label: '팬트리' },
  { key: 'office_stock', label: '사무실' },
  { key: 'bulk_reset', label: '초기화' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit',
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function getDateKey(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR');
}

function SummaryCard({
  label, value, sub, accent,
}: {
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-bold truncate ${accent ?? 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeveloper, setIsDeveloper] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [fieldFilter, setFieldFilter] = useState<FieldFilter>('all');
  const [userFilter, setUserFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    setIsDeveloper(session.role === 'developer');

    Promise.all([
      fetch('/api/logs?limit=1000').then(r => r.json()),
      fetch('/api/items').then(r => r.json()),
    ]).then(([logsData, itemsData]) => {
      setLogs(Array.isArray(logsData) ? logsData : []);
      setItems(Array.isArray(itemsData) ? itemsData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const handleDeleteLog = async (logId: string) => {
    await fetch(`/api/logs?id=${logId}`, { method: 'DELETE' }).catch(() => {});
    setLogs(prev => prev.filter(l => l.id !== logId));
  };

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {};
    items.forEach(i => { m[i.name] = i.category; });
    return m;
  }, [items]);

  const users = useMemo(() => {
    const s = new Set(logs.map(l => l.user_name).filter(Boolean));
    return Array.from(s);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (dateRange !== 'all') {
      const cutoff = new Date();
      if (dateRange === 'today') cutoff.setHours(0, 0, 0, 0);
      else if (dateRange === '7d') cutoff.setDate(cutoff.getDate() - 7);
      else if (dateRange === '30d') cutoff.setDate(cutoff.getDate() - 30);
      result = result.filter(l => new Date(l.created_at) >= cutoff);
    }

    if (fieldFilter !== 'all') result = result.filter(l => l.field === fieldFilter);
    if (userFilter !== 'all') result = result.filter(l => l.user_name === userFilter);
    if (search.trim()) result = result.filter(l =>
      l.item_name.toLowerCase().includes(search.toLowerCase())
    );
    if (anomalyOnly) result = result.filter(l =>
      l.new_value === 0 && l.field !== 'bulk_reset'
    );

    return result;
  }, [logs, dateRange, fieldFilter, userFilter, search, anomalyOnly]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = logs.filter(l => new Date(l.created_at) >= today).length;

    const counts: Record<string, number> = {};
    logs.forEach(l => {
      if (l.field !== 'bulk_reset') counts[l.item_name] = (counts[l.item_name] || 0) + 1;
    });
    const topItem = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    const zeroEvents = logs.filter(l => l.new_value === 0 && l.field !== 'bulk_reset').length;
    const lastReset = logs.find(l => l.field === 'bulk_reset');

    return { todayCount, topItem, zeroEvents, lastReset };
  }, [logs]);

  const groupedLogs = useMemo(() => {
    const groups: { dateKey: string; label: string; entries: LogEntry[] }[] = [];
    for (const log of filteredLogs) {
      const dateKey = getDateKey(log.created_at);
      const existing = groups.find(g => g.dateKey === dateKey);
      if (existing) existing.entries.push(log);
      else groups.push({ dateKey, label: formatDate(log.created_at), entries: [log] });
    }
    return groups;
  }, [filteredLogs]);

  const itemTimeline = useMemo(() => {
    if (!selectedItem) return [];
    return logs.filter(l => l.item_name === selectedItem && l.field !== 'bulk_reset');
  }, [logs, selectedItem]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-pink-300 text-sm">불러오는 중...</p>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 w-full">
      {/* 헤더 — 탭바가 페이지 이동을 담당하므로 뒤로가기 버튼 없음 */}
      <div className="flex items-end justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-pink-700 theme-title theme-jua">
          기록
        </h1>
        <span className="text-xs text-gray-400 bg-pink-50 px-2.5 py-1 rounded-full">
          {filteredLogs.length}건
        </span>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="오늘 변경" value={`${stats.todayCount}건`} />
        <SummaryCard
          label="최다 변경 품목"
          value={stats.topItem?.[0] ?? '없음'}
          sub={stats.topItem ? `${stats.topItem[1]}회` : undefined}
          accent="text-pink-700"
        />
        <SummaryCard
          label="0 도달 이벤트"
          value={`${stats.zeroEvents}건`}
          accent={stats.zeroEvents > 0 ? 'text-red-500' : undefined}
        />
        <SummaryCard
          label="마지막 초기화"
          value={stats.lastReset ? formatRelative(stats.lastReset.created_at) : '없음'}
        />
      </div>

      {/* 필터 — 시안 B: 배경 위 칩 레일(가로 스크롤) */}
      <div className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="품목명 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-pink-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-pink-200"
        />

        <div className="flex gap-1.5 items-center overflow-x-auto no-sb -mx-4 px-4">
          {DATE_OPTIONS.map(o => (
            <button
              key={o.key}
              onClick={() => setDateRange(o.key)}
              className={`h-9 px-3.5 shrink-0 text-xs rounded-lg border transition-colors ${
                dateRange === o.key
                  ? 'bg-pink-500 text-white border-pink-500 font-bold'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-pink-300 font-medium'
              }`}
            >
              {o.label}
            </button>
          ))}
          <span className="w-px h-5 bg-pink-100 mx-0.5 shrink-0" />
          {FIELD_OPTIONS.map(o => (
            <button
              key={o.key}
              onClick={() => setFieldFilter(o.key)}
              className={`h-9 px-3.5 shrink-0 text-xs rounded-lg border transition-colors ${
                fieldFilter === o.key
                  ? 'bg-pink-500 text-white border-pink-500 font-bold'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-pink-300 font-medium'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="h-9 text-xs border border-gray-200 rounded-lg px-3 text-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-300 bg-white"
          >
            <option value="all">전체 사용자</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button
            onClick={() => setAnomalyOnly(v => !v)}
            className={`h-9 px-3.5 text-xs font-medium rounded-lg border transition-colors ${
              anomalyOnly
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'
            }`}
          >
            0 도달만 보기
          </button>
        </div>
      </div>

      {/* 품목 타임라인 패널 */}
      {selectedItem && (
        <div className="bg-white rounded-2xl border border-pink-200 shadow-sm mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-pink-100 bg-pink-50/50">
            <div>
              <p className="text-xs text-pink-400 mb-0.5">품목 타임라인</p>
              <p className="text-sm font-bold text-gray-800">{selectedItem}</p>
              {categoryMap[selectedItem] && (
                <span className="text-xs text-pink-500">{categoryMap[selectedItem]}</span>
              )}
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              aria-label="타임라인 닫기"
              className="w-11 h-11 -mr-2 flex items-center justify-center rounded-lg hover:bg-pink-100 text-pink-400 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {itemTimeline.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-300">변경 이력이 없습니다</p>
          ) : (
            <div className="divide-y divide-pink-50 max-h-64 overflow-y-auto">
              {itemTimeline.map((log, i) => {
                const diff = log.new_value - log.old_value;
                return (
                  <div key={i} className="px-5 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(log.created_at)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${FIELD_COLOR[log.field] ?? 'bg-gray-100 text-gray-600'}`}>
                        {FIELD_LABEL[log.field] ?? log.field}
                      </span>
                      <span className="text-xs text-gray-500 truncate">{log.user_name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400">{log.old_value} → {log.new_value}</span>
                      <span className={`text-sm font-bold w-10 text-right ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 로그 목록 */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-pink-100 py-16 text-center px-4">
          {logs.length === 0 ? (
            <>
              <p className="text-sm text-gray-400">아직 변경 기록이 없습니다</p>
              <p className="text-xs text-gray-300 mt-1">재고 탭에서 수량을 바꾸면 여기에 쌓여요</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">조건에 맞는 이력이 없습니다</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedLogs.map(({ dateKey, label, entries }) => (
            <div key={dateKey} className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-pink-50 bg-pink-50/50 flex items-center justify-between">
                <span className="text-sm font-bold text-pink-700">{label}</span>
                <span className="text-xs text-gray-400">{entries.length}건</span>
              </div>
              <div className="divide-y divide-pink-50">
                {entries.map((log, i) => {
                  if (log.field === 'bulk_reset') {
                    return (
                      <div key={i} className="px-5 py-3 bg-red-50/40 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              전체 초기화
                            </span>
                            <span className="text-xs text-gray-500">{log.user_name}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 max-w-[260px] truncate">{log.item_name}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">{formatTime(log.created_at)}</span>
                          {isDeveloper && (
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              aria-label="로그 삭제"
                              title="로그 삭제"
                              className="w-9 h-9 -mr-1.5 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const diff = log.new_value - log.old_value;
                  const isAnomaly = log.new_value === 0;

                  return (
                    <div
                      key={i}
                      className={`px-5 py-3 flex items-center justify-between gap-3 ${isAnomaly ? 'bg-orange-50/30' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setSelectedItem(prev => prev === log.item_name ? null : log.item_name)}
                            className="text-sm font-medium text-gray-800 hover:text-pink-600 hover:underline underline-offset-2 transition-colors truncate max-w-[160px] text-left"
                          >
                            {log.item_name}
                          </button>
                          {categoryMap[log.item_name] && (
                            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              {categoryMap[log.item_name]}
                            </span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${FIELD_COLOR[log.field] ?? 'bg-gray-100 text-gray-600'}`}>
                            {FIELD_LABEL[log.field] ?? log.field}
                          </span>
                          {isAnomaly && (
                            <span className="text-xs text-orange-500 font-medium flex-shrink-0">0 도달</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{log.user_name}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-sm font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </p>
                          <p className="text-xs text-gray-400">{log.old_value} → {log.new_value}</p>
                          <p className="text-xs text-gray-300">{formatTime(log.created_at)}</p>
                        </div>
                        {isDeveloper && (
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            aria-label="로그 삭제"
                            title="로그 삭제"
                            className="w-9 h-9 -mr-1.5 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors self-center shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
