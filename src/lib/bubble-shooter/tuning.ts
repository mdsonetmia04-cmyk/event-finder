/* Bubble Shooter tuning — every magic number in one place.
   Mirror of the color-shoot tuning-table pattern: edit here, never
   inline. World units: ball radius 0.5, board 8 units wide. Y grows
   DOWNWARD (Canvas 2D), row 0 hangs from the ceiling. */

export const TUNING = {
  // --- Geometry (world units) ---
  BALL_RADIUS: 0.5,
  GRID_COLS: 8,
  DEATH_ROW: 13,
  ROW_CAPACITY: 15, // DEATH_ROW + 2 of slack
  WORLD_W: 8,
  WORLD_H: 15,
  LAUNCHER_X: 4,
  LAUNCHER_Y: 13.8,

  // --- Shooting ---
  SHOT_SPEED: 22.0, // units/sec
  MAX_AIM_DEG: 75, // from vertical, each side
  SHOT_COOLDOWN: 0.12, // sec
  MAX_PREVIEW_BOUNCES: 2,
  TOUCH_AIM_OFFSET_PX: 60,

  // --- Simulation ---
  SIM_DT: 1 / 120,
  MAX_FRAME_TIME: 0.25,

  // --- Matching ---
  MIN_MATCH: 3,
  POP_STAGGER: 0.025, // sec between balls in a pop wave, per ring

  // --- Fallers ---
  GRAVITY: 18.0, // units/sec^2, downward
  FALLER_RESTITUTION: 0.4,
  FALLER_SPIN_MAX: 8.0, // rad/sec
  DETACH_HANG_TIME: 0.1,

  // --- Pressure ---
  PUSH_ANIM: 0.35, // sec, board slide-down
  MERCY_CLEAR_SIZE: 12, // no push while this many balls or fewer remain

  // --- Scoring ---
  POINTS_POP: 10,
  POINTS_DROP: 20,
  POINTS_DROP_BIG: 40, // per ball when 10+ drop in one shot
  DROP_BIG_COUNT: 10,
  COMBO_STEP: 0.5,
  COMBO_MAX: 5.0,
  RARE_COLOR_WEIGHT: 1.6,

  // --- Feel ---
  SHAKE_DECAY: 1.8,
  SHAKE_MAX: 0.12, // world units of screen offset at full trauma
  SLOWMO_AVALANCHE: { scale: 0.6, dur: 0.4 },
  SLOWMO_END: { scale: 0.3, dur: 0.6 },

  // --- Danger thresholds (rows from death line) ---
  DANGER_ROWS: [4, 2, 1], // → danger level 1, 2, 3

  // --- Trajectory prediction ---
  MAX_PREDICT_STEPS: 900, // ~7.5 s of flight at SIM_DT

  // --- Banners (single-shot cleared-ball thresholds) ---
  BANNERS: [
    { at: 16, word: "UNREAL!" },
    { at: 12, word: "AMAZING!" },
    { at: 8, word: "GREAT!" },
    { at: 5, word: "NICE!" },
  ],
} as const;

/** Ball colours are palette slots 0..5 (prefix-ordered: a colour in
    play is never swapped out as levels add more). */
export type BallColor = 0 | 1 | 2 | 3 | 4 | 5;

export interface PaletteEntry {
  /** Base colour. */
  hex: string;
  /** Near-white tint for the specular side of the sphere. */
  light: string;
  /** Darkened colour for the rim. */
  dark: string;
  /** Glyph printed on the ball so colour is never the only signal. */
  glyph: string;
}

/** Prefix-ordered palette with perceptual separation. Slots 7-8 are
    reserved if a later band ever wants 7-8 colours. */
export const PALETTE: PaletteEntry[] = [
  { hex: "#FF3B5C", light: "#FF8FA3", dark: "#B3122F", glyph: "●" },
  { hex: "#2FA8FF", light: "#8FD2FF", dark: "#0D6DB8", glyph: "■" },
  { hex: "#5CE85C", light: "#A9F5A9", dark: "#1FA81F", glyph: "▲" },
  { hex: "#FFC53B", light: "#FFE08F", dark: "#C78F00", glyph: "★" },
  { hex: "#B166FF", light: "#D9AEFF", dark: "#7A2FD0", glyph: "◆" },
  { hex: "#2FE8D8", light: "#8FF5EA", dark: "#0FA89A", glyph: "✚" },
];

export type ThemeId = "dawn" | "neon" | "deep";

export interface BoardTheme {
  /** Backdrop gradient, top → bottom. Dark in both site themes: glossy
      balls only read on dark. */
  bgTop: string;
  bgBottom: string;
  /** Faint hex-grid dot colour. */
  dot: string;
}

export const THEMES: Record<ThemeId, BoardTheme> = {
  dawn: { bgTop: "#241640", bgBottom: "#57241E", dot: "rgba(255, 220, 180, 0.10)" },
  neon: { bgTop: "#0A1B33", bgBottom: "#07332E", dot: "rgba(140, 240, 230, 0.10)" },
  deep: { bgTop: "#0B0B12", bgBottom: "#241640", dot: "rgba(200, 170, 255, 0.10)" },
};
