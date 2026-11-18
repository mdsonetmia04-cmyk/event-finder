/* Pure hex-grid geometry — offset ("odd-r") coordinates, y-down.
   No game state lives here; everything is derived from `parity`,
   `cols`, and world units. Balls sit on a hexagonal lattice: 8
   columns on long rows, 7 on short rows, short rows shifted right by
   one radius. Row 0 hangs from the ceiling (y = 0).

   Row indentation is NEVER stored per row: it is derived from a
   single `parity` bit. Pushing a new row flips parity and increments
   every ball's row — getting this wrong silently breaks neighbour
   adjacency. */

import { TUNING, type BallColor } from "./tuning";

export const R = TUNING.BALL_RADIUS;
export const ROW_H = R * Math.sqrt(3);

export interface CellRef {
  row: number;
  col: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** Occupied cells: numeric cell key → ball colour. */
export type GridCells = Map<number, BallColor>;

export function ballAt(cells: GridCells, cell: CellRef): BallColor | null {
  const found = cells.get(key(cell));
  return found === undefined ? null : found;
}

/** True when this row is shifted right by R and holds cols−1 cells. */
export function isShortRow(row: number, parity: 0 | 1): boolean {
  return ((row + parity) & 1) === 1;
}

export function rowCellCount(row: number, parity: 0 | 1, cols: number): number {
  return isShortRow(row, parity) ? cols - 1 : cols;
}

/** Centre of a cell in world units. */
export function cellToWorld(row: number, col: number, parity: 0 | 1, _cols: number): Vec2 {
  const indent = isShortRow(row, parity) ? R : 0;
  return {
    x: R + col * 2 * R + indent,
    y: R + row * ROW_H,
  };
}

/** Nearest cell to a world point (may be out of bounds — callers
    check with inBounds). */
export function worldToCell(p: Vec2, parity: 0 | 1, _cols: number): CellRef {
  const row = Math.round((p.y - R) / ROW_H);
  const indent = isShortRow(row, parity) ? R : 0;
  const col = Math.round((p.x - R - indent) / (2 * R));
  return { row, col };
}

export function inBounds(
  row: number,
  col: number,
  cols: number,
  parity: 0 | 1,
  maxRow: number = TUNING.ROW_CAPACITY,
): boolean {
  if (row < 0 || row >= maxRow || col < 0) return false;
  return col < rowCellCount(row, parity, cols);
}

/** Numeric cell key for Set/Map use. Grid cols ≤ 8, rows ≤ 15, so 64
    is plenty. */
export function key(c: CellRef): number {
  return c.row * 64 + c.col;
}

export function keyRC(row: number, col: number): number {
  return row * 64 + col;
}

export function distSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

// Neighbour offsets; SHORT rows are indented right by R.
const NEIGHBOURS_LONG: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 0],
  [1, -1],
  [1, 0],
];
const NEIGHBOURS_SHORT: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [-1, 1],
  [1, 0],
  [1, 1],
];

/** Occupied-agnostic neighbours within grid bounds. */
export function neighbours(cell: CellRef, parity: 0 | 1, cols: number): CellRef[] {
  const table = isShortRow(cell.row, parity) ? NEIGHBOURS_SHORT : NEIGHBOURS_LONG;
  const out: CellRef[] = [];
  for (const [dr, dc] of table) {
    const row = cell.row + dr;
    const col = cell.col + dc;
    if (inBounds(row, col, cols, parity)) out.push({ row, col });
  }
  return out;
}

/** World Y of the danger line: the top edge of a ball settled on the
    death row. Any settled ball at or below this line loses. */
export function dangerLineY(): number {
  return TUNING.DEATH_ROW * ROW_H;
}
