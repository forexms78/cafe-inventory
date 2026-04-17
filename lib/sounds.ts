type ClickType = 'plus' | 'minus';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AC();
  }
  return audioCtx;
}

export function playClickSound(type: ClickType) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const isPlus = type === 'plus';

  // 메인 톤 — 사인파로 말랑한 소리
  const osc = ctx.createOscillator();
  osc.type = 'sine';

  if (isPlus) {
    // + : 올라가는 "삐↑" — 동전 먹는 느낌
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.12);
  } else {
    // - : 내려가는 "뿌↓" — 말랑한 팝
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(370, now + 0.12);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.28, now);
  gain.gain.linearRampToValueAtTime(0.28, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  // 하모닉 — 귀여운 배음 추가
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  if (isPlus) {
    osc2.frequency.setValueAtTime(1040, now);
    osc2.frequency.exponentialRampToValueAtTime(2080, now + 0.12);
  } else {
    osc2.frequency.setValueAtTime(1480, now);
    osc2.frequency.exponentialRampToValueAtTime(740, now + 0.12);
  }

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.08, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
  osc2.start(now);
  osc2.stop(now + 0.1);
}
