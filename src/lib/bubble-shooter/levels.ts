/* Bubble Shooter levels — 30 levels in three difficulty bands,
   mirroring Arrows Out. One row per level in the table below; all
   numbers live here, never inline.

   Curve: colours 3 → 6 (palette is prefix-ordered), initial rows
   4 → 8, fill density 0.85 → 1.0, push interval 8 → 5 shots.
   Boards are seeded (mulberry32): same level = same board for every
   player, every retry. Levels 10, 20 and 30 use hand-authored ASCII
   layouts instead of generated boards. */

import { findOrphans, colorCounts } from "./matcher";
import { Rng } from "./rng";
import { TUNING, type BallColor, type ThemeId } from "./tuning";
import { keyRC, rowCellCount, type GridCells } from "./grid";

export type BubbleDifficulty = "normal" | "hard" | "superHard";

export interface BubbleLevel {
  /** 1-based level number. */
  n: number;
  /** Fixed seed: board generation + shot colours + FX jitter derive
      three independent streams from it. */
  seed: number;
  /** Palette prefix size: colours 0..colorCount-1 are in play. */
  colorCount: number;
  /** Rows of balls at level start. */
  initialRows: number;
  /** Fill probability per cell for generated boards (0..1). */
  fillDensity: number;
  /** Landed shots between ceiling pushes. */
  pushInterval: number;
  /** Score needed for 2 / 3 stars (1 star for any clear). */
  starThreshold2: number;
  starThreshold3: number;
  theme: ThemeId;
  /** ASCII layout for boss levels; overrides generation. */
  layout?: string;
}

/** Difficulty bands, like the reference game: Normal 1-10, Hard
    11-20, Super Hard 21-30. */
export function levelDifficulty(n: number): BubbleDifficulty {
  if (n <= 10) return "normal";
  if (n <= 20) return "hard";
  return "superHard";
}

function themeForLevel(n: number): ThemeId {
  if (n <= 10) return "dawn";
  if (n <= 20) return "neon";
  return "deep";
}

/* Hand-authored boss boards. One character per cell, left to right:
   '.' = empty, 'A'..'F' = palette slots 0..5. Only slots below the
   level's colorCount may be used. Lines alternate 8/7 characters
   (even rows are long, odd rows are short — parity 0). Everything
   must be anchored to row 0; the level-check script proves it. */
const BOSS_LAYOUTS: Record<number, string> = {
  // 10 — "Rings": a hollow frame (colorCount 4: A..D). Shots fly
  // through the middle and stick to the inner edges.
  10: `ABCDABCD
D.....A
A......B
B.....D
C......D
D.....C
ABCDABCD`,
  // 20 — "Heart": two lobes tapering to a point (colorCount 5: A..E).
  20: `.AA..BB.
ABCDEAB
BCDEABCD
CDEABCD
.DEABC..
..EAB..
...A....`,
  // 30 — "Star": point, wide middle, two legs (colorCount 6: A..F).
  30: `...A....
..ABC..
ABCDEFAB
.BCDEF.
.CDEFA..
..DEF..
..E.A...
..F.B..`,
};

/* One row per level: [colorCount, initialRows, fillDensity, pushInterval].
   Star thresholds are computed from the expected ball count (see
   buildLevels): clear bonus (level × 500) + play score. */
const TABLE: Array<[number, number, number, number]> = [
  [3, 4, 0.85, 8], // 1
  [3, 4, 0.85, 8], // 2
  [3, 4, 0.85, 8], // 3
  [3, 4, 0.85, 8], // 4
  [3, 4, 0.85, 8], // 5
  [4, 4, 0.85, 8], // 6
  [4, 5, 0.85, 8], // 7
  [4, 5, 0.85, 7], // 8
  [4, 5, 0.85, 7], // 9
  [4, 7, 1.0, 7], // 10 — boss: rings (layout rows override initialRows)
  [5, 5, 0.9, 7], // 11
  [5, 5, 0.9, 7], // 12
  [5, 6, 0.9, 7], // 13
  [5, 6, 0.9, 7], // 14
  [5, 6, 0.9, 6], // 15
  [5, 6, 0.9, 6], // 16
  [5, 6, 0.9, 6], // 17
  [5, 6, 0.9, 6], // 18
  [5, 7, 0.9, 6], // 19
  [5, 7, 1.0, 6], // 20 — boss: heart
  [6, 7, 0.95, 6], // 21
  [6, 7, 0.95, 5], // 22
  [6, 7, 0.95, 5], // 23
  [6, 7, 0.95, 5], // 24
  [6, 7, 0.95, 5], // 25
  [6, 8, 1.0, 5], // 26
  [6, 8, 1.0, 5], // 27
  [6, 8, 1.0, 5], // 28
  [6, 8, 1.0, 5], // 29
  [6, 8, 1.0, 5], // 30 — boss: star
];

