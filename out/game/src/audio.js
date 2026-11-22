// Synthesized sound effects with WebAudio: no audio files, no network.

let ac = null;
let master = null;
let noiseBuf = null;
let muted = false;

export function unlockAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain();
  master.gain.value = 0.5;
  master.connect(ac.destination);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x7fffffff) * 2 - 1; }
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

function tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slideTo = null) {
  if (!ac) return;
  const t = ac.currentTime + when;
  const o = ac.createOscillator();
  const gn = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, freq, vol = 0.2, q = 1, when = 0) {
  if (!ac) return;
  const t = ac.currentTime + when;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const gn = ac.createGain();
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(gn).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

const SOUNDS = {
  step: () => noise(0.05, 900, 0.12, 2),
  stepSoft: () => noise(0.04, 600, 0.04, 2),
  tick: () => tone(2200, 0.03, 'square', 0.04),
  chime: () => { tone(880, 0.25, 'triangle', 0.18); tone(1320, 0.3, 'triangle', 0.15, 0.08); tone(1760, 0.4, 'triangle', 0.12, 0.16); },
  grab: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.5, 'triangle', 0.16, i * 0.07)); tone(110, 0.5, 'sawtooth', 0.12, 0.3); },
  zap: () => { tone(1400, 0.18, 'sawtooth', 0.1, 0, 120); noise(0.12, 3000, 0.08, 1); },
  smoke: () => noise(0.9, 500, 0.25, 0.6),
  emp: () => { tone(60, 0.8, 'sawtooth', 0.2, 0, 900); tone(1800, 0.6, 'square', 0.06, 0, 80); },
  huh: () => tone(330, 0.14, 'triangle', 0.08, 0, 440),
  beep: () => tone(988, 0.09, 'square', 0.07),
  siren: () => tone(700, 0.25, 'sawtooth', 0.12, 0, 1100),
  lockdown: () => { tone(600, 0.4, 'sawtooth', 0.16, 0, 1200); tone(600, 0.4, 'sawtooth', 0.16, 0.45, 1200); },
  slip: () => tone(400, 0.4, 'triangle', 0.12, 0, 220),
  busted: () => { tone(220, 0.35, 'square', 0.18); tone(185, 0.35, 'square', 0.18, 0.3); tone(147, 0.8, 'square', 0.18, 0.6); },
  rope: () => noise(0.6, 1200, 0.12, 0.8),
  win: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.6, 'triangle', 0.15, i * 0.12)),
  deny: () => tone(150, 0.15, 'square', 0.08),
  start: () => { tone(440, 0.15, 'triangle', 0.12); tone(660, 0.25, 'triangle', 0.12, 0.1); },
};

export function playEvents(events) {
  if (!ac || muted) return;
  const seen = new Set();
  for (const e of events) {
    if (seen.has(e)) continue;
    seen.add(e);
    const fn = SOUNDS[e];
    if (fn) fn();
  }
}
