'use client';
import { useMemo } from 'react';

const SECTION_COLORS = [
  ['#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#fff1f2'],
  ['#fdf4ff', '#fce7f3', '#e9d5ff', '#c084fc', '#fdf2f8'],
  ['#fff7ed', '#ffedd5', '#fed7aa', '#fb923c', '#fffbeb'],
  ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f472b6', '#ffffff'],
  ['#fff1f2', '#ffe4e6', '#fecaca', '#f87171', '#ffffff'],
  ['#f0fdf4', '#dcfce7', '#bbf7d0', '#4ade80', '#ffffff'],
  ['#eff6ff', '#dbeafe', '#bfdbfe', '#60a5fa', '#ffffff'],
];

const SPARK_COLORS = ['#f97316', '#fbbf24', '#ef4444', '#fb923c', '#ffffff', '#fcd34d', '#f472b6', '#a78bfa', '#34d399'];

interface Tile {
  id: number;
  x: number;
  y: number;
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
  left: number;
  top: number;
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
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    rects.forEach((rect, si) => {
      const palette = SECTION_COLORS[si % SECTION_COLORS.length];

      // ── 잔해 레이어 1: 미세 파편 (8px) ─────────────────────────
      const FINE = 8;
      const fineCols = Math.ceil(rect.width / FINE);
      const fineRows = Math.ceil(rect.height / FINE);
      const fineTotal = fineCols * fineRows;
      const fineStep = Math.max(1, fineTotal / 100);

      for (let idx = 0; idx < fineTotal; idx += fineStep) {
        const i = Math.floor(idx);
        const col = i % fineCols;
        const row = Math.floor(i / fineCols);
        const ox = rect.x + col * FINE + FINE / 2;
        const oy = rect.y + row * FINE + FINE / 2;
        const dx = ox - cx;
        const dy = oy - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 700 + Math.random() * 1000;
        const grav = 350 + Math.random() * 400;

        tiles.push({
          id: tiles.length,
          x: rect.x + col * FINE,
          y: rect.y + row * FINE,
          w: FINE * (0.3 + Math.random() * 0.9),
          h: FINE * (0.3 + Math.random() * 0.9),
          color: palette[Math.floor(Math.random() * palette.length)],
          txPx: (dx / dist) * speed * (0.7 + Math.random() * 0.9),
          tyPx: (dy / dist) * speed * 0.45 * (0.6 + Math.random()) + grav,
          rot: (Math.random() - 0.5) * 2400,
          duration: 1.0 + Math.random() * 0.8,
          delay: Math.random() * 0.15,
        });
      }

      // ── 잔해 레이어 2: 중간 조각 (20px) ────────────────────────
      const MED = 20;
      const medCols = Math.ceil(rect.width / MED);
      const medRows = Math.ceil(rect.height / MED);
      const medTotal = medCols * medRows;
      const medStep = Math.max(1, medTotal / 50);

      for (let idx = 0; idx < medTotal; idx += medStep) {
        const i = Math.floor(idx);
        const col = i % medCols;
        const row = Math.floor(i / medCols);
        const ox = rect.x + col * MED + MED / 2;
        const oy = rect.y + row * MED + MED / 2;
        const dx = ox - cx;
        const dy = oy - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 500 + Math.random() * 800;
        const grav = 250 + Math.random() * 350;

        tiles.push({
          id: tiles.length,
          x: rect.x + col * MED,
          y: rect.y + row * MED,
          w: MED * (0.5 + Math.random() * 0.7),
          h: MED * (0.4 + Math.random() * 0.7),
          color: palette[Math.floor(Math.random() * palette.length)],
          txPx: (dx / dist) * speed * (0.6 + Math.random() * 0.9),
          tyPx: (dy / dist) * speed * 0.4 * (0.6 + Math.random()) + grav,
          rot: (Math.random() - 0.5) * 1800,
          duration: 1.1 + Math.random() * 0.9,
          delay: Math.random() * 0.18,
        });
      }

      // ── 잔해 레이어 3: 큰 덩어리 (40px) ────────────────────────
      const CHUNK = 40;
      const chunkCols = Math.ceil(rect.width / CHUNK);
      const chunkRows = Math.ceil(rect.height / CHUNK);
      const chunkTotal = chunkCols * chunkRows;
      const chunkStep = Math.max(1, chunkTotal / 12);

      for (let idx = 0; idx < chunkTotal; idx += chunkStep) {
        const i = Math.floor(idx);
        const col = i % chunkCols;
        const row = Math.floor(i / chunkCols);
        const ox = rect.x + col * CHUNK + CHUNK / 2;
        const oy = rect.y + row * CHUNK + CHUNK / 2;
        const dx = ox - cx;
        const dy = oy - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 350 + Math.random() * 550;
        const grav = 200 + Math.random() * 300;

        tiles.push({
          id: tiles.length,
          x: rect.x + col * CHUNK,
          y: rect.y + row * CHUNK,
          w: CHUNK * (0.55 + Math.random() * 0.65),
          h: CHUNK * (0.55 + Math.random() * 0.65),
          color: palette[Math.floor(Math.random() * palette.length)],
          txPx: (dx / dist) * speed * (0.5 + Math.random()),
          tyPx: (dy / dist) * speed * 0.4 * (0.5 + Math.random()) + grav,
          rot: (Math.random() - 0.5) * 1200,
          duration: 1.2 + Math.random() * 1.0,
          delay: Math.random() * 0.22,
        });
      }
    });