function round50(n: number): number {
  return Math.round(n / 50) * 50;
}

function buildLevels(): BubbleLevel[] {
  return TABLE.map(([colorCount, initialRows, fillDensity, pushInterval], i) => {
    const n = i + 1;
    const layout = BOSS_LAYOUTS[n];
    const estBalls = layout
      ? layout.replace(/[^A-F]/g, "").length
      : Math.round(initialRows * 7.5 * fillDensity);
    const clearBonus = n * 500;
    return {
      n,
      seed: 776211 + n * 7919,
      colorCount,
      initialRows: layout ? layout.split("\n").length : initialRows,
      fillDensity,
      pushInterval,
      starThreshold2: round50(clearBonus + estBalls * TUNING.POINTS_POP),
      starThreshold3: round50(clearBonus + estBalls * 18),
      theme: themeForLevel(n),
      layout,
    };
  });
}

export const BUBBLE_LEVELS: BubbleLevel[] = buildLevels();

/** Stars earned for a clear: 1 for clearing, 2/3 by score. */
export function starsForScore(level: BubbleLevel, score: number): 1 | 2 | 3 {
  if (score >= level.starThreshold3) return 3;
  if (score >= level.starThreshold2) return 2;
  return 1;
}

/** Palette slot letters used in ASCII layouts: A=0 .. F=5. */
export function letterToColor(letter: string): number | null {
  const code = letter.toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 70) return code - 65;
  return null;
}

function parseLayout(level: BubbleLevel): GridCells {
  const layout = level.layout as string;
  const lines = layout.split("\n");
  const cells: GridCells = new Map();
  lines.forEach((line, row) => {
    const expected = rowCellCount(row, 0, TUNING.GRID_COLS);
    if (line.length !== expected) {
      throw new Error(
        `Level ${level.n} layout row ${row}: expected ${expected} chars, got ${line.length} ("${line}")`,
      );
    }
    for (let col = 0; col < line.length; col++) {
      const ch = line[col] as string;
      if (ch === ".") continue;
      const color = letterToColor(ch);
      if (color === null || color >= level.colorCount) {
        throw new Error(`Level ${level.n} layout: invalid letter "${ch}" at row ${row}, col ${col}`);
      }
      cells.set(keyRC(row, col), color as BallColor);
    }
  });
  return cells;
}

/** Build the starting board for a level. Deterministic: the same
    level always produces the same board. Generated boards are swept
    for orphans (density gaps can strand balls) and every palette
    colour is guaranteed at least 3 balls so no colour is
    unplayable. Boss layouts are used verbatim (anchoring is proven
    by the level-check script). */
export function generateBoard(level: BubbleLevel): { cells: GridCells; parity: 0 | 1 } {
  if (level.layout) {
    return { cells: parseLayout(level), parity: 0 };
  }
  const rng = new Rng(level.seed);
  const cells: GridCells = new Map();
  for (let row = 0; row < level.initialRows; row++) {
    const count = rowCellCount(row, 0, TUNING.GRID_COLS);
    for (let col = 0; col < count; col++) {
      if (rng.chance(level.fillDensity)) {
        cells.set(keyRC(row, col), rng.int(level.colorCount) as BallColor);
      }
    }
  }
  // Sweep orphans: anything not connected to row 0 cannot be reached.
  for (const orphan of findOrphans(cells, 0, TUNING.GRID_COLS)) {
    cells.delete(keyRC(orphan.row, orphan.col));
  }
  // Colour floor: every palette colour appears at least 3 times, so
  // the player can always build a match of any live colour.
  const counts = colorCounts(cells);
  const keys = [...cells.keys()];
  for (let c = 0; c < level.colorCount; c++) {
    let guard = 0;
    while ((counts.get(c as BallColor) ?? 0) < 3 && keys.length > 6 && guard < 40) {
      guard += 1;
      const k = keys[rng.int(keys.length)] as number;
      const prev = cells.get(k) as BallColor;
      if (prev === c) continue;
      if ((counts.get(prev) ?? 0) <= 3) continue;
      cells.set(k, c as BallColor);
      counts.set(prev, (counts.get(prev) as number) - 1);
      counts.set(c as BallColor, (counts.get(c as BallColor) ?? 0) + 1);
    }
  }
  return { cells, parity: 0 };
}
