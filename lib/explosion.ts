const SPARK_COLORS = ['#f97316','#fbbf24','#ef4444','#fb923c','#fcd34d','#f472b6','#a78bfa','#34d399','#fff','#60a5fa'];

const SLICE_H = 40;   // 슬라이스 높이 — 건물 "층" 느낌
const GRAVITY = 2400;

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
      6%  { transform:translate(-22px,16px) rotate(-1.5deg); }
      14% { transform:translate(22px,-16px) rotate(1.5deg); }
      24% { transform:translate(-18px,20px) rotate(-1deg); }
      35% { transform:translate(18px,-13px) rotate(1deg); }
      50% { transform:translate(-12px,14px); }
      65% { transform:translate(12px,-9px); }
      80% { transform:translate(-6px,6px); }
      93% { transform:translate(4px,-3px); }
    }
  `;
  document.head.appendChild(shakeStyle);
  document.body.style.animation = '__xshake 0.8s ease-out forwards';
  const shakeTimer = setTimeout(() => { document.body.style.animation = ''; }, 900);

  const allTimers: ReturnType<typeof setTimeout>[] = [];
  const createdSlices: HTMLElement[] = [];
  let maxEndMs = 0;

  const cards = Array.from(document.querySelectorAll('[data-explodable]')) as HTMLElement[];

  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const numSlices = Math.ceil(rect.height / SLICE_H);

    // 카드마다 랜덤 기울기 방향 — 일부는 왼쪽, 일부는 오른쪽으로 쓰러짐
    const leanDir    = Math.random() > 0.5 ? 1 : -1;
    const cardDelay  = rnd(0, 120); // 카드마다 약간씩 다른 시작 타이밍

    // 원본 즉시 숨김
    card.style.visibility = 'hidden';

    for (let s = 0; s < numSlices; s++) {
      const sliceTop = s * SLICE_H;
      const sliceH   = Math.min(SLICE_H, rect.height - sliceTop);

      // ── 핵심: 아래 행(row)부터 먼저 무너짐 ──
      // rowFromBottom=0 이 제일 아래 → delay 가장 짧음
      const rowFromBottom = numSlices - 1 - s;
      const rowDelay   = rowFromBottom * rnd(55, 90); // 각 층마다 딜레이 누적
      const jitter     = rnd(-25, 40);                // 랜덤 덜컹거림
      const fallDelay  = cardDelay + rowDelay + jitter;

      const fallDur    = rnd(0.55, 0.85);
      const fallY      = H - rect.top - sliceTop + 250;
      const lateralX   = leanDir * rnd(40, 180);
      const finalRot   = leanDir * rnd(6, 18);
      const endMs      = fallDelay + fallDur * 1000 + 400;
      maxEndMs = Math.max(maxEndMs, endMs);

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

      // 1단계: 낙하 직전 살짝 흔들림 (건물이 삐걱거리는 느낌)
      const wobbleDelay = Math.max(0, fallDelay - 90);
      const t0 = setTimeout(() => {
        wrapper.style.transition = 'transform 0.09s ease-out';
        wrapper.style.transform  = `translateY(2px) rotate(${leanDir * 1.2}deg)`;
      }, wobbleDelay);

      // 2단계: 본 낙하
      const t1 = setTimeout(() => {
        wrapper.style.transition = [
          `transform ${fallDur}s cubic-bezier(0.6,0,1,1)`,
          `opacity 0.35s ease-in ${(fallDur * 0.48).toFixed(2)}s`,
        ].join(',');
        wrapper.style.transform = `translateY(${fallY}px) translateX(${lateralX}px) rotate(${finalRot}deg)`;
        wrapper.style.opacity   = '0';
      }, fallDelay);

      const t2 = setTimeout(() => wrapper.remove(), endMs + 50);
      allTimers.push(t0, t1, t2);
    }
  });

  // ── 캔버스: 플래시 + 충격파 링 + 스파크 ──────────────────────
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
  const sparks: Spark[] = Array.from({ length: 130 }, () => {
    const angle = rnd(0, Math.PI * 2);
    const spd   = rnd(300, 2000);
    const size  = rnd(2, 12);
    return {
      cx: W/2 + rnd(-100,100), cy: H/2 + rnd(-100,100),
      w: size,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - rnd(0, 280),
      rotV: rnd(-22,22),
      color: pick(SPARK_COLORS),
      delay: rnd(0,0.05), duration: rnd(0.8,2.2),
      isCircle: Math.random() > 0.35,
    };
  });

  const startTime = performance.now();
  let rafId: number;
  let rafDone = false;

  const animate = (now: number) => {
    if (rafDone) return;
    const t = (now - startTime) / 1000;
    ctx.clearRect(0, 0, W, H);

    // 플래시
    if (t < 0.22) {
      const ft = t / 0.22;
      ctx.fillStyle = `rgba(255,230,130,${(0.85*(1-ft*ft)).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 충격파 링 (0~0.7s)
    if (t < 0.7) {
      const sw  = t / 0.7;
      const maxR = Math.max(W, H) * 0.6;
      const a1  = Math.max(0, (1-sw) * 0.7);
      ctx.strokeStyle = `rgba(255,190,60,${a1.toFixed(3)})`;
      ctx.lineWidth   = Math.max(1, (1-sw) * 20);
      ctx.beginPath(); ctx.arc(W/2, H/2, sw*maxR, 0, Math.PI*2); ctx.stroke();

      if (t < 0.4) {
        const sw2 = t / 0.4;
        const a2  = Math.max(0, (1-sw2) * 0.45);
        ctx.strokeStyle = `rgba(255,255,255,${a2.toFixed(3)})`;
        ctx.lineWidth   = Math.max(1, (1-sw2) * 9);
        ctx.beginPath(); ctx.arc(W/2, H/2, sw2*maxR*0.5, 0, Math.PI*2); ctx.stroke();
      }
    }

    // 스파크
    let anyActive = t < 0.22 || t < 0.7;
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
      ctx.translate(px,py); ctx.rotate(rot); ctx.scale(sc,sc);
      ctx.fillStyle = s.color;
      if (s.isCircle) {
        ctx.beginPath(); ctx.arc(0,0,s.w/2,0,Math.PI*2); ctx.fill();
      } else {
        ctx.fillRect(-s.w/2,-s.w/2,s.w,s.w);
      }
      ctx.restore();
    }

    if (anyActive) rafId = requestAnimationFrame(animate);
    else { rafDone = true; canvas.remove(); }
  };

  rafId = requestAnimationFrame(animate);

  const doneTimer = setTimeout(onDone, Math.max(maxEndMs, 2500) + 300);
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
