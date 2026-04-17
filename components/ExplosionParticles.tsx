'use client';
import { useMemo } from 'react';

// 실제 UI 색상에 맞춘 팔레트 (흰색 카드 배경 + 핑크 테마)
const SURFACE_WHITE  = ['#ffffff', '#ffffff', '#ffffff', '#fffcfd', '#fff9fb'];
const SURFACE_PINK   = ['#fce7f3', '#fbcfe8', '#fff1f2', '#ffe4e6', '#fdf4ff'];
const SURFACE_ACCENT = ['#f472b6', '#f9a8d4', '#e9d5ff', '#fecaca', '#fed7aa'];
const SURFACE_DARK   = ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#1f2937'];
const SPARK_COLORS   = ['#f97316', '#fbbf24', '#ef4444', '#fb923c', '#fff', '#fcd34d', '#f472b6', '#a78bfa', '#34d399'];

interface Tile {
  id: number;
  x: number; y: number; w: number; h: number;
  color: string;
  txPx: number; tyPx: number; rot: number;
  duration: number; delay: number;
}
interface Spark {
  id: number;
  left: number; top: number;
  txVw: number; tyVh: number;
  rot: number; size: number; color: string;
  duration: number; delay: number; isCircle: boolean;
}
interface Props {
  rects: { x: number; y: number; width: number; height: number }[];
}

function pickColor(x: number, y: number, rectY: number): string {
  // 상단 헤더 영역 → 흰색 + 핑크 혼합
  // 중간 텍스트 줄 추정 위치 → 어두운 색(글자)
  const relY = y - rectY;
  const r = Math.random();
  if (r < 0.55) return SURFACE_WHITE[Math.floor(Math.random() * SURFACE_WHITE.length)];
  if (r < 0.75) return SURFACE_PINK[Math.floor(Math.random() * SURFACE_PINK.length)];
  if (r < 0.88) return SURFACE_ACCENT[Math.floor(Math.random() * SURFACE_ACCENT.length)];
  // 글자 색상 (텍스트 줄 근처)
  const isTextLine = (relY % 20) < 7;
  if (isTextLine && Math.random() < 0.6) return SURFACE_DARK[Math.floor(Math.random() * SURFACE_DARK.length)];
  return SURFACE_WHITE[0];
}

