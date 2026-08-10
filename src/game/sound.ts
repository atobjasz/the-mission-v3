/**
 * Lightweight Web Audio sound engine — all sounds are generated procedurally,
 * no external files needed. Browsers require a user gesture before audio can
 * play, so call `resume()` on the first interaction.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

export function resumeAudio() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

export function setMuted(m: boolean) {
  muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : 0.35;
}

export function isMuted() {
  return muted;
}

function now() {
  return getCtx().currentTime;
}

// ── One-shot effects ──────────────────────────────────────────────

export function beep(freq = 660, duration = 0.08, type: OscillatorType = 'square', vol = 0.3) {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, now());
  g.gain.linearRampToValueAtTime(vol, now() + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, now() + duration);
  osc.connect(g).connect(masterGain!);
  osc.start();
  osc.stop(now() + duration + 0.02);
}

export function buzz(freq = 120, duration = 0.25, vol = 0.35) {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, now());
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now() + duration);
  g.gain.setValueAtTime(0, now());
  g.gain.linearRampToValueAtTime(vol, now() + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now() + duration);
  osc.connect(g).connect(masterGain!);
  osc.start();
  osc.stop(now() + duration + 0.02);
}

export function explosion(vol = 0.4) {
  if (muted) return;
  const c = getCtx();
  const dur = 0.35;
  // Noise burst
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, now());
  filter.frequency.exponentialRampToValueAtTime(200, now() + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, now());
  g.gain.exponentialRampToValueAtTime(0.001, now() + dur);
  src.connect(filter).connect(g).connect(masterGain!);
  src.start();
  src.stop(now() + dur);
}

export function chime(freqs: number[], duration = 0.5, vol = 0.25) {
  if (muted) return;
  const c = getCtx();
  freqs.forEach((f, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    const start = now() + i * 0.08;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(g).connect(masterGain!);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  });
}

export function whoosh(duration = 1.0, vol = 0.35) {
  if (muted) return;
  const c = getCtx();
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(200, now());
  filter.frequency.exponentialRampToValueAtTime(3000, now() + duration * 0.6);
  filter.frequency.exponentialRampToValueAtTime(400, now() + duration);
  filter.Q.value = 2;
  const g = c.createGain();
  g.gain.setValueAtTime(0, now());
  g.gain.linearRampToValueAtTime(vol, now() + duration * 0.2);
  g.gain.exponentialRampToValueAtTime(0.001, now() + duration);
  src.connect(filter).connect(g).connect(masterGain!);
  src.start();
  src.stop(now() + duration);
}

// ── Looping ambient sounds ────────────────────────────────────────

export type LoopHandle = {
  osc: OscillatorNode;
  gain: GainNode;
  lfo?: OscillatorNode;
};

export function startEngineHum(freq = 55, vol = 0.12): LoopHandle {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  gain.gain.value = 0;

  // Low-pass to make it smooth
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 180;
  filter.Q.value = 4;

  // Slow LFO for slight wobble
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.3;
  lfoGain.gain.value = 3;
  lfo.connect(lfoGain).connect(osc.frequency);

  osc.connect(filter).connect(gain).connect(masterGain!);
  osc.start();
  lfo.start();
  gain.gain.linearRampToValueAtTime(vol, now() + 1.5);

  return { osc, gain, lfo };
}

export function stopLoop(handle: LoopHandle, fade = 0.5) {
  const c = getCtx();
  handle.gain.gain.cancelScheduledValues(now());
  handle.gain.gain.setValueAtTime(handle.gain.gain.value, now());
  handle.gain.gain.linearRampToValueAtTime(0, now() + fade);
  setTimeout(() => {
    try {
      handle.osc.stop();
      handle.lfo?.stop();
    } catch {}
  }, fade * 1000 + 100);
}

// ── Named game sounds ─────────────────────────────────────────────

const REACTOR_TONES = [330, 370, 415, 440, 494, 554, 622, 660, 740];

export const sfx = {
  reactorTile: (idx: number) => beep(REACTOR_TONES[idx % REACTOR_TONES.length], 0.22, 'sine', 0.22),
  reactorBeep: () => beep(880, 0.06, 'square', 0.2),
  reactorWrong: () => buzz(110, 0.3, 0.3),
  reactorComplete: () => chime([523, 659, 784, 1047], 0.6, 0.2),

  navTracking: () => beep(440, 0.04, 'sine', 0.12),
  navLocking: () => beep(660, 0.06, 'sine', 0.15),
  navLocked: () => chime([784, 988, 1319], 0.5, 0.22),

  asteroidDestroy: () => explosion(0.35),
  asteroidHit: () => beep(220, 0.05, 'square', 0.15),
  asteroidHitShield: () => buzz(80, 0.2, 0.3),
  asteroidTimerTick: () => beep(1200, 0.04, 'square', 0.15),
  asteroidComplete: () => chime([523, 659, 784], 0.5, 0.22),

  hyperdrive: () => whoosh(1.8, 0.35),

  boot: () => beep(330, 0.1, 'sine', 0.15),
  success: () => chime([523, 659, 784], 0.5, 0.2),
  fail: () => {
    buzz(200, 0.6, 0.3);
    setTimeout(() => buzz(100, 0.8, 0.3), 300);
  },
};
