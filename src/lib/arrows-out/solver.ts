/* Arrows Out — pure puzzle logic for the winding-arrow maze style.
   No React imports, no I/O: the same functions drive the game page,
   the hint button, and the offline solvability check
   (scripts/check-arrows-levels.mjs), so a hint can never disagree
   with the game.

   Model: the board is a square grid of cells. Each arrow is ONE
   polyline path — an ordered list of grid cells from tail to head,
   with bends (orthogonal steps only, never revisiting a cell). The
   head end carries an arrowhead pointing in the direction of the
   last step. Paths never share a cell: lines weave around each
   other, never cross.

   Removal rule: an arrow can leave iff the straight lane from its
   HEAD cell, continuing in the head's pointing direction to the
   board edge, contains no cell occupied by any OTHER arrow. (Its
   own cells never block it — the arrow slides out along its own
   path.) Removing arrows only ever opens lanes, so the greedy
   solver below is complete: if ANY removal order clears the board,
   repeatedly removing any arrow with a clear lane clears it too. */

export type Direction = "up" | "down" | "left" | "right";

/** Shaped boards (video-style): a mask over the square grid — cells
    outside the shape hold no arrows. Void cells never block an exit
    ray (they are empty space), so the straight-ray removal rule and
    the greedy solver are unchanged; the mask only restricts where
    arrow cells may sit. */
export type ArrowsShape = "heart" | "circle" | "diamond";

/** Playable-cell mask for a shaped board, row-major (true = inside
    the shape). Heart/circle are 10x10 boards, diamond is 14x14. */
export function shapeMask(size: number, shape: ArrowsShape): boolean[][] {
  if (shape === "heart") {
    const rows = [
      "..........",
      ".XXX..XXX.",
      "XXXXXXXXXX",
      "XXXXXXXXXX",
      "XXXXXXXXXX",
      ".XXXXXXXX.",
      "..XXXXXX..",
      "...XXXX...",
      "....XX....",
      "..........",
    ];
    return rows.map((r) => [...r].map((c) => c === "X"));
  }
  const mask: boolean[][] = [];
  const mid = (size - 1) / 2;
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      if (shape === "circle") {
        const dr = r - mid;
        const dc = c - mid;
        row.push(dr * dr + dc * dc <= 4.6 * 4.6);
      } else {
        row.push(Math.abs(r - mid) + Math.abs(c - mid) <= 7);
      }
    }
    mask.push(row);
  }
  return mask;
}

/** Number of playable cells in a shape mask. */
export function shapeCellCount(size: number, shape: ArrowsShape): number {
  return shapeMask(size, shape).flat().filter(Boolean).length;
}

export interface CellPos {
  row: number;
  col: number;
}

/** Compact shipped format: the tail cell + one step letter per move
    (U = row-1, D = row+1, L = col-1, R = col+1), tail to head. */
export interface ArrowSpec {
  start: [number, number];
  steps: string;
}

export interface MazeArrow {
  /** Index within its level (stable id for the page). */
  id: number;
  /** Tail-to-head cells, inclusive. */
  cells: CellPos[];
  /** Direction of the last step — where the arrowhead points. */
  headDir: Direction;
}

export const DIRECTION_DELTAS: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

const STEP_TO_DIRECTION: Record<string, Direction> = {
  U: "up",
  D: "down",
  L: "left",
  R: "right",
};

export function headCell(arrow: MazeArrow): CellPos {
  return arrow.cells[arrow.cells.length - 1];
}

/** Parse one arrow spec into cells. Throws on bad steps, out-of-grid
    cells, self-intersection, a path shorter than 2 cells (a head
    needs at least one step to point anywhere), or — when `shape` is
    given — a cell outside the shape mask. */
export function parseArrow(spec: ArrowSpec, id: number, size: number, shape?: ArrowsShape): MazeArrow {
  const [startRow, startCol] = spec.start;
  if (
    !Number.isInteger(startRow) ||
    !Number.isInteger(startCol) ||
    startRow < 0 ||
    startRow >= size ||
    startCol < 0 ||
    startCol >= size
  ) {
    throw new Error(`Arrows Out arrow ${id}: start [${startRow},${startCol}] is outside the ${size}x${size} grid`);
  }
  const mask = shape ? shapeMask(size, shape) : null;
  if (mask && !mask[startRow][startCol]) {
    throw new Error(`Arrows Out arrow ${id}: start [${startRow},${startCol}] is outside the ${shape} shape`);
  }
  if (typeof spec.steps !== "string" || spec.steps.length < 1) {
    throw new Error(`Arrows Out arrow ${id}: needs at least one step`);
  }
  const cells: CellPos[] = [{ row: startRow, col: startCol }];
  const seen = new Set<string>([`${startRow},${startCol}`]);
  let row = startRow;
  let col = startCol;
  let headDir: Direction = "up";
  for (const ch of spec.steps) {
    const dir = STEP_TO_DIRECTION[ch];
    if (!dir) throw new Error(`Arrows Out arrow ${id}: bad step letter "${ch}"`);
    headDir = dir;
    row += DIRECTION_DELTAS[dir].dr;
    col += DIRECTION_DELTAS[dir].dc;
    if (row < 0 || row >= size || col < 0 || col >= size) {
      throw new Error(`Arrows Out arrow ${id}: step "${ch}" leaves the ${size}x${size} grid`);
    }
    if (mask && !mask[row][col]) {
      throw new Error(`Arrows Out arrow ${id}: step "${ch}" leaves the ${shape} shape at [${row},${col}]`);
    }
    const key = `${row},${col}`;
    if (seen.has(key)) throw new Error(`Arrows Out arrow ${id}: path revisits cell ${key}`);
    seen.add(key);
    cells.push({ row, col });
  }
  return { id, cells, headDir };
}

