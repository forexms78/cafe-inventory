const SURFACE_WHITE  = ['#ffffff', '#fffcfd', '#fff9fb'];
const SURFACE_PINK   = ['#fce7f3', '#fbcfe8', '#ffe4e6', '#fdf4ff'];
const SURFACE_ACCENT = ['#f472b6', '#f9a8d4', '#e9d5ff', '#fecaca', '#fed7aa'];
const SURFACE_DARK   = ['#374151', '#4b5563', '#6b7280', '#1f2937'];
const SPARK_COLORS   = ['#f97316', '#fbbf24', '#ef4444', '#fb923c', '#fcd34d', '#f472b6', '#a78bfa', '#34d399', '#ffffff', '#60a5fa'];

const GRAVITY       = 1600;   // px/s²
const WAVE_DURATION = 0.75;   // 충격파가 화면 끝까지 도달하는 시간(초)

interface Particle {
  cx: number; cy: number;
  w: number; h: number;
  color: string;
  vx: number; vy: number;
  rotV: number; rot0: number;
  delay: number; duration: number;
  isCircle: boolean;
}

function rnd(min: number, max: number) { return min + Math.random() * (max - min); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function pickColor(relY: number): string {
  const r = Math.random();
  if (r < 0.50) return pick(SURFACE_WHITE);
  if (r < 0.70) return pick(SURFACE_PINK);
  if (r < 0.85) return pick(SURFACE_ACCENT);
  if ((relY % 20) < 7 && Math.random() < 0.6) return pick(SURFACE_DARK);
  return SURFACE_WHITE[0];
}

export function fireExplosion(
  rects: { x: number; y: number; width: number; height: number }[],
  onDone: () => void,
): () => void {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const scx = W / 2;
  const scy = H / 2;
  // 화면 대각선 절반 = 충격파 최대 도달 거리
  const maxDist = Math.sqrt(W * W + H * H) / 2;

  // 화면 흔들림
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes __xshake {
      0%,100% { transform: translate(0,0) rotate(0deg); }
      8%   { transform: translate(-22px, 16px) rotate(-1.5deg); }
      18%  { transform: translate(22px,-16px) rotate(1.5deg); }
      30%  { transform: translate(-17px, 19px) rotate(-1deg); }
      42%  { transform: translate(17px,-13px) rotate(1deg); }
      56%  { transform: translate(-12px, 14px); }
      70%  { transform: translate(12px, -9px); }
      85%  { transform: translate(-6px, 6px); }
      95%  { transform: translate(4px, -3px); }
    }
  `;
  document.head.appendChild(shakeStyle);
  document.body.style.animation = '__xshake 0.75s ease-out forwards';
  const shakeTimer = setTimeout(() => { document.body.style.animation = ''; }, 800);

  // 캔버스 즉시 삽입
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;';
  canvas.width = W;
  canvas.height = H;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  const particles: Particle[] = [];

  // 충격파 도달 시점으로 딜레이 계산
  function waveDelay(ox: number, oy: number): number {
    const dx = ox - scx;
    const dy = oy - scy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return (dist / maxDist) * WAVE_DURATION + rnd(0, 0.04);
  }

  rects.forEach(rect => {
    // 레이어 A: 잔 조각 (5px)
    const A = 5;
    const aCols = Math.ceil(rect.width / A);
    const aRows = Math.ceil(rect.height / A);
    const aStep = Math.max(1, (aCols * aRows) / 300);
    for (let idx = 0; idx < aCols * aRows; idx += aStep) {
      const i = Math.floor(idx);
      const ox = rect.x + (i % aCols) * A + A / 2;
      const oy = rect.y + Math.floor(i / aCols) * A + A / 2;
      const dx = ox - scx; const dy = oy - scy;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const spd = rnd(700, 2000);
      particles.push({
        cx: ox, cy: oy,
        w: rnd(3, 5), h: rnd(3, 5),
        color: pickColor(oy - rect.y),
        vx: (dx / d) * spd * rnd(0.7, 1.4),
        vy: (dy / d) * spd * rnd(0.2, 0.7) - rnd(150, 500),
        rotV: rnd(-30, 30), rot0: rnd(0, Math.PI * 2),
        delay: waveDelay(ox, oy),
        duration: rnd(2.0, 3.5),
        isCircle: false,
      });
    }

    // 레이어 B: 중간 조각 (20px)
    const B = 20;
    const bCols = Math.ceil(rect.width / B);
    const bRows = Math.ceil(rect.height / B);
    const bStep = Math.max(1, (bCols * bRows) / 60);
    for (let idx = 0; idx < bCols * bRows; idx += bStep) {
      const i = Math.floor(idx);
      const ox = rect.x + (i % bCols) * B + B / 2;
      const oy = rect.y + Math.floor(i / bCols) * B + B / 2;
      const dx = ox - scx; const dy = oy - scy;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const spd = rnd(450, 1400);
      particles.push({
        cx: ox, cy: oy,
        w: rnd(10, 20), h: rnd(8, 18),
        color: pickColor(oy - rect.y),
        vx: (dx / d) * spd * rnd(0.6, 1.2),
        vy: (dy / d) * spd * rnd(0.2, 0.6) - rnd(300, 700),
        rotV: rnd(-18, 18), rot0: rnd(0, Math.PI * 2),
        delay: waveDelay(ox, oy),
        duration: rnd(2.3, 4.0),
        isCircle: false,
      });
    }

    // 레이어 C: 큰 덩어리 (42px)
    const C = 42;
    const cCols = Math.ceil(rect.width / C);
    const cRows = Math.ceil(rect.height / C);
    const cStep = Math.max(1, (cCols * cRows) / 14);
    for (let idx = 0; idx < cCols * cRows; idx += cStep) {
      const i = Math.floor(idx);
      const ox = rect.x + (i % cCols) * C + C / 2;
      const oy = rect.y + Math.floor(i / cCols) * C + C / 2;
      const dx = ox - scx; const dy = oy - scy;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const spd = rnd(250, 900);
      particles.push({
        cx: ox, cy: oy,
        w: rnd(25, 42), h: rnd(20, 38),
        color: pickColor(oy - rect.y),
        vx: (dx / d) * spd * rnd(0.5, 1.1),
        vy: (dy / d) * spd * rnd(0.15, 0.5) - rnd(400, 900),
        rotV: rnd(-10, 10), rot0: rnd(0, Math.PI * 2),
        delay: waveDelay(ox, oy),
        duration: rnd(2.8, 4.5),
        isCircle: false,
      });
    }
  });

  // 중심 스파크: 즉시 폭발 (딜레이 0)
  for (let i = 0; i < 180; i++) {
    const angle = rnd(0, Math.PI * 2);
    const spd = rnd(400, 2200);
    const size = rnd(2, 14);
    particles.push({
      cx: scx + rnd(-60, 60),
      cy: scy + rnd(-60, 60),
      w: size, h: size,
      color: pick(SPARK_COLORS),
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - rnd(0, 400),
      rotV: rnd(-25, 25), rot0: 0,
      delay: rnd(0, 0.06),
      duration: rnd(1.2, 2.8),
      isCircle: Math.random() > 0.35,
    });
  }

  const shockCenters = rects.map(r => ({ cx: r.x + r.width / 2, cy: r.y + r.height / 2 }));
  const TOTAL = 4.5;
  const startTime = performance.now();
  let rafId: number;
  let cancelled = false;

  const animate = (now: number) => {
    if (cancelled) return;
    const t = (now - startTime) / 1000;
    ctx.clearRect(0, 0, W, H);

    // 플래시 (0~0.22s)
    if (t < 0.22) {
      const ft = t / 0.22;
      ctx.fillStyle = `rgba(255, 220, 120, ${(0.88 * (1 - ft * ft)).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 충격파 링: WAVE_DURATION에 맞춰 확장
    if (t < WAVE_DURATION + 0.15) {
      const sw = Math.min(1, t / WAVE_DURATION);
      const maxR = maxDist;
      shockCenters.forEach(({ cx, cy }) => {
        const a1 = Math.max(0, (1 - sw) * 0.75);
        ctx.strokeStyle = `rgba(255, 190, 60, ${a1.toFixed(3)})`;
        ctx.lineWidth = Math.max(1, (1 - sw) * 22);
        ctx.beginPath();
        ctx.arc(cx, cy, sw * maxR, 0, Math.PI * 2);
        ctx.stroke();

        if (t < WAVE_DURATION * 0.6) {
          const sw2 = t / (WAVE_DURATION * 0.6);
          const a2 = Math.max(0, (1 - sw2) * 0.45);
          ctx.strokeStyle = `rgba(255, 255, 255, ${a2.toFixed(3)})`;
          ctx.lineWidth = Math.max(1, (1 - sw2) * 10);
          ctx.beginPath();
          ctx.arc(cx, cy, sw2 * maxR * 0.55, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }

    let anyActive = t < 0.22;

    for (const p of particles) {
      const pt = t - p.delay;

      if (pt <= 0) {
        // 충격파 도달 전: 원래 위치에 정적으로 그림 (UI가 서 있는 것처럼)
        anyActive = true;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = p.color;
        if (p.isCircle) {
          ctx.beginPath();
          ctx.arc(p.cx, p.cy, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(p.cx - p.w / 2, p.cy - p.h / 2, p.w, p.h);
        }
        ctx.restore();
        continue;
      }

      // 충격파 통과 후: 중력 포물선으로 날아감
      const progress = pt / p.duration;
      if (progress >= 1) continue;
      anyActive = true;

      const px = p.cx + p.vx * pt;
      const py = p.cy + p.vy * pt + 0.5 * GRAVITY * pt * pt;
      const rot = p.rot0 + p.rotV * pt;
      const alpha = progress < 0.7 ? 1 : Math.max(0, 1 - (progress - 0.7) / 0.3);
      const scale = progress > 0.8 ? Math.max(0.01, 1 - (progress - 0.8) / 0.2) : 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(px, py);
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

    if (anyActive && t < TOTAL) {
      rafId = requestAnimationFrame(animate);
    } else {
      canvas.remove();
      shakeStyle.remove();
      onDone();
    }
  };

  rafId = requestAnimationFrame(animate);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    clearTimeout(shakeTimer);
    canvas.remove();
    shakeStyle.remove();
    document.body.style.animation = '';
  };
}