export default function ExplosionParticles({ rects }: Props) {
  const { tiles, sparks } = useMemo(() => {
    const tiles: Tile[] = [];
    const scx = window.innerWidth / 2;
    const scy = window.innerHeight / 2;

    rects.forEach((rect) => {
      // ── 레이어 A: 촘촘한 표면 타일 (6px) — UI를 덮는 "껍데기" ──────
      const A = 6;
      const aCols = Math.ceil(rect.width / A);
      const aRows = Math.ceil(rect.height / A);
      const aTotal = aCols * aRows;
      const aStep  = Math.max(1, aTotal / 320);

      for (let idx = 0; idx < aTotal; idx += aStep) {
        const i   = Math.floor(idx);
        const col = i % aCols;
        const row = Math.floor(i / aCols);
        const ox  = rect.x + col * A + A / 2;
        const oy  = rect.y + row * A + A / 2;
        const dx  = ox - scx;
        const dy  = oy - scy;
        const d   = Math.sqrt(dx * dx + dy * dy) || 1;
        const spd = 800 + Math.random() * 1100;
        const g   = 280 + Math.random() * 450;

        tiles.push({
          id: tiles.length,
          x: rect.x + col * A,
          y: rect.y + row * A,
          w: A * (0.55 + Math.random() * 0.65),
          h: A * (0.55 + Math.random() * 0.65),
          color: pickColor(ox, oy, rect.y),
          txPx: (dx / d) * spd * (0.7 + Math.random() * 0.9),
          tyPx: (dy / d) * spd * 0.45 * (0.6 + Math.random()) + g,
          rot: (Math.random() - 0.5) * 2800,
          duration: 1.3 + Math.random() * 1.0,
          delay: Math.random() * 0.04,   // ← 거의 동시에 출발
        });
      }

      // ── 레이어 B: 중간 조각 (18px) ───────────────────────────────
      const B = 18;
      const bCols = Math.ceil(rect.width / B);
      const bRows = Math.ceil(rect.height / B);
      const bTotal = bCols * bRows;
      const bStep  = Math.max(1, bTotal / 80);

      for (let idx = 0; idx < bTotal; idx += bStep) {
        const i   = Math.floor(idx);
        const col = i % bCols;
        const row = Math.floor(i / bCols);
        const ox  = rect.x + col * B + B / 2;
        const oy  = rect.y + row * B + B / 2;
        const dx  = ox - scx;
        const dy  = oy - scy;
        const d   = Math.sqrt(dx * dx + dy * dy) || 1;
        const spd = 550 + Math.random() * 850;
        const g   = 220 + Math.random() * 380;

        tiles.push({
          id: tiles.length,
          x: rect.x + col * B,
          y: rect.y + row * B,
          w: B * (0.5 + Math.random() * 0.7),
          h: B * (0.5 + Math.random() * 0.7),
          color: pickColor(ox, oy, rect.y),
          txPx: (dx / d) * spd * (0.6 + Math.random()),
          tyPx: (dy / d) * spd * 0.4 * (0.6 + Math.random()) + g,
          rot: (Math.random() - 0.5) * 2000,
          duration: 1.4 + Math.random() * 1.1,
          delay: Math.random() * 0.06,
        });
      }

      // ── 레이어 C: 큰 덩어리 (38px) ───────────────────────────────
      const C = 38;
      const cCols = Math.ceil(rect.width / C);
      const cRows = Math.ceil(rect.height / C);
      const cTotal = cCols * cRows;
      const cStep  = Math.max(1, cTotal / 18);

      for (let idx = 0; idx < cTotal; idx += cStep) {
        const i   = Math.floor(idx);
        const col = i % cCols;
        const row = Math.floor(i / cCols);
        const ox  = rect.x + col * C + C / 2;
        const oy  = rect.y + row * C + C / 2;
        const dx  = ox - scx;
        const dy  = oy - scy;
        const d   = Math.sqrt(dx * dx + dy * dy) || 1;
        const spd = 350 + Math.random() * 600;
        const g   = 180 + Math.random() * 300;

        tiles.push({
          id: tiles.length,
          x: rect.x + col * C,
          y: rect.y + row * C,
          w: C * (0.55 + Math.random() * 0.65),
          h: C * (0.55 + Math.random() * 0.65),
          color: pickColor(ox, oy, rect.y),
          txPx: (dx / d) * spd * (0.5 + Math.random()),
          tyPx: (dy / d) * spd * 0.4 * (0.5 + Math.random()) + g,
          rot: (Math.random() - 0.5) * 1400,
          duration: 1.5 + Math.random() * 1.2,
          delay: Math.random() * 0.08,
        });
      }

      // ── 레이어 D: 텍스트 줄 파편 (가로로 긴 조각) ────────────────
      const lineH = 22;
      const lineCount = Math.floor(rect.height / lineH);
      for (let r = 0; r < lineCount; r++) {
        for (let seg = 0; seg < 4; seg++) {
          const oy  = rect.y + r * lineH + lineH / 2;
          const segW = rect.width / 4;
          const ox  = rect.x + seg * segW + segW / 2;
          const dx  = ox - scx;
          const dy  = oy - scy;
          const d   = Math.sqrt(dx * dx + dy * dy) || 1;
          const spd = 600 + Math.random() * 900;
          const isText = Math.random() < 0.45;

          tiles.push({
            id: tiles.length,
            x: rect.x + seg * segW + Math.random() * (segW * 0.3),
            y: oy - 1,
            w: segW * (0.25 + Math.random() * 0.55),
            h: isText ? 2 + Math.random() * 2 : 4 + Math.random() * 5,
            color: isText
              ? SURFACE_DARK[Math.floor(Math.random() * SURFACE_DARK.length)]
              : SURFACE_PINK[Math.floor(Math.random() * SURFACE_PINK.length)],
            txPx: (dx / d) * spd * (0.6 + Math.random()),
            tyPx: (dy / d) * spd * 0.4 + 180 + Math.random() * 350,
            rot: (Math.random() - 0.5) * 1600,
            duration: 1.1 + Math.random() * 0.9,
            delay: Math.random() * 0.03,
          });
        }
      }
    });

    // ── 중심 스파크 ─────────────────────────────────────────────────
    const sparks: Spark[] = Array.from({ length: 160 }, (_, i) => {
      const angle = (i / 160) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist  = 30 + Math.random() * 70;
      return {
        id: i,
        left: 50 + (Math.random() - 0.5) * 25,
        top:  45 + (Math.random() - 0.5) * 25,
        txVw: Math.cos(angle) * dist * (0.9 + Math.random()),
        tyVh: Math.sin(angle) * dist * (0.9 + Math.random()),
        rot:  (Math.random() - 0.5) * 2400,
        size: Math.random() * 12 + 2,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        duration: 0.9 + Math.random() * 1.1,
        delay: Math.random() * 0.12,
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
          6%   { opacity: 1; }
          100% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(0.01); opacity: 0; }
        }
        @keyframes spark-fly {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(var(--sx),var(--sy)) rotate(var(--srot)) scale(0.01); opacity: 0; }
        }
        @keyframes screen-flash {
          0%   { opacity: 0.95; }
          25%  { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @keyframes screen-shake {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          7%      { transform: translate(-15px, 11px) rotate(-1deg); }
          17%     { transform: translate(15px, -11px) rotate(1deg); }
          28%     { transform: translate(-12px, 13px) rotate(-0.7deg); }
          38%     { transform: translate(12px, -9px) rotate(0.7deg); }
          50%     { transform: translate(-9px, 10px); }
          65%     { transform: translate(9px, -7px); }
          80%     { transform: translate(-5px, 5px); }
          93%     { transform: translate(3px, -2px); }
        }
      `}</style>

      {/* 화면 흔들림 */}
      <div className="fixed inset-0" style={{ animation: 'screen-shake 0.65s ease-out forwards' }} />

      {/* 플래시 */}
      <div
        className="fixed inset-0 z-[9999] bg-white"
        style={{ animation: 'screen-flash 0.3s ease-out forwards' }}
      />

      {/* 타일 파편 */}
      {tiles.map(t => (
        <div
          key={`t-${t.id}`}
          style={{
            position: 'fixed',
            left: t.x, top: t.y, width: t.w, height: t.h,
            backgroundColor: t.color,
            borderRadius: '1px',
            ['--tx' as string]: `${t.txPx}px`,
            ['--ty' as string]: `${t.tyPx}px`,
            ['--rot' as string]: `${t.rot}deg`,
            animation: `tile-shatter ${t.duration}s cubic-bezier(0.1,0.75,0.3,1) ${t.delay}s forwards`,
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
            left: `${s.left}vw`, top: `${s.top}vh`,
            width: s.size, height: s.size,
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
