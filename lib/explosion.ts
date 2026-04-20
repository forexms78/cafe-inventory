const SURFACE_WHITE  = ['#ffffff', '#fffcfd', '#fff9fb'];
const SURFACE_PINK   = ['#fce7f3', '#fbcfe8', '#ffe4e6', '#fdf4ff'];
const SURFACE_ACCENT = ['#f472b6', '#f9a8d4', '#e9d5ff', '#fecaca', '#fed7aa'];
const SURFACE_DARK   = ['#374151', '#4b5563', '#6b7280', '#1f2937'];
const SPARK_COLORS   = ['#f97316', '#fbbf24', '#ef4444', '#fb923c', '#fcd34d', '#f472b6', '#a78bfa', '#34d399', '#fff', '#60a5fa'];

const GRAVITY       = 2000;  // px/s² — 묵직하게 낙하
const WAVE_DURATION = 1.2;   // 스윕이 화면 위→아래 지나는 시간(초)

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

  // 화면 흔들림
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes __xshake {
      0%,100% { transform: translate(0,0) rotate(0deg); }
      7%   { transform: translate(-20px, 14px) rotate(-1.3deg); }
      16%  { transform: translate(20px,-14px) rotate(1.3deg); }
      28%  { transform: translate(-15px, 17px) rotate(-0.9deg); }
      40%  { transform: translate(15px,-11px) rotate(0.9deg); }
      54%  { transform: translate(-10px, 12px); }
      68%  { transform: translate(10px, -8px); }
      83%  { transform: translate(-5px, 5px); }
      94%  { transform: translate(3px, -2px); }
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

  // 위→아래 스윕 딜레이: 화면 Y위치 기반 + 카드 안에서도 행(row) 차이 반영
  function sweepDelay(oy: number): number {
    return (oy / H) * WAVE_DURATION + rnd(0, 0.05);
  }

  rects.forEach(rect => {
    const cx_rect = rect.x + rect.width / 2;
    const cy_rect = rect.y + rect.height / 2;

    // 레이어 A: 잔 조각 (5px)
    const A = 5;
    const aCols = Math.ceil(rect.width / A);
    const aRows = Math.ceil(rect.height / A);
    const aStep = Math.max(1, (aCols * aRows) / 320);
    for (let idx = 0; idx < aCols * aRows; idx += aStep) {
      const i = Math.floor(idx);
      const ox = rect.x + (i % aCols) * A + A / 2;
      const oy = rect.y + Math.floor(i / aCols) * A + A / 2;
      const dx = ox - scx; const dy = oy - scy;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      // 방향: 외측 30% + 하향 낙하 70%
      const spd = rnd(300, 900);
      particles.push({
        cx: ox, cy: oy,
        w: rnd(3, 6), h: rnd(3, 6),
        color: pickColor(oy - rect.y),
        vx: (dx / d) * spd * 0.3 + rnd(-150, 150),
        vy: (dy / d) * spd * 0.1 + rnd(-200, 100),
        rotV: rnd(-28, 28), rot0: rnd(0, Math.PI * 2),
        delay: sweepDelay(oy),
        duration: rnd(1.8, 3.2),
        isCircle: false,
      });
    }

    // 레이어 B: 중간 조각 (18px)
    const B = 18;
    const bCols = Math.ceil(rect.width / B);
    const bRows = Math.ceil(rect.height / B);
    const bStep = Math.max(1, (bCols * bRows) / 70);
    for (let idx = 0; idx < bCols * bRows; idx += bStep) {
      const i = Math.floor(idx);
      const ox = rect.x + (i % bCols) * B + B / 2;
      const oy = rect.y + Math.floor(i / bCols) * B + B / 2;
      const dx = ox - cx_rect; const dy = oy - cy_rect;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const spd = rnd(200, 700);
      particles.push({
        cx: ox, cy: oy,
        w: rnd(9, 18), h: rnd(8, 16),
        color: pickColor(oy - rect.y),
        vx: (dx / d) * spd * 0.4 + rnd(-100, 100),
        vy: (dy / d) * spd * 0.15 + rnd(-300, 50),
        rotV: rnd(-16, 16), rot0: rnd(0, Math.PI * 2),
        delay: sweepDelay(oy),
        duration: rnd(2.2, 3.8),
        isCircle: false,
      });
    }

    // 레이어 C: 큰 덩어리 (40px) — 카드 자체 중심 기준 방향
    const C = 40;
    const cCols = Math.ceil(rect.width / C);
    const cRows = Math.ceil(rect.height / C);
    const cStep = Math.max(1, (cCols * cRows) / 16);
    for (let idx = 0; idx < cCols * cRows; idx += cStep) {
      const i = Math.floor(idx);
      const ox = rect.x + (i % cCols) * C + C / 2;
      const oy = rect.y + Math.floor(i / cCols) * C + C / 2;
      const dx = ox - cx_rect; const dy = oy - cy_rect;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const spd = rnd(150, 550);
      particles.push({
        cx: ox, cy: oy,
        w: rnd(24, 40), h: rnd(18, 35),
        color: pickColor(oy - rect.y),
        vx: (dx / d) * spd * 0.5 + rnd(-80, 80),
        vy: (dy / d) * spd * 0.2 + rnd(-400, -100),
        rotV: rnd(-9, 9), rot0: rnd(0, Math.PI * 2),
        delay: sweepDelay(oy),
        duration: rnd(2.6, 4.2),
        isCircle: false,
      });
    }
  });

  // 중심 스파크 (즉시)
  for (let i = 0; i < 160; i++) {
    const angle = rnd(0, Math.PI * 2);
    const spd = rnd(300, 2000);
    const size = rnd(2, 12);
    particles.push({
      cx: scx + rnd(-80, 80),
      cy: scy + rnd(-80, 80),
      w: size, h: size,
      color: pick(SPARK_COLORS),
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - rnd(0, 300),
      rotV: rnd(-25, 25), rot0: 0,
      delay: rnd(0, 0.05),
      duration: rnd(1.0, 2.5),
      isCircle: Math.random() > 0.35,
    });
  }

  const TOTAL = 4.5;
  const startTime = performance.now();
  let rafId: number;
  let cancelled = false;

  const animate = (now: number) => {
    if (cancelled) return;
    const t = (now - startTime) / 1000;
    ctx.clearRect(0, 0, W, H);

    // 플래시 (0~0.18s)
    if (t < 0.18) {
      const ft = t / 0.18;
      ctx.fillStyle = `rgba(255, 230, 130, ${(0.85 * (1 - ft * ft)).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 철거 스윕 라인 — 위에서 아래로 내려오는 빛줄기
    if (t < WAVE_DURATION + 0.1) {
      const sweepProgress = Math.min(1, t / WAVE_DURATION);
      const sweepY = sweepProgress * H;
      const lineAlpha = Math.max(0, 1 - t / (WAVE_DURATION + 0.1));

      // 후광 (넓은 glow)
      const grad = ctx.createLinearGradient(0, sweepY - 60, 0, sweepY + 20);
      grad.addColorStop(0, `rgba(255, 200, 50, 0)`);
      grad.addColorStop(0.6, `rgba(255, 220, 80, ${(lineAlpha * 0.35).toFixed(3)})`);
      grad.addColorStop(1, `rgba(255, 255, 150, ${(lineAlpha * 0.7).toFixed(3)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, sweepY - 60, W, 80);

      // 선명한 중심선
      ctx.strokeStyle = `rgba(255, 255, 200, ${(lineAlpha * 0.95).toFixed(3)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, sweepY);
      ctx.lineTo(W, sweepY);
      ctx.stroke();
    }

    let anyActive = t < 0.18;

    for (const p of particles) {
      const pt = t - p.delay;

      if (pt <= 0) {
        // 스윕 전: 원래 위치에 정적 렌더
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

      // 스윕 통과 후: 중력 낙하
      const progress = pt / p.duration;
      if (progress >= 1) continue;
      anyActive = true;

      const px = p.cx + p.vx * pt;
      const py = p.cy + p.vy * pt + 0.5 * GRAVITY * pt * pt;
      const rot = p.rot0 + p.rotV * pt;
      const alpha = progress < 0.65 ? 1 : Math.max(0, 1 - (progress - 0.65) / 0.35);
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
