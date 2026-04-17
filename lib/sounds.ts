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

  // 노이즈 — 기계식 키보드 "탁" 질감
  const bufferSize = Math.floor(ctx.sampleRate * 0.06);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = isPlus ? 3200 : 2200;
  noiseFilter.Q.value = 1.2;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.35, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  // 톤 — 클릭감 강조
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(isPlus ? 900 : 650, now);
  osc.frequency.exponentialRampToValueAtTime(isPlus ? 1100 : 500, now + 0.03);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.12, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.06);
  osc.start(now);
  osc.stop(now + 0.04);
}
