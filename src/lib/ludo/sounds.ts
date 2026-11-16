/* Ludo sound effects — 100% synthesized with the Web Audio API.
   No audio files, no network fetches. The AudioContext is created lazily
   and resumed on user gestures (unlockAudio) so mobile browsers allow
   playback. All play functions are safe no-ops when sound is off or
   Web Audio is unavailable. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let storageTried = false;

const STORAGE_KEY = "ludo-sound-enabled";

export function isSoundEnabled(): boolean {
  if (!storageTried && typeof window !== "undefined") {
    storageTried = true;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "off") {
        enabled = false;
      }
    } catch {
      /* Storage unavailable — keep the default. */
    }
  }
  return enabled;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  storageTried = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* Storage unavailable — the in-memory flag still applies. */
  }
}

/** Resume the AudioContext inside a user gesture (tap/click). */
export function unlockAudio(): void {
  const c = ensureCtx();
  if (c && c.state === "suspended") {
    void c.resume();
  }
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (ctx) {
    return ctx;
  }
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) {
    return null;
  }
  try {
    ctx = new AC();
  } catch {
    return null;
  }
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

function ready(): AudioContext | null {
  if (!isSoundEnabled()) {
    return null;
  }
  const c = ensureCtx();
  if (!c || !master) {
    return null;
  }
  if (c.state === "suspended") {
    void c.resume();
  }
  return c;
}

interface ToneOpts {
  freq: number;
  freqEnd?: number;
  type?: OscillatorType;
  at?: number;
  dur: number;
  vol: number;
}

function tone(opts: ToneOpts): void {
  const c = ready();
  if (!c || !master) {
    return;
  }
  const t0 = c.currentTime + (opts.at ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.freqEnd), t0 + opts.dur);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(opts.vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05);
}

interface NoiseOpts {
  at?: number;
  dur: number;
  vol: number;
  freq?: number;
  q?: number;
}

function noise(opts: NoiseOpts): void {
  const c = ready();
  if (!c || !master) {
    return;
  }
  const t0 = c.currentTime + (opts.at ?? 0);
  const len = Math.max(1, Math.floor(c.sampleRate * opts.dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = opts.freq ?? 1200;
  filter.Q.value = opts.q ?? 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(opts.vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(t0);
}

/** Dice rattling while the cube tumbles (~0.7s of ticks). */
export function playDiceRoll(): void {
  for (let i = 0; i < 9; i++) {
    const at = i * 0.075;
    noise({ at, dur: 0.045, vol: 0.45, freq: 900 + Math.random() * 1400, q: 1.2 });
    tone({ freq: 170 + Math.random() * 120, type: "triangle", at, dur: 0.05, vol: 0.22 });
  }
}

/** Soft tick when the dice settles on its value. */
export function playDiceSettle(): void {
  tone({ freq: 720, freqEnd: 520, type: "sine", dur: 0.07, vol: 0.35 });
  noise({ dur: 0.03, vol: 0.25, freq: 2400, q: 1 });
}

/** Woody tap for one hop step along the track. */
export function playTokenStep(): void {
  tone({ freq: 340, freqEnd: 210, type: "triangle", dur: 0.07, vol: 0.4 });
  noise({ dur: 0.025, vol: 0.16, freq: 1600 });
}

/** Bright pop when a token leaves its base. */
export function playTokenPop(): void {
  tone({ freq: 420, freqEnd: 780, type: "sine", dur: 0.12, vol: 0.4 });
}

/** Soft click when the player taps a movable token. */
export function playTokenSelect(): void {
  tone({ freq: 600, type: "sine", dur: 0.05, vol: 0.25 });
}

/** Dramatic thud + sweep when a token is captured. */
export function playCapture(): void {
  tone({ freq: 520, freqEnd: 90, type: "sawtooth", dur: 0.28, vol: 0.32 });
  noise({ dur: 0.18, vol: 0.45, freq: 700, q: 0.6 });
  tone({ freq: 180, freqEnd: 60, type: "square", at: 0.05, dur: 0.2, vol: 0.2 });
}

/** Pleasant two-note chime when a token reaches the centre. */
export function playTokenHome(): void {
  tone({ freq: 659, type: "sine", dur: 0.14, vol: 0.35 });
  tone({ freq: 880, type: "sine", at: 0.11, dur: 0.2, vol: 0.35 });
}

/** Gentle chime when the player's own turn begins. */
export function playTurnChime(): void {
  tone({ freq: 784, type: "sine", dur: 0.16, vol: 0.26 });
  tone({ freq: 1046, type: "sine", at: 0.1, dur: 0.22, vol: 0.2 });
}

/** Little victory arpeggio for the win overlay. */
export function playWinFanfare(): void {
  const notes = [523, 659, 784, 1046, 784, 1046];
  notes.forEach((f, i) => {
    tone({ freq: f, type: "triangle", at: i * 0.13, dur: 0.24, vol: 0.38 });
  });
  noise({ at: 0.5, dur: 0.3, vol: 0.1, freq: 5000, q: 0.5 });
}

/** Tiny click for UI buttons. */
export function playButtonClick(): void {
  tone({ freq: 500, freqEnd: 380, type: "sine", dur: 0.05, vol: 0.22 });
}
