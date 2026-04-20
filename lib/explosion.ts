const SPARK_COLORS = ['#f97316','#fbbf24','#ef4444','#fb923c','#fcd34d','#f472b6','#a78bfa','#34d399','#fff','#60a5fa'];

const SLICE_H  = 44;    // 슬라이스 높이 — 너무 작으면 클론이 많아져 렉
const WAVE_MS  = 1300;  // 스윕 빔 내려오는 시간(ms)
const GRAVITY  = 2200;

function rnd(min: number, max: number) { return min + Math.random() * (max - min); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function fireExplosion(
  _rects: { x: number; y: number; width: number; height: number }[],
  onDone: () => void,
): () => void {
  const W = window.innerWidth;
  const H = window.innerHeight;

  // ── 화면 흔들림 ────────────────────────────────────────────────
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes __xshake {
      0%,100% { transform:translate(0,0) rotate(0deg); }
      7%   { transform:translate(-20px,14px) rotate(-1.3deg); }
      16%  { transform:translate(20px,-14px) rotate(1.3deg); }
      28%  { transform:translate(-15px,17px) rotate(-0.9deg); }
      40%  { transform:translate(15px,-11px) rotate(0.9deg); }
      54%  { transform:translate(-10px,12px); }
      68%  { transform:translate(10px,-8px); }
      83%  { transform:translate(-5px,5px); }
      94%  { transform:translate(3px,-2px); }
    }
  `;
  document.head.appendChild(shakeStyle);
  document.body.style.animation = '__xshake 0.75s ease-out forwards';
  const shakeTimer = setTimeout(() => { document.body.style.animation = ''; }, 800);

  // ── DOM 슬라이스: React 렌더 전에 동기적으로 전부 생성 ─────────
  // 클론이 먼저 DOM에 존재 → 원본이 사라져도 화면에 보임
  const createdSlices: HTMLElement[] = [];
  const allTimers: ReturnType<typeof setTimeout>[] = [];
  let maxEndMs = 0;

  const cards = Array.from(document.querySelectorAll('[data-explodable]')) as HTMLElement[];

  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const numSlices = Math.ceil(rect.height / SLICE_H);

    // 원본 즉시 숨김 — 클론이 정확히 같은 위치에 이미 있으므로 깜빡임 없음
    card.style.visibility = 'hidden';

    for (let s = 0; s < numSlices; s++) {
      const sliceTop = s * SLICE_H;
      const sliceH   = Math.min(SLICE_H, rect.height - sliceTop);
      const centerY  = rect.top + sliceTop + sliceH / 2;

      // 클리핑 컨테이너
      const wrapper = document.createElement('div');
      wrapper.style.cssText = [
        'position:fixed',
        `left:${rect.left}px`,
        `top:${rect.top + sliceTop}px`,
        `width:${rect.width}px`,
        `height:${sliceH}px`,
        'overflow:hidden',
        'z-index:9999',
        'pointer-events:none',
        'will-change:transform,opacity',
      ].join(';');

      // 실제 카드 클론을 위로 당겨 해당 줄만 노출
      const clone = card.cloneNode(true) as HTMLElement;
      clone.style.cssText += ';' + [
        'position:absolute !important',
        `top:${-sliceTop}px !important`,
        'left:0 !important',
        `width:${rect.width}px !important`,
        `height:${rect.height}px !important`,
        'margin:0 !important',
        'visibility:visible !important',
        'pointer-events:none',
        'transform:none !important',
        'opacity:1 !important',
      ].join(';');

      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);
      createdSlices.push(wrapper);

      // 낙하 타이밍: 스윕 빔 Y위치와 동기화
      const sweepDelay = (centerY / H) * WAVE_MS + rnd(0, 30);
      const fallDur    = rnd(0.75, 1.1);
      const fallY      = H - rect.top - sliceTop + 250;
      const rot        = (Math.random() - 0.5) * 12;
      const endMs      = sweepDelay + fallDur * 1000 + 500;
      maxEndMs = Math.max(maxEndMs, endMs);

      // CSS transition으로 낙하 — setTimeout 안에서 style 변경
      const t1 = setTimeout(() => {
        wrapper.style.transition = [
          `transform ${fallDur}s cubic-bezier(0.4,0,1,1)`,
          `opacity 0.4s ease-in ${(fallDur * 0.45).toFixed(2)}s`,
        ].join(',');
        wrapper.style.transform = `translateY(${fallY}px) rotate(${rot}deg)`;
        wrapper.style.opacity   = '0';
      }, sweepDelay);

      const t2 = setTimeout(() => wrapper.remove(), endMs + 50);
      allTimers.push(t1, t2);
    }
  });

  // ── 캔버스: 플래시 + 스윕 빔 + 스파크 ────────────────────────
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;';
  canvas.width = W; canvas.height = H;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  interface Spark {
    cx:number; cy:number; w:number;
    vx:number; vy:number; rotV:number;
    color:string; delay:number; duration:number; isCircle:boolean;
  }
  const sparks: Spark[] = Array.from({ length: 120 }, () => {
    const angle = rnd(0, Math.PI * 2);
    const spd   = rnd(250, 1800);
    const size  = rnd(2, 11);
    return {
      cx: W / 2 + rnd(-120, 120), cy: H / 2 + rnd(-120, 120),
      w: size,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - rnd(0, 250),
      rotV: rnd(-22, 22),
      color: pick(SPARK_COLORS),
      delay: rnd(0, 0.05), duration: rnd(0.8, 2.1),
      isCircle: Math.random() > 0.35,
    };
  });

  const startTime = performance.now();
  let rafId: number;
  let rafDone = false;

  const animate = (now: number) => {
    if (rafDone) return;
    const t   = (now - startTime) / 1000;
    const tMs = t * 1000;
    ctx.clearRect(0, 0, W, H);

    // 플래시
    if (t < 0.2) {
      const ft = t / 0.2;
      ctx.fillStyle = `rgba(255,230,130,${(0.8*(1-ft*ft)).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 스윕 빔
    if (tMs < WAVE_MS + 150) {
      const sweepY    = Math.min(H, (tMs / WAVE_MS) * H);
      const lineAlpha = Math.max(0, 1 - tMs / (WAVE_MS + 150));
      const grad = ctx.createLinearGradient(0, sweepY - 70, 0, sweepY + 10);
      grad.addColorStop(0,   'rgba(255,200,50,0)');
      grad.addColorStop(0.6, `rgba(255,220,80,${(lineAlpha*0.4).toFixed(3)})`);
      grad.addColorStop(1,   `rgba(255,255,160,${(lineAlpha*0.9).toFixed(3)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, sweepY - 70, W, 80);
      ctx.strokeStyle = `rgba(255,255,200,${(lineAlpha*0.95).toFixed(3)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, sweepY); ctx.lineTo(W, sweepY); ctx.stroke();
    }

    // 스파크
    let anyActive = t < 0.2 || tMs < WAVE_MS;
    for (const s of sparks) {
      const pt = t - s.delay;
      if (pt <= 0) { anyActive = true; continue; }
      const prog = pt / s.duration;
      if (prog >= 1) continue;
      anyActive = true;

      const px  = s.cx + s.vx * pt;
      const py  = s.cy + s.vy * pt + 0.5 * GRAVITY * pt * pt;
      const rot = s.rotV * pt;
      const alp = prog < 0.6 ? 1 : Math.max(0, 1-(prog-0.6)/0.4);
      const sc  = prog > 0.8 ? Math.max(0.01, 1-(prog-0.8)/0.2) : 1;

      ctx.save();
      ctx.globalAlpha = alp;
      ctx.translate(px, py); ctx.rotate(rot); ctx.scale(sc, sc);
      ctx.fillStyle = s.color;
      if (s.isCircle) {
        ctx.beginPath(); ctx.arc(0, 0, s.w/2, 0, Math.PI*2); ctx.fill();
      } else {
        ctx.fillRect(-s.w/2, -s.w/2, s.w, s.w);
      }
      ctx.restore();
    }

    if (anyActive) rafId = requestAnimationFrame(animate);
    else { rafDone = true; canvas.remove(); }
  };

  rafId = requestAnimationFrame(animate);

  const doneTimer = setTimeout(onDone, Math.max(maxEndMs, 2800) + 300);
  allTimers.push(doneTimer);

  return () => {
    rafDone = true;
    cancelAnimationFrame(rafId);
    clearTimeout(shakeTimer);
    allTimers.forEach(clearTimeout);
    createdSlices.forEach(s => s.remove());
    cards.forEach(c => { c.style.visibility = ''; });
    canvas.remove();
    shakeStyle.remove();
  };
}
