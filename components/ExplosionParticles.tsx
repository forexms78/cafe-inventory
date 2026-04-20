'use client';
import { useEffect, useRef } from 'react';

const SURFACE_WHITE  = ['#ffffff', '#ffffff', '#ffffff', '#fffcfd', '#fff9fb'];
const SURFACE_PINK   = ['#fce7f3', '#fbcfe8', '#fff1f2', '#ffe4e6', '#fdf4ff'];
const SURFACE_ACCENT = ['#f472b6', '#f9a8d4', '#e9d5ff', '#fecaca', '#fed7aa'];
const SURFACE_DARK   = ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#1f2937'];
const SPARK_COLORS   = ['#f97316', '#fbbf24', '#ef4444', '#fb923c', '#fff', '#fcd34d', '#f472b6', '#a78bfa', '#34d399'];

interface Particle {
  x: number; y: number;
  w: number; h: number;
  color: string;
  txPx: number; tyPx: number;
  rotRad: number;
  duration: number;
  delay: number;
  isCircle: boolean;
}

interface Props {
  rects: { x: number; y: number; width: number; height: number }[];
}

function pickColor(relY: number): string {
  const r = Math.random();
  if (r < 0.55) return SURFACE_WHITE[Math.floor(Math.random() * SURFACE_WHITE.length)];
  if (r < 0.75) return SURFACE_PINK[Math.floor(Math.random() * SURFACE_PINK.length)];
  if (r < 0.88) return SURFACE_ACCENT[Math.floor(Math.random() * SURFACE_ACCENT.length)];
  if ((relY % 20) < 7 && Math.random() < 0.6) return SURFACE_DARK[Math.floor(Math.random() * SURFACE_DARK.length)];
  return SURFACE_WHITE[0];
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function ExplosionParticles({ rects }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const scx = W / 2;
    const scy = H / 2;
    const DEG = Math.PI / 180;
    const particles: Particle[] = [];

    rects.forEach((rect) => {
      // Layer A: 촘촘한 표면 타일 (6px)
      const A = 6;
      const aCols = Math.ceil(rect.width / A);
      const aRows = Math.ceil(rect.height / A);
      const aTotal = aCols * aRows;
      const aStep  = Math.max(1, aTotal / 320);
      for (let idx = 0; idx < aTotal; idx += aStep) {
        const i = Math.floor(idx);
        const col = i % aCols;
        const row = Math.floor(i / aCols);
        const ox = rect.x + col * A + A / 2;
        const oy = rect.y + row * A + A / 2;
        const dx = ox - scx; const dy = oy - scy;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const spd = 800 + Math.random() * 1100;
        const g   = 280 + Math.random() * 450;
        particles.push({
          x: rect.x + col * A, y: rect.y + row * A,
          w: A * (0.55 + Math.random() * 0.65), h: A * (0.55 + Math.random() * 0.65),
          color: pickColor(oy - rect.y),
          txPx: (dx / d) * spd * (0.7 + Math.random() * 0.9),
          tyPx: (dy / d) * spd * 0.45 * (0.6 + Math.random()) + g,
          rotRad: (Math.random() - 0.5) * 2800 * DEG,
          duration: 1.3 + Math.random() * 1.0, delay: Math.random() * 0.04,
          isCircle: false,
        });
      }

      // Layer B: 중간 조각 (18px)
      const B = 18;
      const bCols = Math.ceil(rect.width / B);
      const bRows = Math.ceil(rect.height / B);
      const bTotal = bCols * bRows;
      const bStep  = Math.max(1, bTotal / 80);
      for (let idx = 0; idx < bTotal; idx += bStep) {
        const i = Math.floor(idx);
        const col = i % bCols;
        const row = Math.floor(i / bCols);
        const ox = rect.x + col * B + B / 2;
        const oy = rect.y + row * B + B / 2;
        const dx = ox - scx; const dy = oy - scy;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const spd = 550 + Math.random() * 850;
        const g   = 220 + Math.random() * 380;
        particles.push({
          x: rect.x + col * B, y: rect.y + row * B,
          w: B * (0.5 + Math.random() * 0.7), h: B * (0.5 + Math.random() * 0.7),
          color: pickColor(oy - rect.y),
          txPx: (dx / d) * spd * (0.6 + Math.random()),
          tyPx: (dy / d) * spd * 0.4 * (0.6 + Math.random()) + g,
          rotRad: (Math.random() - 0.5) * 2000 * DEG,
          duration: 1.4 + Math.random() * 1.1, delay: Math.random() * 0.06,
          isCircle: false,
        });
      }

      // Layer C: 큰 덩어리 (38px)
      const C = 38;
      const cCols = Math.ceil(rect.width / C);
      const cRows = Math.ceil(rect.height / C);
      const cTotal = cCols * cRows;
      const cStep  = Math.max(1, cTotal / 18);
      for (let idx = 0; idx < cTotal; idx += cStep) {
        const i = Math.floor(idx);
        const col = i % cCols;
        const row = Math.floor(i / cCols);
        const ox = rect.x + col * C + C / 2;
        const oy = rect.y + row * C + C / 2;
        const dx = ox - scx; const dy = oy - scy;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const spd = 350 + Math.random() * 600;
        const g   = 180 + Math.random() * 300;
        particles.push({
          x: rect.x + col * C, y: rect.y + row * C,
          w: C * (0.55 + Math.random() * 0.65), h: C * (0.55 + Math.random() * 0.65),
          color: pickColor(oy - rect.y),
          txPx: (dx / d) * spd * (0.5 + Math.random()),
          tyPx: (dy / d) * spd * 0.4 * (0.5 + Math.random()) + g,
          rotRad: (Math.random() - 0.5) * 1400 * DEG,
          duration: 1.5 + Math.random() * 1.2, delay: Math.random() * 0.08,
          isCircle: false,
        });
      }

      // Layer D: 텍스트 줄 파편
      const lineH = 22;
      const lineCount = Math.floor(rect.height / lineH);
      for (let r = 0; r < lineCount; r++) {
        for (let seg = 0; seg < 4; seg++) {
          const oy   = rect.y + r * lineH + lineH / 2;
          const segW = rect.width / 4;
          const ox   = rect.x + seg * segW + segW / 2;
          const dx   = ox - scx; const dy = oy - scy;
          const d    = Math.sqrt(dx * dx + dy * dy) || 1;
          const spd  = 600 + Math.random() * 900;
          const isText = Math.random() < 0.45;
          particles.push({
            x: rect.x + seg * segW + Math.random() * (segW * 0.3), y: oy - 1,
            w: segW * (0.25 + Math.random() * 0.55),
            h: isText ? 2 + Math.random() * 2 : 4 + Math.random() * 5,
            color: isText
              ? SURFACE_DARK[Math.floor(Math.random() * SURFACE_DARK.length)]
              : SURFACE_PINK[Math.floor(Math.random() * SURFACE_PINK.length)],
            txPx: (dx / d) * spd * (0.6 + Math.random()),
            tyPx: (dy / d) * spd * 0.4 + 180 + Math.random() * 350,
            rotRad: (Math.random() - 0.5) * 1600 * DEG,
            duration: 1.1 + Math.random() * 0.9, delay: Math.random() * 0.03,
            isCircle: false,
          });
        }
      }
    });

    // 중심 스파크
    for (let i = 0; i < 160; i++) {
      const angle = (i / 160) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist  = 30 + Math.random() * 70;
      const size  = Math.random() * 12 + 2;
      particles.push({
        x: (0.5 + (Math.random() - 0.5) * 0.25) * W - size / 2,
        y: (0.45 + (Math.random() - 0.5) * 0.25) * H - size / 2,
        w: size, h: size,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        txPx: Math.cos(angle) * dist * (0.9 + Math.random()) * W / 100,
        tyPx: Math.sin(angle) * dist * (0.9 + Math.random()) * H / 100,
        rotRad: (Math.random() - 0.5) * 2400 * DEG,
        duration: 0.9 + Math.random() * 1.1, delay: Math.random() * 0.12,
        isCircle: Math.random() > 0.3,
      });
    }

    const startTime = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, W, H);

      // 플래시
      if (elapsed < 0.3) {
        const fa = 0.95 * (1 - (elapsed / 0.3) ** 2);
        ctx.fillStyle = `rgba(255,255,255,${fa.toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }

      let anyActive = elapsed < 0.3;

      for (const p of particles) {
        const t = elapsed - p.delay;
        if (t <= 0) { anyActive = true; continue; }
        const progress = t / p.duration;
        if (progress >= 1) continue;
        anyActive = true;

        const ep    = easeOut(progress);
        const cx    = p.x + p.w / 2 + p.txPx * ep;
        const cy    = p.y + p.h / 2 + p.tyPx * ep;
        const rot   = p.rotRad * ep;
        const scale = Math.max(0.01, 1 - progress * progress * progress);
        const alpha = progress < 0.06 ? 1 : Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.scale(scale, scale);
        ctx.fillStyle = p.color;

        if (p.isCircle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }

        ctx.restore();
      }

      if (anyActive) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [rects]);

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
      <style>{`
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
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          animation: 'screen-shake 0.65s ease-out forwards',
        }}
      />
    </div>
  );
}
