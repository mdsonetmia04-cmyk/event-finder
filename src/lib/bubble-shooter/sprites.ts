/* Pre-rendered glossy sphere sprites — the 3D look without a 3D
   engine. One sprite per colour is rendered ONCE into an offscreen
   canvas (radial-gradient sphere, specular highlight, rim light,
   printed glyph); every frame just drawImages it. No per-frame
   gradients, no per-frame paths for balls — that is the performance
   key. Client-only: callers run inside effects, never during SSR. */

import { PALETTE, TUNING, type BallColor, type BoardTheme } from "./tuning";

/** Sprite canvas size in px. The ball fills BALL_PX of it, leaving
    padding for antialiasing and the squash overshoot. */
export const SPRITE_PX = 128;
const BALL_PX = 112;

/** Draw size in world units so the painted ball spans exactly one
    ball diameter (2R). */
export function spriteDrawSize(): number {
  return (2 * TUNING.BALL_RADIUS * SPRITE_PX) / BALL_PX;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function makeBallSprite(color: BallColor): HTMLCanvasElement {
  const entry = PALETTE[color] as (typeof PALETTE)[number];
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_PX;
  canvas.height = SPRITE_PX;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const c = SPRITE_PX / 2;
  const rad = BALL_PX / 2;

  // 1. Base sphere: radial gradient, highlight point up-left.
  const grad = ctx.createRadialGradient(c - rad * 0.38, c - rad * 0.42, rad * 0.08, c, c, rad);
  grad.addColorStop(0, "#FFFFFF");
  grad.addColorStop(0.18, entry.light);
  grad.addColorStop(0.45, entry.hex);
  grad.addColorStop(0.85, entry.dark);
  grad.addColorStop(1, entry.dark);
  ctx.beginPath();
  ctx.arc(c, c, rad, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // 2. Rim light: thin lighter crescent on the bottom-right edge
  // (bounce light) — sells roundness against the dark board.
  ctx.beginPath();
  ctx.arc(c, c, rad - 2.5, Math.PI * 0.12, Math.PI * 0.48);
  ctx.strokeStyle = rgba(entry.light, 0.55);
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.stroke();

  // 3. Specular highlight: white ellipse, upper-left, rotated -25°,
  // plus a small bright dot. Fixed relative to the light, never
  // rotating with the ball.
  ctx.save();
  ctx.translate(c - rad * 0.34, c - rad * 0.4);
  ctx.rotate((-25 * Math.PI) / 180);
  ctx.beginPath();
  ctx.ellipse(0, 0, rad * 0.34, rad * 0.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(c - rad * 0.14, c - rad * 0.52, rad * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();

  // 4. Glyph: printed on the ball at low opacity so colour is never
  // the only signal (colour-blind friendly, readable at small sizes).
  ctx.font = `bold ${Math.round(rad * 0.78)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(entry.glyph, c, c + rad * 0.08);

  return canvas;
}

let ballCache: HTMLCanvasElement[] | null = null;

export function ballSprite(color: BallColor): HTMLCanvasElement {
  if (!ballCache) {
    ballCache = PALETTE.map((_, i) => makeBallSprite(i as BallColor));
  }
  return ballCache[color] as HTMLCanvasElement;
}

/** Soft glow dot for particles: white core → colour → transparent. */
function makeGlowSprite(color: BallColor): HTMLCanvasElement {
  const entry = PALETTE[color] as (typeof PALETTE)[number];
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.35, rgba(entry.hex, 0.85));
  grad.addColorStop(1, rgba(entry.hex, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

let glowCache: HTMLCanvasElement[] | null = null;

export function glowSprite(color: BallColor): HTMLCanvasElement {
  if (!glowCache) {
    glowCache = PALETTE.map((_, i) => makeGlowSprite(i as BallColor));
  }
  return glowCache[color] as HTMLCanvasElement;
}

/** Static board backdrop: theme gradient + vignette + faint
    hex-grid dots at cell centres. Rendered once per resize/theme;
    the frame loop just drawImages it. */
export function buildBackdrop(
  cssW: number,
  cssH: number,
  dpr: number,
  theme: BoardTheme,
  cols: number,
  parity: 0 | 1,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.scale(dpr, dpr);

  const grad = ctx.createLinearGradient(0, 0, 0, cssH);
  grad.addColorStop(0, theme.bgTop);
  grad.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cssW, cssH);

  // Faint dots at cell centres, so the hex lattice reads even on
  // empty rows. Geometry mirrors grid.ts (y-down, R = cssW/16).
  const rPx = cssW / (cols * 2);
  const rowH = rPx * Math.sqrt(3);
  ctx.fillStyle = theme.dot;
  const rows = Math.ceil(cssH / rowH);
  for (let row = 0; row < rows; row++) {
    const short = ((row + parity) & 1) === 1;
    const count = short ? cols - 1 : cols;
    for (let col = 0; col < count; col++) {
      const x = rPx + col * 2 * rPx + (short ? rPx : 0);
      const y = rPx + row * rowH;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, rPx * 0.09), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Vignette: darken the edges so the glossy balls pop.
  const vig = ctx.createRadialGradient(
    cssW / 2,
    cssH * 0.42,
    Math.min(cssW, cssH) * 0.35,
    cssW / 2,
    cssH / 2,
    Math.max(cssW, cssH) * 0.75,
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, cssW, cssH);

  return canvas;
}
