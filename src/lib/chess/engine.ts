/* Sweet AI for Chess: negamax search with alpha-beta pruning,
   material + piece-square evaluation, and capture-first move
   ordering. Every move it returns comes from chess.js's own legal
   move list, so AI moves are always legal.

   Difficulties (owner's order — three levels):
   - easy:   depth 1, and often (35%) a purely random legal move.
   - medium: depth 2, random pick among near-best moves.
   - hard:   iterative deepening to depth 3 with a ~1.5s thinking cap.
   The search runs synchronously on the main thread; depth 3 with
   ordering stays well under the cap on ordinary phones, and the cap
   guarantees the UI never blocks longer than ~1.5s. */

import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";

export type ChessDifficulty = "easy" | "medium" | "hard";

export interface AiMove {
  from: Square;
  to: Square;
  /** Promotion piece — only q/r/b/n ever occur in a legal move. */
  promotion?: "q" | "r" | "b" | "n";
}

const MATE_SCORE = 100000;
const HARD_TIME_MS = 1500;
const NODE_CHECK_INTERVAL = 2048;

/** Material values in centipawns. */
const VALUES: Record<PieceSymbol, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

/* Piece-square tables, written rank 8 → rank 1 from White's point of
   view. Black mirrors them vertically. Values are small nudges next
   to material: they teach the AI to develop, centralise, and push
   passed pawns without ever outweighing a piece. */
const PST: Record<Exclude<PieceSymbol, "k">, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15,
    20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10,
    5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10,
    -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0,
    0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0,
    -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10,
    -10, -20,
  ],
};

/** Static evaluation from White's perspective, in centipawns. */
function evaluate(chess: Chess): number {
  let score = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      const idx = r * 8 + c;
      const mirror = (7 - r) * 8 + c;
      if (cell.color === "w") {
        score += VALUES[cell.type] + (cell.type === "k" ? 0 : PST[cell.type][idx]);
      } else {
        score -= VALUES[cell.type] + (cell.type === "k" ? 0 : PST[cell.type][mirror]);
      }
    }
  }
  return score;
}

/** Score from the side-to-move's perspective. */
function relativeEval(chess: Chess): number {
  const score = evaluate(chess);
  return chess.turn() === "w" ? score : -score;
}

/** MVV-LVA-ish ordering: captures (most valuable victim first) and
    promotions before quiet moves. Ordering is what makes depth 3
    fast enough for a phone. */
function orderMoves(moves: Move[]): Move[] {
  const scored = moves.map((m) => {
    let s = 0;
    if (m.captured) s += 10 * VALUES[m.captured] - VALUES[m.piece];
    if (m.promotion) s += VALUES[m.promotion];
    return { m, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.map((x) => x.m);
}

class SearchTimeout extends Error {}

interface SearchState {
  deadline: number;
  nodes: number;
}

function negamax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  state: SearchState,
): number {
  state.nodes += 1;
  if ((state.nodes & (NODE_CHECK_INTERVAL - 1)) === 0 && Date.now() > state.deadline) {
    throw new SearchTimeout();
  }
  if (chess.isCheckmate()) return -MATE_SCORE + ply;
  if (chess.isStalemate() || chess.isDraw()) return 0;
  if (depth === 0) return relativeEval(chess);

  let best = -Infinity;
  for (const move of orderMoves(chess.moves({ verbose: true }))) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    const score = -negamax(chess, depth - 1, -beta, -alpha, ply + 1, state);
    chess.undo();
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function toAiMove(move: Move): AiMove {
  // chess.js only ever reports q/r/b/n promotions; the guard keeps
  // the type honest (a promotion to k/p is impossible).
  if (
    move.promotion === "q" ||
    move.promotion === "r" ||
    move.promotion === "b" ||
    move.promotion === "n"
  ) {
    return { from: move.from, to: move.to, promotion: move.promotion };
  }
  return { from: move.from, to: move.to };
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Score every legal move at a fixed depth; returns [move, score]
    pairs from the side-to-move's perspective. */
function scoreRootMoves(chess: Chess, depth: number, deadline: number): Array<{ move: Move; score: number }> {
  const state: SearchState = { deadline, nodes: 0 };
  const scored: Array<{ move: Move; score: number }> = [];
  for (const move of orderMoves(chess.moves({ verbose: true }))) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    const score = -negamax(chess, depth - 1, -Infinity, Infinity, 1, state);
    chess.undo();
    scored.push({ move, score });
  }
  return scored;
}

/**
 * Choose Sweet AI's move from a FEN. Returns null when the position
 * has no legal moves (game over) or the FEN is invalid.
 */
export function chooseAiMove(fen: string, difficulty: ChessDifficulty): AiMove | null {
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return null;
  }
  const legal = chess.moves({ verbose: true });
  if (legal.length === 0) return null;

  if (difficulty === "easy") {
    // Often plays a random move; otherwise a shallow best move with
    // a random pick among near-best moves, so it stays beatable.
    if (Math.random() < 0.35) return toAiMove(pickRandom(legal));
    const scored = scoreRootMoves(chess, 1, Date.now() + HARD_TIME_MS);
    const best = Math.max(...scored.map((s) => s.score));
    const near = scored.filter((s) => s.score >= best - 15);
    return toAiMove(pickRandom(near).move);
  }

  if (difficulty === "medium") {
    const scored = scoreRootMoves(chess, 2, Date.now() + HARD_TIME_MS);
    const best = Math.max(...scored.map((s) => s.score));
    const near = scored.filter((s) => s.score >= best - 10);
    return toAiMove(pickRandom(near).move);
  }

  // Hard: iterative deepening to depth 3. A timeout mid-iteration
  // keeps the best move from the last completed depth.
  const deadline = Date.now() + HARD_TIME_MS;
  let bestMove: Move | null = null;
  for (let depth = 1; depth <= 3; depth++) {
    try {
      const scored = scoreRootMoves(chess, depth, deadline);
      let best = -Infinity;
      for (const s of scored) {
        if (s.score > best) {
          best = s.score;
          bestMove = s.move;
        }
      }
    } catch (err) {
      if (err instanceof SearchTimeout) break;
      throw err;
    }
    if (Date.now() > deadline) break;
  }
  if (bestMove) return toAiMove(bestMove);
  return toAiMove(pickRandom(legal));
}