/** Parse a whole level. Throws when two arrows share a cell. */
export function parseLevel(specs: ArrowSpec[], size: number, shape?: ArrowsShape): MazeArrow[] {
  const arrows = specs.map((spec, i) => parseArrow(spec, i, size, shape));
  const owner = new Map<string, number>();
  for (const arrow of arrows) {
    for (const cell of arrow.cells) {
      const key = `${cell.row},${cell.col}`;
      const clash = owner.get(key);
      if (clash !== undefined) {
        throw new Error(`Arrows Out: arrows ${clash} and ${arrow.id} share cell ${key}`);
      }
      owner.set(key, arrow.id);
    }
  }
  return arrows;
}

export function countCells(arrows: MazeArrow[]): number {
  let n = 0;
  for (const arrow of arrows) n += arrow.cells.length;
  return n;
}

/** Occupancy grid: arrow id per cell, or -1 when empty. Removed
    arrows (ids in `removed`) leave their cells empty. */
export function occupancyGrid(
  arrows: MazeArrow[],
  size: number,
  removed: ReadonlySet<number>,
): number[][] {
  const grid: number[][] = Array.from({ length: size }, () => Array<number>(size).fill(-1));
  for (const arrow of arrows) {
    if (removed.has(arrow.id)) continue;
    for (const cell of arrow.cells) grid[cell.row][cell.col] = arrow.id;
  }
  return grid;
}

/** True when the arrow's head lane to the edge holds no cell of any
    other still-present arrow. Removed arrows never block. */
export function headLaneClear(
  arrows: MazeArrow[],
  size: number,
  removed: ReadonlySet<number>,
  arrowId: number,
): boolean {
  const arrow = arrows[arrowId];
  if (!arrow || removed.has(arrowId)) return false;
  const grid = occupancyGrid(arrows, size, removed);
  const head = headCell(arrow);
  const { dr, dc } = DIRECTION_DELTAS[arrow.headDir];
  let r = head.row + dr;
  let c = head.col + dc;
  while (r >= 0 && r < size && c >= 0 && c < size) {
    const owner = grid[r][c];
    if (owner !== -1 && owner !== arrowId) return false;
    r += dr;
    c += dc;
  }
  return true;
}

/** Ids of every arrow that could leave right now, in level order. */
export function removableArrows(
  arrows: MazeArrow[],
  size: number,
  removed: ReadonlySet<number>,
): number[] {
  const out: number[] = [];
  for (const arrow of arrows) {
    if (!removed.has(arrow.id) && headLaneClear(arrows, size, removed, arrow.id)) {
      out.push(arrow.id);
    }
  }
  return out;
}

/** One arrow that can leave right now (first in level order), or
    null. The hint button uses this — the same logic as the game. */
export function findRemovableArrow(
  arrows: MazeArrow[],
  size: number,
  removed: ReadonlySet<number>,
): number | null {
  const found = removableArrows(arrows, size, removed);
  return found.length > 0 ? found[0] : null;
}

/** True when the board can be fully cleared. Greedy removal is
    complete here: removing an arrow only opens lanes, so if any
    order works, removing clearable arrows in any order works too. */
export function isSolvable(arrows: MazeArrow[], size: number): boolean {
  const removed = new Set<number>();
  while (removed.size < arrows.length) {
    const next = findRemovableArrow(arrows, size, removed);
    if (next === null) return false;
    removed.add(next);
  }
  return true;
}

/** SVG path through the arrow's cell centers (tail to head), in a
    viewBox where each cell is `cell` units wide. */
export function arrowPathD(arrow: MazeArrow, cell: number): string {
  return arrow.cells
    .map((pos, i) => {
      const x = pos.col * cell + cell / 2;
      const y = pos.row * cell + cell / 2;
      return `${i === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}

/** Arrowhead triangle points (tip first) for the head cell, in the
    same viewBox units as arrowPathD. The tip reaches past the head
    cell center so the head reads clearly at small sizes. */
export function arrowheadPoints(arrow: MazeArrow, cell: number): string {
  const head = headCell(arrow);
  const cx = head.col * cell + cell / 2;
  const cy = head.row * cell + cell / 2;
  const { dr, dc } = DIRECTION_DELTAS[arrow.headDir];
  const tip = { x: cx + dc * cell * 0.42, y: cy + dr * cell * 0.42 };
  const base = { x: cx - dc * cell * 0.12, y: cy - dr * cell * 0.12 };
  // Perpendicular half-width.
  const px = -dr * cell * 0.22;
  const py = dc * cell * 0.22;
  const fmt = (n: number) => String(Math.round(n * 100) / 100);
  return [
    `${fmt(tip.x)},${fmt(tip.y)}`,
    `${fmt(base.x + px)},${fmt(base.y + py)}`,
    `${fmt(base.x - px)},${fmt(base.y - py)}`,
  ].join(" ");
}
