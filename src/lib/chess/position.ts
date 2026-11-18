/* Pure position helpers for Chess, built on chess.js. No I/O, no
   React — safe to use from pages, components, and the smoke script. */

import { Chess, type PieceSymbol } from "chess.js";

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Material values in pawns, for the captured/material display. */
export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const START_COUNTS: Record<PieceSymbol, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };

/** Build a Chess instance from a FEN, falling back to the start
    position when the FEN is malformed (never throw into a render). */
export function chessFromFen(fen: string): Chess {
  try {
    return new Chess(fen);
  } catch {
    return new Chess();
  }
}

/**
 * Pieces each side has captured, derived from what's missing on the
 * board. Promoted pieces skew the count slightly (a promoted pawn
 * looks like an extra queen) — the display clamps at zero, which is
 * good enough for a friendly scoreboard.
 */
export function capturedPieces(fen: string): { byWhite: PieceSymbol[]; byBlack: PieceSymbol[] } {
  const chess = chessFromFen(fen);
  const onBoard: Record<"w" | "b", Record<PieceSymbol, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell) onBoard[cell.color][cell.type] += 1;
    }
  }
  const missing = (color: "w" | "b"): PieceSymbol[] => {
    const out: PieceSymbol[] = [];
    (Object.keys(START_COUNTS) as PieceSymbol[]).forEach((type) => {
      const gone = Math.max(0, START_COUNTS[type] - onBoard[color][type]);
      for (let i = 0; i < gone; i++) out.push(type);
    });
    // Show the most valuable captures first.
    return out.sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a]);
  };
  return { byWhite: missing("b"), byBlack: missing("w") };
}

/** Material lead in pawns from White's perspective (positive = White
    ahead). */
export function materialDiff(fen: string): number {
  const { byWhite, byBlack } = capturedPieces(fen);
  const sum = (list: PieceSymbol[]): number => list.reduce((acc, t) => acc + PIECE_VALUES[t], 0);
  return sum(byWhite) - sum(byBlack);
}

export type GameOverKind = "checkmate" | "stalemate" | "insufficient" | "threefold" | "fifty";

/** Game-over state of a position, or null when the game continues.
    NOTE: threefold repetition can never be detected from a FEN
    alone — it needs the game's history. The isThreefoldRepetition
    branch below is a no-op for a freshly loaded position; callers
    that know the move list must use gameOverFromHistory() so
    threefold draws actually end the game. */
export function gameOverInfo(fen: string): { kind: GameOverKind; winner: "w" | "b" | null } | null {
  const chess = chessFromFen(fen);
  if (chess.isCheckmate()) {
    return { kind: "checkmate", winner: chess.turn() === "w" ? "b" : "w" };
  }
  if (chess.isStalemate()) return { kind: "stalemate", winner: null };
  if (chess.isInsufficientMaterial()) return { kind: "insufficient", winner: null };
  if (chess.isThreefoldRepetition()) return { kind: "threefold", winner: null };
  if (chess.isDrawByFiftyMoves()) return { kind: "fifty", winner: null };
  return null;
}

/** Position key for repetition counting: pieces + side to move +
    castling rights + en-passant square (the first four FEN fields).
    The halfmove/fullmove counters are irrelevant to repetition. */
function positionKey(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}

/**
 * True when the game described by `sans` (SAN moves from the start
 * position) has repeated any position three times. Replays the game
 * from the start, counting position keys — FEN alone cannot answer
 * this. Returns false on an unparseable move list rather than
 * claiming a draw that did not happen.
 */
export function hasThreefoldRepetition(sans: string[]): boolean {
  const chess = new Chess();
  const counts = new Map<string, number>();
  const bump = (fen: string): boolean => {
    const key = positionKey(fen);
    const n = (counts.get(key) ?? 0) + 1;
    counts.set(key, n);
    return n >= 3;
  };
  if (bump(chess.fen())) return true;
  for (const san of sans) {
    try {
      chess.move(san);
    } catch {
      return false;
    }
    if (bump(chess.fen())) return true;
  }
  return false;
}

/**
 * Game-over state with history: FEN-based endings (checkmate,
 * stalemate, insufficient material, fifty-move) plus threefold
 * repetition from the SAN move list. This is the check pages use;
 * gameOverInfo() alone would never report a threefold draw.
 */
export function gameOverFromHistory(
  fen: string,
  sans: string[],
): { kind: GameOverKind; winner: "w" | "b" | null } | null {
  return gameOverInfo(fen) ?? (hasThreefoldRepetition(sans) ? { kind: "threefold", winner: null } : null);
}

/** The square of the given colour's king, or null when absent. */
export function kingSquare(fen: string, color: "w" | "b"): string | null {
  const chess = chessFromFen(fen);
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.type === "k" && cell.color === color) return cell.square;
    }
  }
  return null;
}
