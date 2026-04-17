'use client';
import { useEffect, useState } from 'react';

interface Props {
  progress: number;
  visible: boolean;
}

const MESSAGES = [
  '잔해 수거 중...',
  '기초 공사 진행 중...',
  '골조 세우는 중...',
  '내장재 시공 중...',
  '마감 작업 중...',
  '품질 검수 중...',
  '거의 다 됐어요...',
];

export default function ExplosionOverlay({ progress, visible }: Props) {
  const [dots, setDots] = useState('');
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const dotsInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(dotsInterval);
  }, [visible]);

  useEffect(() => {
    setMsgIndex(Math.min(Math.floor(progress / 15), MESSAGES.length - 1));
  }, [progress]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col items-center justify-center gap-8 select-none">

      {/* 크레인 SVG */}
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="opacity-90">
        {/* 타워 */}
        <rect x="52" y="20" width="10" height="70" fill="#f59e0b" />
        {/* 수평 암 */}
        <rect x="20" y="20" width="80" height="8" fill="#f59e0b" />
        {/* 카운터웨이트 */}
        <rect x="20" y="28" width="20" height="12" fill="#78716c" />
        {/* 와이어 */}
        <line x1="90" y1="28" x2="90" y2="60" stroke="#d1d5db" strokeWidth="1.5" />
        {/* 훅 */}
        <rect x="84" y="58" width="12" height="8" rx="2" fill="#d97706" />
        {/* 기초 */}
        <rect x="44" y="88" width="26" height="8" rx="2" fill="#f59e0b" />
        {/* 경고 줄무늬 */}
        <rect x="52" y="30" width="10" height="4" fill="#1c1917" opacity="0.3" />
        <rect x="52" y="42" width="10" height="4" fill="#1c1917" opacity="0.3" />
        <rect x="52" y="54" width="10" height="4" fill="#1c1917" opacity="0.3" />
      </svg>

      {/* 타이틀 */}
      <div className="text-center">
        <p className="text-amber-400 text-3xl font-bold tracking-wide mb-1">재건설합니다</p>
        <p className="text-gray-400 text-sm">{MESSAGES[msgIndex]}{dots}</p>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-72">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>공사 진행률</span>
          <span className="text-amber-400 font-bold">{Math.floor(progress)}%</span>
        </div>
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${progress}%`,
              background: 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 10px, #d97706 10px, #d97706 20px)',
            }}
          />
        </div>
      </div>

      {/* 하단 경고 텍스트 */}
      <p className="text-gray-600 text-xs">⚠ 공사 중 접근 금지</p>
    </div>
  );
}
