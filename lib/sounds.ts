type ClickType = 'plus' | 'minus';

export function playExplosionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 저음 폭발 충격파 — "펑" 바디감
  const boom = ctx.createOscillator();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(120, now);
  boom.frequency.exponentialRampToValueAtTime(25, now + 0.6);

  const boomGain = ctx.createGain();
  boomGain.gain.setValueAtTime(1.2, now);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

  boom.connect(boomGain);
  boomGain.connect(ctx.destination);
  boom.start(now);
  boom.stop(now + 0.7);

  // 노이즈 크래시 — 파편 튀는 느낌
  const bufSize = Math.floor(ctx.sampleRate * 0.4);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(3000, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 0.4);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.4);

  // 고주파 짧은 crack — 순간 임팩트
  const crack = ctx.createOscillator();
  crack.type = 'sawtooth';
  crack.frequency.setValueAtTime(800, now);
  crack.frequency.exponentialRampToValueAtTime(100, now + 0.08);

  const crackGain = ctx.createGain();
  crackGain.gain.setValueAtTime(0.5, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  crack.connect(crackGain);
  crackGain.connect(ctx.destination);
  crack.start(now);
  crack.stop(now + 0.08);
}

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
