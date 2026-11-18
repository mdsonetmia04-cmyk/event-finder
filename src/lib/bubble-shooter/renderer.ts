/* Bubble Shooter canvas renderer + game controller. Owns the
   canvas, the requestAnimationFrame loop (fixed-timestep sim at
   120Hz), all input (pointer/touch/keyboard), and every visual
   effect (particles, fallers, pop waves, squash, shake, slow-mo,
   banners). It reads the headless engine and turns its events into
   juice; it never changes sim rules.

   Performance rules: single canvas, pre-rendered sprites (no
   per-frame gradients for balls), pooled particles, DPR cap 2 with
   auto-drop, pause on visibility change, prefers-reduced-motion
   respected, touch-action none on the board. */

import { BubbleEngine, predictPath, type EngineEvent, type EnginePhase, type Prediction } from "./engine";
import {
  ballAt,
  cellToWorld,
  dangerLineY,
  key,
  neighbours,
  R,
  ROW_H,
  type Vec2,
} from "./grid";
import { ballSprite, buildBackdrop, glowSprite, spriteDrawSize } from "./sprites";
import { THEMES, TUNING, type BallColor } from "./tuning";
import type { BubbleLevel } from "./levels";
import {
  playAvalanche,
  playBubbleBounce,
  playBubbleDrop,
  playBubblePop,
  playBubbleShoot,
  playCeilingPush,
  playLose,
  playTokenPop,
  playWinFanfare,
  unlockAudio,
} from "@/lib/ludo/sounds";

export interface HudState {
  score: number;
  comboMult: number;
  shotsLeft: number;
}

export interface ControllerOpts {
  level: BubbleLevel;
  reducedMotion: boolean;
  onHud: (hud: HudState) => void;
  onOutcome: (result: "won" | "failed", score: number, stars: 1 | 2 | 3) => void;
  /** Tab hidden, or P/Escape pressed: the page shows the pause overlay. */
  onPauseRequest: () => void;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: BallColor;
  drag: number;
  grav: number;
}

interface Faller {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  color: BallColor;
  hang: number;
}

interface Popping {
  x: number;
  y: number;
  color: BallColor;
  /** Seconds until the burst (stagger delay + grow time). */
  life: number;
  maxLife: number;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  vr: number;
  life: number;
  maxLife: number;
  color: string;
}

interface SquashEntry {
  start: number;
  /** Impact axis (unit vector, world units). */
  ax: number;
  ay: number;
}

const PARTICLE_CAP = 240;
const PARTICLE_CAP_LOW = 120;
const TRAIL_LEN = 10;
const SQUASH_MS = 180;
const JIGGLE_MS = 400;
const RESOLVE_MIN_MS = 150;
const RESOLVE_MAX_MS = 1200;
const OUTCOME_DELAY_MS = 800;
const DPR_DROP_WINDOW_MS = 3000;
const DPR_DROP_FRAME_MS = 20;

export class BubbleShooterController {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly opts: ControllerOpts;
  private readonly engine: BubbleEngine;

  private raf = 0;
  private last = 0;
  private acc = 0;
  private destroyed = false;
  private paused = false;
  private startedAt = 0;

  private cssW = 320;
  private cssH = 600;
  private scale = 40;
  private dpr = 1;
  private backdrop: HTMLCanvasElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private prevPhase: EnginePhase = "aiming";
  private resolveStartAt = 0;
  private slideFrom = 0; // world units of upward offset, tweens to 0
  private slideStart = 0;
  private slideActive = false;

  private trauma = 0;
  private slowmoUntil = 0;
  private slowmoScale = 1;
  private flashUntil = 0;
  private flashColor = "255,215,0";
  private flashAlpha = 0;
  private recoil = 0;
  private banner: { word: string; start: number } | null = null;

  private particles: Particle[] = [];
  private particleCursor = 0;
  private particleCap = PARTICLE_CAP;
  private fallers: Faller[] = [];
  private popping: Popping[] = [];
  private texts: FloatText[] = [];
  private ripples: Ripple[] = [];
  private squash = new Map<number, SquashEntry>();
  private jiggle = new Map<number, SquashEntry>();
  private trail: Vec2[] = [];
  private trailCursor = 0;

  private predCache: { angleKey: number; gridVersion: number; pred: Prediction } | null = null;
  private lastHud: HudState | null = null;
  private outcomeTimer = 0;
  private aimingPointer: number | null = null;

  private frameTimes: number[] = [];
  private dprEvaluated = false;
  private dprDropPending = false;

  private readonly unsubscribe: () => void;

