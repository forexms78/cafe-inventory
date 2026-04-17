type ClickType = 'plus' | 'minus';

export function playExplosionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 고주파 짧은 crack — 순간 임팩트 "팍"
  const crack = ctx.createOscillator();
  crack.type = 'sawtooth';
  crack.frequency.setValueAtTime(900, now);
  crack.frequency.exponentialRampToValueAtTime(80, now + 0.1);

  const crackGain = ctx.createGain();
  crackGain.gain.setValueAtTime(0.7, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  crack.connect(crackGain);
  crackGain.connect(ctx.destination);
  crack.start(now);
  crack.stop(now + 0.1);

  // 저음 폭발 충격파 — "퍼어어어엉" 바디감 (2.5s)
  const boom = ctx.createOscillator();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(110, now);
  boom.frequency.exponentialRampToValueAtTime(18, now + 2.5);

  const boomGain = ctx.createGain();
  boomGain.gain.setValueAtTime(1.4, now);
  boomGain.gain.setValueAtTime(1.4, now + 0.05);
  boomGain.gain.exponentialRampToValueAtTime(0.3, now + 0.8);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

  boom.connect(boomGain);
  boomGain.connect(ctx.destination);
  boom.start(now);
  boom.stop(now + 2.5);

  // 서브 럼블 — 저음이 계속 울리는 느낌
  const rumble = ctx.createOscillator();
  rumble.type = 'sine';
  rumble.frequency.setValueAtTime(55, now + 0.1);
  rumble.frequency.exponentialRampToValueAtTime(22, now + 2.5);

  const rumbleGain = ctx.createGain();
  rumbleGain.gain.setValueAtTime(0, now);
  rumbleGain.gain.linearRampToValueAtTime(0.6, now + 0.15);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

  rumble.connect(rumbleGain);
  rumbleGain.connect(ctx.destination);
  rumble.start(now);
  rumble.stop(now + 2.5);

  // 노이즈 크래시 — 파편 튀는 느낌 (길게)
  const bufSize = Math.floor(ctx.sampleRate * 1.2);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(2000, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 1.2);
  noiseFilter.Q.setValueAtTime(0.8, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.9, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 1.2);
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
