/* Arrows Out — pure puzzle logic. No React imports, no I/O: the same
   functions drive the game page, the hint button, and the offline
   solvability check (scripts/check-arrows-levels.mjs), so a hint can
   never disagree with the game.

   Rules: the board is a square grid. Each cell is empty or holds one
   arrow pointing up / down / left / right. Tapping an arrow removes
   it only when every cell in the straight lane from the arrow to the
   board edge (in its pointing direction) is empty. Removing arrows
   only ever opens lanes, so the greedy solver below is complete: if
   ANY removal order clears the board, repeatedly removing any arrow
   with a clear lane clears it too. */

export type Direction = "up" | "down" | "left" | "right";

export type Cell = Direction | null;

export type Board = Cell[][];

export interface BoardPos {
  row: number;
  col: number;
}

export const DIRECTION_DELTAS: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

const GLYPH_TO_DIRECTION: Record<string, Direction> = {
  "^": "up",
  v: "down",
  "<": "left",
  ">": "right",
};

/** Parse readable string grids (`^` `v` `<` `>` arrows, `.` empty, one
    string per row) into a board. Throws on ragged rows or bad glyphs. */
export function parseGrid(rows: string[]): Board {
  const size = rows.length;
  if (size === 0) throw new Error("Arrows Out grid has no rows");
  return rows.map((line, r) => {
    if (line.length !== size) {
      throw new Error(`Arrows Out grid row ${r} has length ${line.length}, expected ${size}`);
    }
    return line.split("").map((ch, c) => {
      if (ch === ".") return null;
      const dir = GLYPH_TO_DIRECTION[ch];
      if (!dir) throw new Error(`Arrows Out grid has bad glyph "${ch}" at row ${r}, col ${c}`);
      return dir;
    });
  });
}

/** Serialize a board back to string grids (round-trip / debugging). */
export function boardToGrid(board: Board): string[] {
  const glyph: Record<string, string> = { up: "^", down: "v", left: "<", right: ">" };
  return board.map((row) => row.map((cell) => (cell === null ? "." : glyph[cell])).join(""));
}

export function boardSize(board: Board): number {
  return board.length;
}

export function countArrows(board: Board): number {
  let n = 0;
  for (const row of board) for (const cell of row) if (cell !== null) n++;
  return n;
}

/** True when the arrow at (row, col) has an empty straight lane to the
    board edge in its pointing direction. Empty cells are never clear. */
export function laneIsClear(board: Board, row: number, col: number): boolean {
  const size = board.length;
  const dir = board[row]?.[col];
  if (!dir) return false;
  const { dr, dc } = DIRECTION_DELTAS[dir];
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < size && c >= 0 && c < size) {
    if (board[r][c] !== null) return false;
    r += dr;
    c += dc;
  }
  return true;
}

/** Every arrow on the board that could leave right now, row-major. */
export function clearableArrows(board: Board): BoardPos[] {
  const out: BoardPos[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] !== null && laneIsClear(board, r, c)) out.push({ row: r, col: c });
    }
  }
  return out;
}

/** One arrow that can leave right now (row-major first), or null. The
    hint button uses this — the same logic as the game itself. */
export function findClearableArrow(board: Board): BoardPos | null {
  const found = clearableArrows(board);
  return found.length > 0 ? found[0] : null;
}

/** True when the board can be fully cleared. Greedy removal is
    complete here: removing an arrow only opens lanes, so if any order
    works, removing clearable arrows in any order works too. */
export function isSolvable(board: Board): boolean {
  const work: Board = board.map((row) => [...row]);
  let remaining = countArrows(work);
  while (remaining > 0) {
    const next = findClearableArrow(work);
    if (!next) return false;
    work[next.row][next.col] = null;
    remaining--;
  }
  return true;
}
