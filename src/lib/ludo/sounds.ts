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

/* ---- Bubble Shooter effects (same synth style, no audio files). ---- */

/** Guard against clipping when a big cascade fires many pop sounds
    at once: at most 4 pop calls per 120ms window. */
let popCallTimes: number[] = [];

function popAllowed(): boolean {
  const now = Date.now();
  popCallTimes = popCallTimes.filter((t) => now - t < 120);
  if (popCallTimes.length >= 4) return false;
  popCallTimes.push(now);
  return true;
}

/** Whoosh + blip when a bubble launches. */
export function playBubbleShoot(): void {
  noise({ dur: 0.12, vol: 0.3, freq: 1400, q: 0.7 });
  tone({ freq: 300, freqEnd: 900, type: "sine", dur: 0.12, vol: 0.3 });
}

/** Bright pop; pitch rises a semitone per combo step. */
export function playBubblePop(comboStep: number): void {
  if (!popAllowed()) return;
  const base = 520 * Math.pow(2, Math.min(comboStep, 8) / 12);
  tone({ freq: base, freqEnd: base * 1.5, type: "sine", dur: 0.1, vol: 0.38 });
  noise({ dur: 0.05, vol: 0.18, freq: 3200, q: 0.8 });
}

/** Short tick when the flying ball bounces off a wall. */
export function playBubbleBounce(): void {
  tone({ freq: 900, freqEnd: 700, type: "sine", dur: 0.05, vol: 0.25 });
  noise({ dur: 0.025, vol: 0.12, freq: 2600, q: 1 });
}

/** Falling whistle when a cut-off cluster drops. */
export function playBubbleDrop(): void {
  tone({ freq: 800, freqEnd: 200, type: "sine", dur: 0.3, vol: 0.28 });
  noise({ dur: 0.2, vol: 0.12, freq: 900, q: 0.6 });
}

/** Low warning thud when the ceiling pushes a new row in. */
export function playCeilingPush(): void {
  tone({ freq: 140, freqEnd: 60, type: "square", dur: 0.25, vol: 0.25 });
  noise({ dur: 0.15, vol: 0.2, freq: 300, q: 0.6 });
  tone({ freq: 320, freqEnd: 180, type: "sine", at: 0.08, dur: 0.18, vol: 0.2 });
}

/** Bass drop + noise wash for avalanches (8+ balls dropping). */
export function playAvalanche(): void {
  tone({ freq: 220, freqEnd: 40, type: "sawtooth", dur: 0.4, vol: 0.3 });
  noise({ dur: 0.35, vol: 0.3, freq: 500, q: 0.5 });
  tone({ freq: 660, freqEnd: 990, type: "sine", at: 0.15, dur: 0.2, vol: 0.25 });
}

/** Descending minor phrase when the bubbles cross the danger line. */
export function playLose(): void {
  const notes = [392, 370, 349, 311];
  notes.forEach((f, i) => {
    tone({ freq: f, type: "triangle", at: i * 0.14, dur: 0.22, vol: 0.32 });
  });
}

/* ---- Chess effects (same synth style, no audio files). ---- */

/** Woody knock when a piece lands on a square. */
export function playChessMove(): void {
  tone({ freq: 260, freqEnd: 170, type: "triangle", dur: 0.08, vol: 0.42 });
  noise({ dur: 0.03, vol: 0.2, freq: 1800, q: 1 });
}

/** Sharper thud + sweep when a piece is captured. */
export function playChessCapture(): void {
  tone({ freq: 420, freqEnd: 110, type: "triangle", dur: 0.16, vol: 0.42 });
  noise({ dur: 0.1, vol: 0.3, freq: 800, q: 0.7 });
  tone({ freq: 240, freqEnd: 150, type: "sine", at: 0.04, dur: 0.1, vol: 0.3 });
}

/** Bright two-note alert when a king is put in check. */
export function playChessCheck(): void {
  tone({ freq: 880, type: "sine", dur: 0.12, vol: 0.34 });
  tone({ freq: 1174, type: "sine", at: 0.1, dur: 0.18, vol: 0.3 });
}

/** Short rising fanfare when a chess game is won. */
export function playChessWin(): void {
  const notes = [523, 659, 784, 1046];
  notes.forEach((f, i) => {
    tone({ freq: f, type: "triangle", at: i * 0.12, dur: 0.22, vol: 0.36 });
  });
}