    // ── 중심 스파크 ───────────────────────────────────────────────
    const sparks: Spark[] = Array.from({ length: 140 }, (_, i) => {
      const angle = (i / 140) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const dist = 28 + Math.random() * 68;
      return {
        id: i,
        left: 50 + (Math.random() - 0.5) * 22,
        top: 45 + (Math.random() - 0.5) * 22,
        txVw: Math.cos(angle) * dist * (0.9 + Math.random() * 0.9),
        tyVh: Math.sin(angle) * dist * (0.9 + Math.random() * 0.9),
        rot: (Math.random() - 0.5) * 2400,
        size: Math.random() * 11 + 2,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        duration: 0.8 + Math.random() * 1.0,
        delay: Math.random() * 0.15,
        isCircle: Math.random() > 0.3,
      };
    });

    return { tiles, sparks };
  }, [rects]);

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
      <style>{`
        @keyframes tile-shatter {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
          8%   { opacity: 1; }
          100% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(0.01); opacity: 0; }
        }
        @keyframes spark-fly {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(var(--sx),var(--sy)) rotate(var(--srot)) scale(0.01); opacity: 0; }
        }
        @keyframes screen-flash {
          0%   { opacity: 0.95; }
          30%  { opacity: 0.7; }
          100% { opacity: 0; }
        }
        @keyframes screen-shake {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          8%      { transform: translate(-14px, 10px) rotate(-0.8deg); }
          18%     { transform: translate(14px, -10px) rotate(0.8deg); }
          28%     { transform: translate(-11px, 12px) rotate(-0.5deg); }
          38%     { transform: translate(11px, -8px) rotate(0.5deg); }
          50%     { transform: translate(-8px, 9px); }
          65%     { transform: translate(8px, -6px); }
          80%     { transform: translate(-4px, 4px); }
          92%     { transform: translate(3px, -2px); }
        }
      `}</style>

      {/* 화면 흔들림 */}
      <div className="fixed inset-0" style={{ animation: 'screen-shake 0.6s ease-out forwards' }} />

      {/* 플래시 */}
      <div
        className="fixed inset-0 z-[9999] bg-orange-50"
        style={{ animation: 'screen-flash 0.3s ease-out forwards' }}
      />

      {/* 타일 파편 전부 */}
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
            border: '1px solid rgba(244,114,182,0.2)',
            borderRadius: '2px',
            ['--tx' as string]: `${t.txPx}px`,
            ['--ty' as string]: `${t.tyPx}px`,
            ['--rot' as string]: `${t.rot}deg`,
            animation: `tile-shatter ${t.duration}s cubic-bezier(0.1,0.8,0.3,1) ${t.delay}s forwards`,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* 스파크 */}
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
            animation: `spark-fly ${s.duration}s cubic-bezier(0.1,0.9,0.3,1) ${s.delay}s forwards`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}
