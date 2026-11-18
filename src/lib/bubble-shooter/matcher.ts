/* Pure matching logic — flood fill, orphan detection, live colour
   pool. Returns cells/stats; never mutates the grid. The engine
   applies the results. All searches are iterative (explicit stack),
   never recursive. */

import { Rng } from "./rng";
import { TUNING, type BallColor } from "./tuning";
import { ballAt, key, neighbours, rowCellCount, type CellRef, type GridCells } from "./grid";

/** Connected group of `color` containing `start` (iterative DFS). */
export function findCluster(
  cells: GridCells,
  parity: 0 | 1,
  cols: number,
  start: CellRef,
  color: BallColor,
): CellRef[] {
  const seen = new Set<number>([key(start)]);
  const stack: CellRef[] = [start];
  const out: CellRef[] = [];
  while (stack.length > 0) {
    const c = stack.pop() as CellRef;
    out.push(c);
    for (const n of neighbours(c, parity, cols)) {
      if (seen.has(key(n))) continue;
      if (ballAt(cells, n) !== color) continue;
      seen.add(key(n));
      stack.push(n);
    }
  }
  return out;
}

/** BFS ring depth of every cell in the cluster, from `start`.
    Drives the staggered pop wave: balls pop in order of distance
    from the landed ball. */
export function clusterDepths(
  cells: GridCells,
  parity: 0 | 1,
  cols: number,
  start: CellRef,
  color: BallColor,
): Map<number, number> {
  const depths = new Map<number, number>([[key(start), 0]]);
  const queue: CellRef[] = [start];
  let head = 0;
  while (head < queue.length) {
    const c = queue[head] as CellRef;
    head += 1;
    const d = depths.get(key(c)) as number;
    for (const n of neighbours(c, parity, cols)) {
      if (depths.has(key(n))) continue;
      if (ballAt(cells, n) !== color) continue;
      depths.set(key(n), d + 1);
      queue.push(n);
    }
  }
  return depths;
}

/** All occupied balls with no connected path to row 0. Row 0 may be
    empty (e.g. after the board empties); then everything is
    orphaned. */
export function findOrphans(cells: GridCells, parity: 0 | 1, cols: number): CellRef[] {
  const anchored = new Set<number>();
  const stack: CellRef[] = [];
  const count0 = rowCellCount(0, parity, cols);
  for (let col = 0; col < count0; col++) {
    const c = { row: 0, col };
    if (ballAt(cells, c) !== null) {
      anchored.add(key(c));
      stack.push(c);
    }
  }
  while (stack.length > 0) {
    const c = stack.pop() as CellRef;
    for (const n of neighbours(c, parity, cols)) {
      if (ballAt(cells, n) === null || anchored.has(key(n))) continue;
      anchored.add(key(n));
      stack.push(n);
    }
  }

  const orphans: CellRef[] = [];
  for (const k of cells.keys()) {
    if (!anchored.has(k)) {
      orphans.push({ row: Math.floor(k / 64), col: k % 64 });
    }
  }
  return orphans;
}

/** Map colour → instance count. */
export function colorCounts(cells: GridCells): Map<BallColor, number> {
  const counts = new Map<BallColor, number>();
  for (const color of cells.values()) {
    counts.set(color, (counts.get(color) ?? 0) + 1);
  }
  return counts;
}

/** Colours currently present on the board (the live pool). */
export function liveColors(cells: GridCells): BallColor[] {
  return [...colorCounts(cells).keys()];
}

/** Pick the next shot colour from the live pool. Rare colours (1–2
    instances) are weighted ×1.6 so they can actually be swept. */
export function pickShotColor(
  cells: GridCells,
  rng: Rng,
  fallbackPaletteSize: number,
): BallColor {
  const counts = colorCounts(cells);
  if (counts.size === 0) {
    // Board empty mid-cascade — fall back to the level palette.
    return rng.int(fallbackPaletteSize) as BallColor;
  }
  const weighted: Array<readonly [BallColor, number]> = [];
  for (const [c, n] of counts) {
    weighted.push([c, n <= 2 ? TUNING.RARE_COLOR_WEIGHT : 1.0]);
  }
  return Rng.weightedPick(weighted, rng);
}

/** Count of a specific colour on the board. */
export function countColor(cells: GridCells, color: BallColor): number {
  let n = 0;
  for (const c of cells.values()) {
    if (c === color) n++;
  }
  return n;
}
