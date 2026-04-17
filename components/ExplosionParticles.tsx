'use client';
import { useMemo } from 'react';

// 섹션별 파편 색상 팔레트 (UI 색상 근사)
const SECTION_COLORS = [
  ['#fce7f3', '#fbcfe8', '#f9a8d4', '#ffffff', '#fff1f2'],
  ['#fdf4ff', '#fce7f3', '#e9d5ff', '#ffffff', '#fdf2f8'],
  ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#ffffff'],
  ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f472b6', '#ffffff'],
  ['#fff1f2', '#ffe4e6', '#fecaca', '#fca5a5', '#ffffff'],
];

const SPARK_COLORS = ['#f97316', '#fbbf24', '#ef4444', '#fb923c', '#ffffff', '#fcd34d'];

interface Tile {
  id: number;
  x: number;      // px from viewport left
  y: number;      // px from viewport top
  w: number;
  h: number;
  color: string;
  txPx: number;
  tyPx: number;
  rot: number;
  duration: number;
  delay: number;
}

interface Spark {
  id: number;
  left: number;   // vw %
  top: number;    // vh %
  txVw: number;
  tyVh: number;
  rot: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  isCircle: boolean;
}

interface Props {
  rects: { x: number; y: number; width: number; height: number }[];
}

export default function ExplosionParticles({ rects }: Props) {
  const { tiles, sparks } = useMemo(() => {
    const tiles: Tile[] = [];
    const TILE = 22; // 타일 크기 px
    const MAX_PER_SECTION = 45;

    rects.forEach((rect, si) => {
      const cols = Math.ceil(rect.width / TILE);
      const rows = Math.ceil(rect.height / TILE);
      const total = cols * rows;
      const step = total > MAX_PER_SECTION ? total / MAX_PER_SECTION : 1;
      const palette = SECTION_COLORS[si % SECTION_COLORS.length];
      let count = 0;

      for (let idx = 0; idx < total; idx += step) {
        const i = Math.floor(idx);
        const c = i % cols;
        const r = Math.floor(i / cols);
        const cx = rect.x + c * TILE + TILE / 2;
        const cy = rect.y + r * TILE + TILE / 2;

        // 중심으로부터의 방향 + 랜덤
        const dx = cx - window.innerWidth / 2;
        const dy = cy - window.innerHeight / 2;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 300 + Math.random() * 500;
        const gravity = 150 + Math.random() * 200; // 아래로 가속

        tiles.push({
          id: tiles.length,
          x: rect.x + c * TILE,
          y: rect.y + r * TILE,
          w: Math.min(TILE, rect.width - c * TILE) + Math.random() * 4,
          h: Math.min(TILE, rect.height - r * TILE) + Math.random() * 4,
          color: palette[Math.floor(Math.random() * palette.length)],
          txPx: (dx / dist) * speed * (0.5 + Math.random()),
          tyPx: (dy / dist) * (speed * 0.5) * (0.5 + Math.random()) + gravity,
          rot: (Math.random() - 0.5) * 1440,
          duration: 0.45 + Math.random() * 0.5,
          delay: Math.random() * 0.1,
        });

        if (++count >= MAX_PER_SECTION) break;
      }
    });

    // 중심 스파크 (불꽃 느낌)
    const sparks: Spark[] = Array.from({ length: 60 }, (_, i) => {
      const angle = (i / 60) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const dist = 20 + Math.random() * 55;
      return {
        id: i,
        left: 50 + (Math.random() - 0.5) * 15,
        top: 45 + (Math.random() - 0.5) * 15,
        txVw: Math.cos(angle) * dist * (0.8 + Math.random() * 0.8),
        tyVh: Math.sin(angle) * dist * (0.8 + Math.random() * 0.8),
        rot: (Math.random() - 0.5) * 1800,
        size: Math.random() * 8 + 2,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        duration: 0.3 + Math.random() * 0.5,
        delay: Math.random() * 0.1,
        isCircle: Math.random() > 0.4,
      };
    });

    return { tiles, sparks };
  }, [rects]);

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
      <style>{`
        @keyframes tile-shatter {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
          15%  { opacity: 1; }
          100% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(0.05); opacity: 0; }
        }
        @keyframes spark-fly {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(var(--sx),var(--sy)) rotate(var(--srot)) scale(0.05); opacity: 0; }
        }
        @keyframes screen-flash {
          0%   { opacity: 0.85; }
          100% { opacity: 0; }
        }
        @keyframes screen-shake {
          0%,100% { transform: translate(0,0); }
          15%     { transform: translate(-8px, 5px); }
          30%     { transform: translate(8px, -5px); }
          50%     { transform: translate(-5px, 7px); }
          70%     { transform: translate(5px, -3px); }
          85%     { transform: translate(-3px, 4px); }
        }
      `}</style>

      {/* 화면 흔들림 */}
      <div className="fixed inset-0" style={{ animation: 'screen-shake 0.3s ease-out forwards' }} />

      {/* 플래시 */}
      <div
        className="fixed inset-0 z-[9999] bg-orange-200"
        style={{ animation: 'screen-flash 0.2s ease-out forwards' }}
      />

      {/* 섹션 타일 파편 */}
      {tiles.map(t => (
        <div
          key={`t-${t.id}`}
          style={{
            position: 'fixed',
            left: t.x,
            top: t.y,
            width: t.w,
            height: t.h,
            backgroundColor: t.color,
            border: '1px solid rgba(244,114,182,0.3)',
            borderRadius: '2px',
            ['--tx' as string]: `${t.txPx}px`,
            ['--ty' as string]: `${t.tyPx}px`,
            ['--rot' as string]: `${t.rot}deg`,
            animation: `tile-shatter ${t.duration}s cubic-bezier(0.2, 0.8, 0.4, 1) ${t.delay}s forwards`,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* 중심 스파크 */}
      {sparks.map(s => (
        <div
          key={`s-${s.id}`}
          style={{
            position: 'fixed',
            left: `${s.left}vw`,
            top: `${s.top}vh`,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            borderRadius: s.isCircle ? '50%' : '2px',
            ['--sx' as string]: `${s.txVw}vw`,
            ['--sy' as string]: `${s.tyVh}vh`,
            ['--srot' as string]: `${s.rot}deg`,
            animation: `spark-fly ${s.duration}s cubic-bezier(0.1, 0.9, 0.3, 1) ${s.delay}s forwards`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}