  constructor(canvas: HTMLCanvasElement, opts: ControllerOpts) {
    this.canvas = canvas;
    this.opts = opts;
    this.engine = new BubbleEngine(opts.level);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Bubble Shooter: 2D canvas context unavailable");
    this.ctx = ctx;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (let i = 0; i < PARTICLE_CAP; i++) {
      this.particles.push({
        active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
        size: 0.2, color: 0, drag: 0, grav: 0,
      });
    }
    for (let i = 0; i < TRAIL_LEN; i++) this.trail.push({ x: 0, y: 0 });
    this.unsubscribe = this.engine.onEvent((e) => this.handleEvent(e));
  }

  get phase(): EnginePhase {
    return this.engine.phase;
  }

  start(): void {
    this.startedAt = performance.now();
    this.last = this.startedAt;
    this.resize();
    const parent = this.canvas.parentElement;
    if (parent && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(parent);
    }
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerCancel);
    this.canvas.addEventListener("contextmenu", this.onContextMenu);
    window.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.syncHud(true);
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.unsubscribe();
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
    window.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("visibilitychange", this.onVisibility);
    if (this.outcomeTimer) window.clearTimeout(this.outcomeTimer);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.last = performance.now();
  }

  swap(): boolean {
    const ok = this.engine.swap();
    if (ok) this.syncHud(true);
    return ok;
  }

  // ---------- sizing ----------

  private resize(): void {
    const parent = this.canvas.parentElement;
    const cssW = Math.max(280, Math.min(480, parent ? parent.clientWidth : 320));
    const cssH = (cssW * TUNING.WORLD_H) / TUNING.WORLD_W;
    this.cssW = cssW;
    this.cssH = cssH;
    this.scale = cssW / TUNING.WORLD_W;
    this.canvas.width = Math.max(1, Math.round(cssW * this.dpr));
    this.canvas.height = Math.max(1, Math.round(cssH * this.dpr));
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.backdrop = buildBackdrop(cssW, cssH, this.dpr, THEMES[this.opts.level.theme], TUNING.GRID_COLS, this.engine.parity);
    this.predCache = null;
  }

  // ---------- input ----------

  private toWorld(clientX: number, clientY: number, isTouch: boolean): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top - (isTouch ? TUNING.TOUCH_AIM_OFFSET_PX : 0);
    return {
      x: (px / rect.width) * TUNING.WORLD_W,
      y: (py / rect.height) * TUNING.WORLD_H,
    };
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    unlockAudio();
    this.aimingPointer = e.pointerId;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      /* Capture unavailable — aiming still works. */
    }
    this.engine.aimAt(this.toWorld(e.clientX, e.clientY, e.pointerType === "touch"));
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (this.aimingPointer !== e.pointerId && e.pointerType !== "mouse") return;
    if (this.engine.phase !== "aiming") return;
    this.engine.aimAt(this.toWorld(e.clientX, e.clientY, e.pointerType === "touch"));
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    if (this.aimingPointer !== e.pointerId) return;
    this.aimingPointer = null;
    if (this.paused) return;
    if (this.engine.phase !== "aiming") return;
    this.engine.aimAt(this.toWorld(e.clientX, e.clientY, e.pointerType === "touch"));
    this.engine.fire();
  };

  private readonly onPointerCancel = (e: PointerEvent): void => {
    if (this.aimingPointer === e.pointerId) this.aimingPointer = null;
  };

  private readonly onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const active = document.activeElement;
    const typing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
    if (typing) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      if (this.engine.phase !== "aiming") return;
      e.preventDefault();
      unlockAudio();
      this.engine.setAim(this.engine.aimAngle + (e.key === "ArrowRight" ? 0.035 : -0.035));
    } else if (e.key === " " || e.key === "ArrowUp") {
      if (this.engine.phase !== "aiming") return;
      e.preventDefault();
      unlockAudio();
      this.engine.fire();
    } else if (e.key === "s" || e.key === "S") {
      if (this.engine.phase !== "aiming") return;
      this.engine.swap();
    } else if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      if (this.engine.phase === "aiming" || this.engine.phase === "flying" || this.engine.phase === "resolving") {
        this.opts.onPauseRequest();
      }
    }
  };

  private readonly onVisibility = (): void => {
    if (document.hidden && !this.paused) {
      const phase = this.engine.phase;
      if (phase === "aiming" || phase === "flying" || phase === "resolving") {
        this.opts.onPauseRequest();
      }
    }
  };

  // ---------- events → juice ----------

  private handleEvent(e: EngineEvent): void {
    const now = performance.now();
    const reduced = this.opts.reducedMotion;
    switch (e.type) {
      case "fire": {
        playBubbleShoot();
        this.recoil = 1;
        this.trailCursor = 0;
        for (const t of this.trail) {
          t.x = 0;
          t.y = 0;
        }
        const origin = this.engine.launcherPos();
        const dir = { x: Math.sin(e.angle), y: -Math.cos(e.angle) };
        this.spawnPuff(origin.x + dir.x * 0.7, origin.y + dir.y * 0.7, e.color);
        break;
      }
      case "bounce": {
        playBubbleBounce();
        this.ripples.push({ x: e.x, y: e.y, r: 0.2, vr: 3.2, life: 0.28, maxLife: 0.28, color: "255,255,255" });
        if (!reduced) this.trauma = Math.min(1, this.trauma + 0.15);
        break;
      }
      case "stick": {
        playTokenPop();
        const world = cellToWorld(e.cell.row, e.cell.col, this.engine.parity, this.engine.cols);
        let ax = e.impactX - world.x;
        let ay = e.impactY - world.y;
        const len = Math.hypot(ax, ay) || 1;
        ax /= len;
        ay /= len;
        this.squash.set(key(e.cell), { start: now, ax, ay });
        for (const n of neighbours(e.cell, this.engine.parity, this.engine.cols)) {
          if (ballAt(this.engine.cells, n) !== null) {
            this.jiggle.set(key(n), { start: now, ax: 0, ay: 0 });
          }
        }
        if (!reduced) this.trauma = Math.min(1, this.trauma + 0.1);
        break;
      }
      case "refund": {
        playBubbleBounce();
        break;
      }
      case "pop": {
        playBubblePop(Math.round((e.multiplier - 1) / TUNING.COMBO_STEP));
        let sx = 0;
        let sy = 0;
        for (const pc of e.cells) {
          const w = cellToWorld(pc.cell.row, pc.cell.col, this.engine.parity, this.engine.cols);
          sx += w.x;
          sy += w.y;
          const delay = reduced ? 0 : pc.depth * TUNING.POP_STAGGER;
          this.popping.push({ x: w.x, y: w.y, color: pc.color, life: delay + 0.06, maxLife: delay + 0.06 });
        }
        const n = Math.max(1, e.cells.length);
        this.texts.push({
          x: sx / n, y: sy / n, text: `+${e.points}`, color: "#FFD75E", size: 0.46,
          life: 0.85, maxLife: 0.85,
        });
        if (!reduced) this.trauma = Math.min(1, this.trauma + 0.08 + e.groupSize * 0.02);
        break;
      }
      case "drop": {
        playBubbleDrop();
        let sx = 0;
        let sy = 0;
        for (const dc of e.cells) {
          const w = cellToWorld(dc.cell.row, dc.cell.col, this.engine.parity, this.engine.cols);
          sx += w.x;
          sy += w.y;
          this.fallers.push({
            x: w.x, y: w.y,
            vx: this.engine.rngFx.range(-1.5, 1.5),
            vy: this.engine.rngFx.range(-1, 0.5),
            rot: 0,
            vr: this.engine.rngFx.range(-TUNING.FALLER_SPIN_MAX, TUNING.FALLER_SPIN_MAX),
            color: dc.color,
            hang: TUNING.DETACH_HANG_TIME,
          });
        }
        const n = Math.max(1, e.cells.length);
        this.texts.push({
          x: sx / n, y: sy / n, text: `+${e.points}`, color: "#7FE8FF", size: 0.46,
          life: 0.85, maxLife: 0.85,
        });
        if (e.count >= 8) {
          playAvalanche();
          if (!reduced) {
            this.slowmoUntil = now + TUNING.SLOWMO_AVALANCHE.dur * 1000;
            this.slowmoScale = TUNING.SLOWMO_AVALANCHE.scale;
            this.trauma = Math.min(1, this.trauma + 0.5);
          }
        }
        break;
      }
      case "push": {
        playCeilingPush();
        // Every ball moved down one row: shift the squash/jiggle keys
        // so the effects follow their balls.
        this.squash = new Map([...this.squash].map(([k, v]) => [k + 64, v]));
        this.jiggle = new Map([...this.jiggle].map(([k, v]) => [k + 64, v]));
        this.slideFrom = -ROW_H;
        this.slideStart = now;
        this.slideActive = true;
        // The backdrop dots follow the lattice: rebuild for the new parity.
        this.backdrop = buildBackdrop(this.cssW, this.cssH, this.dpr, THEMES[this.opts.level.theme], TUNING.GRID_COLS, this.engine.parity);
        if (!reduced) this.trauma = Math.min(1, this.trauma + 0.2);
        break;
      }
      case "resolved": {
        if (e.cleared >= 5) {
          const banner = TUNING.BANNERS.find((b) => e.cleared >= b.at);
          if (banner) this.banner = { word: banner.word, start: now };
        }
        break;
      }
      case "combo": {
        // HUD reads the multiplier directly; nothing visual here.
        break;
      }
      case "outcome": {
        if (!reduced) {
          this.slowmoUntil = now + TUNING.SLOWMO_END.dur * 1000;
          this.slowmoScale = TUNING.SLOWMO_END.scale;
        }
        this.flashUntil = now + 500;
        this.flashAlpha = e.result === "won" ? 0.32 : 0.26;
        this.flashColor = e.result === "won" ? "255,215,94" : "229,72,77";
        if (e.result === "won") {
          playWinFanfare();
          for (let i = 0; i < 46; i++) {
            const a = this.engine.rngFx.range(0, Math.PI * 2);
            const sp = this.engine.rngFx.range(2, 7);
            this.spawnParticle(
              TUNING.WORLD_W / 2, 5,
              Math.cos(a) * sp, Math.sin(a) * sp - 2,
              this.engine.rngFx.range(0.6, 1.1), 0.3,
              this.engine.rngFx.int(6) as BallColor, 1.6, 4,
            );
          }
        } else {
          playLose();
        }
        const delay = reduced ? 400 : OUTCOME_DELAY_MS;
        this.outcomeTimer = window.setTimeout(() => {
          if (!this.destroyed) this.opts.onOutcome(e.result, e.score, e.stars);
        }, delay);
        break;
      }
    }
  }

  // ---------- particles ----------

  private spawnParticle(
    x: number, y: number, vx: number, vy: number,
    life: number, size: number, color: BallColor, drag: number, grav: number,
  ): void {
    const p = this.particles[this.particleCursor] as Particle;
    this.particleCursor = (this.particleCursor + 1) % this.particleCap;
    p.active = true;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = life; p.maxLife = life; p.size = size; p.color = color;
    p.drag = drag; p.grav = grav;
  }

  private spawnBurst(x: number, y: number, color: BallColor, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = this.engine.rngFx.range(0, Math.PI * 2);
      const sp = this.engine.rngFx.range(1.5, 5.5);
      this.spawnParticle(
        x, y, Math.cos(a) * sp, Math.sin(a) * sp,
        this.engine.rngFx.range(0.3, 0.6),
        this.engine.rngFx.range(0.16, 0.3),
        color, 2.2, 3.5,
      );
    }
    this.ripples.push({ x, y, r: 0.3, vr: 4.5, life: 0.25, maxLife: 0.25, color: "255,255,255" });
  }

  private spawnPuff(x: number, y: number, color: BallColor): void {
    for (let i = 0; i < 6; i++) {
      const a = this.engine.rngFx.range(0, Math.PI * 2);
      const sp = this.engine.rngFx.range(0.5, 2);
      this.spawnParticle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, 0.3, 0.2, color, 3, 0);
    }
  }

  // ---------- loop ----------

  private readonly loop = (now: number): void => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.loop);
    const rawDt = Math.min((now - this.last) / 1000, TUNING.MAX_FRAME_TIME);
    this.last = now;

    // DPR auto-drop: if the rolling frame time is slow over the first
    // 3s of the level, drop to 1.5 + fewer particles (applied only
    // while aiming, never mid-cascade).
    if (!this.dprEvaluated && now - this.startedAt < DPR_DROP_WINDOW_MS) {
      this.frameTimes.push(rawDt);
    } else if (!this.dprEvaluated) {
      this.dprEvaluated = true;
      const sorted = [...this.frameTimes].sort((a, b) => a - b);
      const median = sorted.length > 0 ? (sorted[Math.floor(sorted.length / 2)] as number) : 0;
      if (median * 1000 > DPR_DROP_FRAME_MS && this.dpr > 1.5) {
        this.dprDropPending = true;
      }
    }
    if (this.dprDropPending && this.engine.phase === "aiming") {
      this.dprDropPending = false;
      this.dpr = 1.5;
      this.particleCap = PARTICLE_CAP_LOW;
      this.resize();
    }

    if (this.paused) {
      this.draw(now / 1000);
      return;
    }

    const slowmo = now < this.slowmoUntil ? this.slowmoScale : 1;
    const sdt = rawDt * slowmo;
    this.acc += sdt;
    let steps = 0;
    while (this.acc >= TUNING.SIM_DT && steps < 30) {
      this.engine.fixedUpdate(TUNING.SIM_DT);
      this.acc -= TUNING.SIM_DT;
      steps += 1;
    }
    if (steps >= 30) this.acc = 0;

    // Resolving completes once the pop wave + slide are done (fallers
    // keep falling in the background — they never block the next
    // shot). A hard timeout guarantees progress.
    if (this.engine.phase === "resolving") {
      if (this.prevPhase !== "resolving") this.resolveStartAt = now;
      const slideDone = !this.slideActive;
      const elapsed = now - this.resolveStartAt;
      if (
        (this.popping.length === 0 && slideDone && elapsed > RESOLVE_MIN_MS) ||
        elapsed > RESOLVE_MAX_MS
      ) {
        this.engine.finishResolving();
      }
    }
    this.prevPhase = this.engine.phase;

    this.stepFx(sdt, rawDt, now);
    this.syncHud(false);
    this.draw(now / 1000);
  };

  private stepFx(sdt: number, rawDt: number, now: number): void {
    // Slide-down tween after a push.
    if (this.slideActive) {
      const p = Math.min(1, (now - this.slideStart) / (TUNING.PUSH_ANIM * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      this.slideFrom = -ROW_H * (1 - eased);
      if (p >= 1) {
        this.slideFrom = 0;
        this.slideActive = false;
      }
    }
    // Shake decay + recoil decay use real time so they settle even
    // during slow-mo.
    this.trauma = Math.max(0, this.trauma - TUNING.SHAKE_DECAY * rawDt);
    this.recoil = Math.max(0, this.recoil - rawDt * 6);

    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= sdt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      const dragF = Math.max(0, 1 - p.drag * sdt);
      p.vx *= dragF;
      p.vy = p.vy * dragF + p.grav * sdt;
      p.x += p.vx * sdt;
      p.y += p.vy * sdt;
    }

    for (let i = this.fallers.length - 1; i >= 0; i--) {
      const f = this.fallers[i] as Faller;
      if (f.hang > 0) {
        f.hang -= sdt;
        f.y -= 0.12 * sdt; // hang/lurch so the player registers the detach
        continue;
      }
      f.vy += TUNING.GRAVITY * sdt;
      f.x += f.vx * sdt;
      f.y += f.vy * sdt;
      f.rot += f.vr * sdt;
      if (f.x < R) {
        f.x = R + (R - f.x);
        f.vx = -f.vx * TUNING.FALLER_RESTITUTION;
      } else if (f.x > TUNING.WORLD_W - R) {
        f.x = TUNING.WORLD_W - R - (f.x - (TUNING.WORLD_W - R));
        f.vx = -f.vx * TUNING.FALLER_RESTITUTION;
      }
      if (f.y > TUNING.WORLD_H + 0.6) {
        this.ripples.push({
          x: Math.max(R, Math.min(TUNING.WORLD_W - R, f.x)), y: TUNING.WORLD_H - 0.2,
          r: 0.3, vr: 4, life: 0.3, maxLife: 0.3, color: "255,255,255",
        });
        this.fallers.splice(i, 1);
      }
    }

    for (let i = this.popping.length - 1; i >= 0; i--) {
      const p = this.popping[i] as Popping;
      p.life -= sdt;
      if (p.life <= 0) {
        this.spawnBurst(p.x, p.y, p.color, 8);
        this.popping.splice(i, 1);
      }
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i] as FloatText;
      t.life -= rawDt;
      t.y -= 1.1 * rawDt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i] as Ripple;
      r.life -= sdt;
      r.r += r.vr * sdt;
      if (r.life <= 0) this.ripples.splice(i, 1);
    }

    // Prune expired squash/jiggle entries.
    for (const [k, s] of this.squash) {
      if (now - s.start > SQUASH_MS) this.squash.delete(k);
    }
    for (const [k, s] of this.jiggle) {
      if (now - s.start > JIGGLE_MS) this.jiggle.delete(k);
    }
    if (this.banner && now - this.banner.start > 900) this.banner = null;
  }

  private syncHud(force: boolean): void {
    const hud: HudState = {
      score: this.engine.score,
      comboMult: Math.round(this.engine.multiplier * 10) / 10,
      shotsLeft: this.engine.shotsToPush,
    };
    const last = this.lastHud;
    if (
      force ||
      !last ||
      last.score !== hud.score ||
      last.comboMult !== hud.comboMult ||
      last.shotsLeft !== hud.shotsLeft
    ) {
      this.lastHud = hud;
      this.opts.onHud(hud);
    }
  }

  // ---------- drawing ----------

  private draw(timeSec: number): void {
    const { ctx } = this;
    const now = performance.now();
    const shakeAmp = this.opts.reducedMotion ? 0 : this.trauma * this.trauma * TUNING.SHAKE_MAX;
    const shx = shakeAmp * Math.sin(timeSec * 91.7);
    const shy = shakeAmp * Math.cos(timeSec * 113.3);

    ctx.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, shx * this.dpr * this.scale, shy * this.dpr * this.scale);

    // Backdrop.
    if (this.backdrop) {
      ctx.drawImage(this.backdrop, 0, 0, TUNING.WORLD_W, TUNING.WORLD_H);
    } else {
      ctx.fillStyle = THEMES[this.opts.level.theme].bgTop;
      ctx.fillRect(0, 0, TUNING.WORLD_W, TUNING.WORLD_H);
    }

    const slideY = this.slideFrom;
    const spriteSize = spriteDrawSize();

    // Contact shadows under settled balls.
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    for (const [k] of this.engine.cells) {
      const row = Math.floor(k / 64);
      const col = k % 64;
      const w = cellToWorld(row, col, this.engine.parity, this.engine.cols);
      ctx.beginPath();
      ctx.ellipse(w.x, w.y + R * 0.82 + slideY, R * 0.8, R * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Settled balls, with squash / jiggle / slide offsets.
    for (const [k, color] of this.engine.cells) {
      const row = Math.floor(k / 64);
      const col = k % 64;
      const w = cellToWorld(row, col, this.engine.parity, this.engine.cols);
      let x = w.x;
      let y = w.y + slideY;
      let sx = 1;
      let sy = 1;
      let rot = 0;
      const sq = this.squash.get(k);
      if (sq) {
        const p = Math.min(1, (now - sq.start) / SQUASH_MS);
        const amt = 0.25 * (1 - p);
        // Compress along the impact axis, bulge perpendicular.
        sx = 1 + amt * 0.6;
        sy = 1 - amt;
        rot = Math.atan2(sq.ay, sq.ax) + Math.PI / 2;
      }
      const jg = this.jiggle.get(k);
      if (jg) {
        const elapsed = (now - jg.start) / 1000;
        const amp = 0.05 * Math.exp(-elapsed * 6) * Math.sin(elapsed * 30);
        const dir = ((k * 2654435761) % 360) * (Math.PI / 180);
        x += Math.cos(dir) * amp;
        y += Math.sin(dir) * amp;
      }
      this.drawBallSprite(color, x, y, spriteSize, sx, sy, rot, 1);
    }

    // Popping balls: grow ~1.3x, then burst.
    for (const p of this.popping) {
      const growPortion = Math.min(1, Math.max(0, (0.06 - p.life) / 0.06));
      const s = 1 + 0.3 * growPortion;
      const alpha = p.life < 0.02 ? 0.5 : 1;
      this.drawBallSprite(p.color, p.x, p.y, spriteSize * s, 1, 1, 0, alpha);
    }

    // Aim guide + ghost (aiming only).
    if (this.engine.phase === "aiming" && !this.paused) {
      this.drawAimGuide();
    }

    // Projectile + trail.
    const proj = this.engine.projectile;
    if (proj) {
      const trailSlot = this.trail[this.trailCursor] as Vec2;
      trailSlot.x = proj.x;
      trailSlot.y = proj.y;
      this.trailCursor = (this.trailCursor + 1) % TRAIL_LEN;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < TRAIL_LEN; i++) {
        const idx = (this.trailCursor + i) % TRAIL_LEN;
        const t = this.trail[idx] as Vec2;
        if (t.x === 0 && t.y === 0) continue;
        const a = (i / TRAIL_LEN) * 0.35;
        const size = 0.34 * (0.4 + 0.6 * (i / TRAIL_LEN));
        ctx.globalAlpha = a;
        ctx.drawImage(glowSprite(proj.color), t.x - size / 2, t.y - size / 2, size, size);
      }
      ctx.restore();
      const angle = Math.atan2(proj.vy, proj.vx) + Math.PI / 2;
      this.drawBallSprite(proj.color, proj.x, proj.y, spriteSize, 0.9, 1.12, angle, 1);
    }

    // Fallers.
    for (const f of this.fallers) {
      this.drawBallSprite(f.color, f.x, f.y, spriteSize, 1, 1, f.rot, 1);
    }

    // Particles (additive glow).
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.particles) {
      if (!p.active) continue;
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      const size = p.size * (0.6 + 0.4 * a);
      ctx.drawImage(glowSprite(p.color), p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.restore();

    // Ripples.
    for (const r of this.ripples) {
      const a = Math.max(0, r.life / r.maxLife) * 0.7;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r.color},${a.toFixed(3)})`;
      ctx.lineWidth = 0.05;
      ctx.stroke();
    }

    this.drawDangerLine(timeSec);
    this.drawLauncher(timeSec);

    // Floating score texts.
    for (const t of this.texts) {
      const a = Math.max(0, Math.min(1, t.life / t.maxLife));
      ctx.font = `700 ${t.size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 0.09;
      ctx.strokeStyle = `rgba(0,0,0,${(0.65 * a).toFixed(3)})`;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.globalAlpha = a;
      ctx.fillText(t.text, t.x, t.y);
      ctx.globalAlpha = 1;
    }

    // Banner.
    if (this.banner) {
      const elapsed = now - this.banner.start;
      const inP = Math.min(1, elapsed / 160);
      const scaleIn = 1 + 0.35 * (1 - inP) * (1 - inP);
      const alpha = elapsed > 650 ? Math.max(0, 1 - (elapsed - 650) / 250) : 1;
      ctx.save();
      ctx.translate(TUNING.WORLD_W / 2, 6.2);
      ctx.scale(scaleIn, scaleIn);
      ctx.font = "800 1.05px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 0.14;
      ctx.strokeStyle = `rgba(0,0,0,${(0.7 * alpha).toFixed(3)})`;
      ctx.strokeText(this.banner.word, 0, 0);
      ctx.fillStyle = `rgba(255,215,94,${alpha.toFixed(3)})`;
      ctx.fillText(this.banner.word, 0, 0);
      ctx.restore();
    }

    // Win/fail flash.
    if (now < this.flashUntil) {
      const a = this.flashAlpha * ((this.flashUntil - now) / 500);
      ctx.fillStyle = `rgba(${this.flashColor},${a.toFixed(3)})`;
      ctx.fillRect(0, 0, TUNING.WORLD_W, TUNING.WORLD_H);
    }
  }

  private drawBallSprite(
    color: BallColor,
    x: number,
    y: number,
    size: number,
    sx: number,
    sy: number,
    rot: number,
    alpha: number,
  ): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    if (rot !== 0) ctx.rotate(rot);
    if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
    if (alpha !== 1) ctx.globalAlpha = alpha;
    ctx.drawImage(ballSprite(color), -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  private drawAimGuide(): void {
    const { ctx } = this;
    const angleKey = Math.round(this.engine.aimAngle / 0.002);
    const cached = this.predCache;
    let pred: Prediction;
    if (cached && cached.angleKey === angleKey && cached.gridVersion === this.engine.gridVersion) {
      pred = cached.pred;
    } else {
      pred = predictPath(
        this.engine.launcherPos(),
        this.engine.aimAngle,
        this.engine.cells,
        this.engine.parity,
        this.engine.cols,
        TUNING.MAX_PREVIEW_BOUNCES,
      );
      this.predCache = { angleKey, gridVersion: this.engine.gridVersion, pred };
    }

    // Ghost ball on the exact landing cell.
    if (pred.ghost) {
      const w = cellToWorld(pred.ghost.row, pred.ghost.col, this.engine.parity, this.engine.cols);
      this.drawBallSprite(this.engine.chamber, w.x, w.y, spriteDrawSize(), 1, 1, 0, 0.32);
      ctx.beginPath();
      ctx.arc(w.x, w.y, R + 0.05, 0, Math.PI * 2);
      ctx.setLineDash([0.12, 0.1]);
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 0.045;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Dotted trajectory, fading with distance.
    const pts = pred.points;
    if (pts.length < 2) return;
    let dist = 0;
    let nextDot = 0.18;
    ctx.fillStyle = "#FFFFFF";
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1] as Vec2;
      const b = pts[i] as Vec2;
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      let d = nextDot - dist;
      while (d <= segLen) {
        const t = d / segLen;
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        const travelled = dist + d;
        const alpha = Math.max(0.25, 0.9 - travelled * 0.055);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, 0.07, 0, Math.PI * 2);
        ctx.fill();
        nextDot += 0.32;
        d = nextDot - dist;
      }
      dist += segLen;
    }
    ctx.globalAlpha = 1;
  }

  private drawDangerLine(timeSec: number): void {
    const { ctx } = this;
    const danger = this.engine.dangerLevel();
    const y = dangerLineY();
    const speed = 2 + danger * 2.2;
    const pulse = 0.5 + 0.5 * Math.sin(timeSec * speed);
    const redness = danger === 0 ? 0.15 + 0.15 * pulse : 0.35 + 0.3 * danger * 0.2 + 0.3 * pulse;
    const r = Math.round(217 + (229 - 217) * redness);
    const g = Math.round(160 - (160 - 72) * redness);
    const b = Math.round(68 - (68 - 77) * redness);
    const alpha = 0.4 + 0.35 * pulse * (danger > 0 ? 1 : 0.5);
    ctx.beginPath();
    ctx.setLineDash([0.22, 0.16]);
    ctx.moveTo(0.15, y);
    ctx.lineTo(TUNING.WORLD_W - 0.15, y);
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
    ctx.lineWidth = 0.055;
    ctx.stroke();
    ctx.setLineDash([]);
    // Edge glow as balls approach the line.
    if (danger >= 1) {
      const glowA = 0.05 * danger + 0.04 * pulse;
      const gradL = ctx.createLinearGradient(0, 0, 0.8, 0);
      gradL.addColorStop(0, `rgba(229,72,77,${glowA.toFixed(3)})`);
      gradL.addColorStop(1, "rgba(229,72,77,0)");
      ctx.fillStyle = gradL;
      ctx.fillRect(0, 0, 0.8, TUNING.WORLD_H);
      const gradR = ctx.createLinearGradient(TUNING.WORLD_W - 0.8, 0, TUNING.WORLD_W, 0);
      gradR.addColorStop(0, "rgba(229,72,77,0)");
      gradR.addColorStop(1, `rgba(229,72,77,${glowA.toFixed(3)})`);
      ctx.fillStyle = gradR;
      ctx.fillRect(TUNING.WORLD_W - 0.8, 0, 0.8, TUNING.WORLD_H);
    }
  }

  private drawLauncher(timeSec: number): void {
    const { ctx } = this;
    const lx = TUNING.LAUNCHER_X;
    const ly = TUNING.LAUNCHER_Y;
    const breathe = 1 + 0.02 * Math.sin(timeSec * 2.2);
    const spriteSize = spriteDrawSize();

    ctx.save();
    ctx.translate(lx, ly);
    ctx.scale(breathe, breathe);

    // Gold base ring.
    ctx.beginPath();
    ctx.arc(0, 0, 0.74, 0, Math.PI * 2);
    ctx.fillStyle = "#3A2A12";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 0.74, 0, Math.PI * 2);
    ctx.strokeStyle = "#D9A044";
    ctx.lineWidth = 0.09;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(217,160,68,0.45)";
    ctx.lineWidth = 0.045;
    ctx.stroke();

    // Barrel, rotated to the aim angle, with recoil.
    ctx.save();
    ctx.rotate(this.engine.aimAngle);
    const recoilOff = this.recoil * 0.18;
    ctx.translate(0, recoilOff);
    ctx.beginPath();
    const bw = 0.5;
    const bl = 1.02;
    ctx.moveTo(-bw / 2, 0.1);
    ctx.lineTo(-bw / 2, -bl);
    ctx.quadraticCurveTo(0, -bl - 0.18, bw / 2, -bl);
    ctx.lineTo(bw / 2, 0.1);
    ctx.closePath();
    ctx.fillStyle = "#8A5A10";
    ctx.fill();
    ctx.strokeStyle = "#D9A044";
    ctx.lineWidth = 0.05;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.1, -0.15);
    ctx.lineTo(-0.1, -bl + 0.1);
    ctx.strokeStyle = "rgba(255,230,170,0.7)";
    ctx.lineWidth = 0.06;
    ctx.stroke();
    ctx.restore();

    // Chambered ball.
    ctx.drawImage(ballSprite(this.engine.chamber), -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
    ctx.restore();

    // Next-ball preview.
    const ns = spriteSize * 0.62;
    const nx = lx + 1.18;
    const ny = ly + 0.34;
    ctx.beginPath();
    ctx.arc(nx, ny, ns * 0.52, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();
    ctx.drawImage(ballSprite(this.engine.next), nx - ns / 2, ny - ns / 2, ns, ns);

    // Push-countdown dots under the launcher.
    const total = this.opts.level.pushInterval;
    const left = this.engine.shotsToPush;
    const spacing = 0.26;
    const startX = lx - ((total - 1) * spacing) / 2;
    const dotY = ly + 1.02;
    for (let i = 0; i < total; i++) {
      const filled = i < left;
      ctx.beginPath();
      ctx.arc(startX + i * spacing, dotY, 0.085, 0, Math.PI * 2);
      if (filled) {
        ctx.fillStyle = "#D9A044";
        ctx.fill();
      } else {
        ctx.strokeStyle = "rgba(217,160,68,0.4)";
        ctx.lineWidth = 0.04;
        ctx.stroke();
      }
    }
  }
}
