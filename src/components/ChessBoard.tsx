"use client";

/* Shared Chess board for solo (vs Sweet AI) and friends rooms, plus
   spectators (interactive = false renders a watch-only board).

   Realistic pieces are the Cburnett SVGs bundled under
   public/chess/cburnett/ (attribution in ATTRIBUTION.txt there).
   The flat 2D pieces are hand-authored silhouettes in this file —
   simple shapes with strong outlines so every piece reads instantly
   at phone size. Board themes come from src/lib/chess/themes.ts.

   Interaction is tap-to-move: tap a piece to see its legal moves
   (dots for quiet moves, rings for captures), tap a destination to
   move. Pawn promotion opens a picker (queen/rook/bishop/knight).
   The component never validates legality itself beyond asking
   chess.js — the parent owns the game state and the move callback. */

import { useEffect, useMemo, useState } from "react";
import { Chess, type PieceSymbol, type Square } from "chess.js";
import { CHESS_THEMES, type ChessPieceStyle, type ChessThemeId } from "@/lib/chess/themes";
import { chessFromFen } from "@/lib/chess/position";

/* ---- Flat 2D piece silhouettes (45×45 viewBox) ---- */

const FLAT_BODY: Record<PieceSymbol, string> = {
  p: "M15 36 C15 28 18 21 22.5 21 C27 21 30 28 30 36 Z",
  r: "M13 11 H18 V15 H21 V11 H24 V15 H27 V11 H32 V23 C32 29 30 33 28 35.5 H17 C15 33 13 29 13 23 Z",
  n: "M13 38 V27 L15 24 L18 14 L22 8 L28 6 L30 11 L27 14 L33 18 L30 23 L27 27 L26 38 Z",
  b: "M22.5 6 C26 10 29.5 15 29.5 22 C29.5 28 27 32 28.5 35.5 H16.5 C18 32 15.5 28 15.5 22 C15.5 15 19 10 22.5 6 Z",
  q: "M11 35 L13 15 L17.5 23 L22.5 11 L27.5 23 L32 15 L34 35 Z",
  k: "M13 35 L15 17 L22.5 23 L30 17 L32 35 Z",
};

function FlatPiece({ type, color }: { type: PieceSymbol; color: "w" | "b" }) {
  const isWhite = color === "w";
  const fill = isWhite ? "#F8F5ED" : "#26292F";
  const stroke = isWhite ? "#2A2E33" : "#EDE9DC";
  const detail = isWhite ? "#2A2E33" : "#EDE9DC";
  return (
    <svg viewBox="0 0 45 45" className="h-full w-full" aria-hidden="true">
      <g fill={fill} stroke={stroke} strokeWidth={1.6} strokeLinejoin="round">
        <path d={FLAT_BODY[type]} />
        {type === "p" && <circle cx={22.5} cy={14} r={6} />}
        {type === "b" && <circle cx={22.5} cy={5.5} r={2.6} />}
        {type === "q" && (
          <>
            <circle cx={13} cy={13} r={2.2} />
            <circle cx={22.5} cy={9} r={2.2} />
            <circle cx={32} cy={13} r={2.2} />
          </>
        )}
        {type === "k" && (
          <>
            <rect x={21} y={4} width={3} height={10} rx={1} />
            <rect x={17.5} y={7} width={10} height={3} rx={1} />
          </>
        )}
        {(type === "p" || type === "r" || type === "b" || type === "q" || type === "k") && (
          <rect x={11} y={35.5} width={23} height={4} rx={2} />
        )}
      </g>
      {/* Details in the contrasting colour: knight's eye, bishop's slit. */}
      {type === "n" && <circle cx={24} cy={14} r={1.7} fill={detail} />}
      {type === "b" && <line x1={22.5} y1={14} x2={26} y2={21} stroke={detail} strokeWidth={1.8} strokeLinecap="round" />}
    </svg>
  );
}

/** One chess piece in either style. `size` is a CSS size (e.g. "88%"). */
export function PieceView({
  type,
  color,
  style,
  size = "88%",
}: {
  type: PieceSymbol;
  color: "w" | "b";
  style: ChessPieceStyle;
  size?: string;
}) {
  if (style === "realistic") {
    return (
      <img
        src={`/chess/cburnett/${color}${type}.svg`}
        alt=""
        draggable={false}
        className="pointer-events-none select-none"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className="pointer-events-none flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <FlatPiece type={type} color={color} />
    </span>
  );
}

export interface BoardMove {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
}

export interface ChessBoardProps {
  fen: string;
  orientation: "w" | "b";
  theme: ChessThemeId;
  pieceStyle: ChessPieceStyle;
  /** False for spectators and while the opponent/AI is thinking. */
  interactive: boolean;
  lastMove?: { from: string; to: string } | null;
  onMove?: (move: BoardMove) => void;
  boardLabel: string;
  promotionTitle: string;
  pieceNames: Record<PieceSymbol, string>;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const PROMOTION_PIECES: Array<"q" | "r" | "b" | "n"> = ["q", "r", "b", "n"];

export function ChessBoard({
  fen,
  orientation,
  theme,
  pieceStyle,
  interactive,
  lastMove,
  onMove,
  boardLabel,
  promotionTitle,
  pieceNames,
}: ChessBoardProps) {
  const t = CHESS_THEMES[theme];
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  const chess: Chess = useMemo(() => chessFromFen(fen), [fen]);

  // A new position (own move, opponent move, or a reset) clears any
  // in-progress selection or promotion picker.
  useEffect(() => {
    setSelected(null);
    setPendingPromotion(null);
  }, [fen]);

  const turn = chess.turn();
  const inCheck = chess.isCheck();
  const board = chess.board();
  const pieceAt = useMemo(() => {
    const map = new Map<string, { type: PieceSymbol; color: "w" | "b" }>();
    for (const row of board) {
      for (const cell of row) {
        if (cell) map.set(cell.square, { type: cell.type, color: cell.color });
      }
    }
    return map;
  }, [board]);

  const kingSq = useMemo(() => {
    for (const [sq, piece] of pieceAt) {
      if (piece.type === "k" && piece.color === turn) return sq;
    }
    return null;
  }, [pieceAt, turn]);

  const legalTargets = useMemo(() => {
    if (!selected) return new Map<string, { captured: boolean; promotion: boolean }>();
    const map = new Map<string, { captured: boolean; promotion: boolean }>();
    for (const m of chess.moves({ square: selected, verbose: true })) {
      const prev = map.get(m.to);
      map.set(m.to, {
        captured: Boolean(prev?.captured || m.captured),
        promotion: Boolean(prev?.promotion || m.promotion),
      });
    }
    return map;
  }, [chess, selected]);

  const ranks = orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === "w" ? FILES : [...FILES].reverse();

  const handleSquare = (sq: Square) => {
    if (!interactive || pendingPromotion) return;
    const target = legalTargets.get(sq);
    if (selected && target) {
      if (target.promotion) {
        setPendingPromotion({ from: selected, to: sq });
      } else {
        onMove?.({ from: selected, to: sq });
        setSelected(null);
      }
      return;
    }
    const piece = pieceAt.get(sq);
    if (piece && piece.color === turn) {
      setSelected(sq === selected ? null : sq);
    } else {
      setSelected(null);
    }
  };

  const choosePromotion = (piece: "q" | "r" | "b" | "n") => {
    if (!pendingPromotion) return;
    onMove?.({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
    setPendingPromotion(null);
    setSelected(null);
  };

  return (
    <div
      className="relative w-full rounded-2xl p-2 sm:p-2.5"
      style={{ background: t.frame, boxShadow: "0 12px 28px -14px rgba(0, 0, 0, 0.5)" }}
    >
      <div className="grid grid-cols-8 overflow-hidden rounded-lg" role="grid" aria-label={boardLabel}>
        {ranks.map((rank, rIdx) =>
          files.map((file, fIdx) => {
            const sq = `${file}${rank}` as Square;
            const isLight = (FILES.indexOf(file) + rank) % 2 === 0;
            const piece = pieceAt.get(sq);
            const isSelected = selected === sq;
            const isLastMove = lastMove !== null && lastMove !== undefined && (lastMove.from === sq || lastMove.to === sq);
            const isCheckKing = inCheck && kingSq === sq;
            const target = legalTargets.get(sq);
            const showFile = rIdx === 7;
            const showRank = fIdx === 0;
            const coordColor = isLight ? t.coordOnLight : t.coordOnDark;
            const label = piece ? `${sq}, ${pieceNames[piece.type]}` : sq;
            return (
              <button
                key={sq}
                type="button"
                role="gridcell"
                aria-label={label}
                onClick={() => handleSquare(sq)}
                className="relative aspect-square w-full outline-none"
                style={{
                  background: isLight ? t.light : t.dark,
                  cursor: interactive ? "pointer" : "default",
                }}
              >
                {isLastMove && <span className="absolute inset-0" style={{ background: t.lastMove }} aria-hidden="true" />}
                {isSelected && (
                  <span
                    className="absolute inset-0"
                    style={{ background: t.selected, boxShadow: "inset 0 0 0 3px rgba(217, 160, 68, 0.95)" }}
                    aria-hidden="true"
                  />
                )}
                {isCheckKing && (
                  <span
                    className="absolute inset-[8%] rounded-full"
                    style={{ background: `radial-gradient(circle, ${t.checkGlow} 0%, transparent 70%)` }}
                    aria-hidden="true"
                  />
                )}
                {piece && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <PieceView type={piece.type} color={piece.color} style={pieceStyle} />
                  </span>
                )}
                {target && !target.captured && (
                  <span
                    className="absolute top-1/2 left-1/2 aspect-square w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ background: isLight ? t.dotOnLight : t.dotOnDark }}
                    aria-hidden="true"
                  />
                )}
                {target && target.captured && (
                  <span
                    className="absolute inset-[4%] rounded-full"
                    style={{ border: `4px solid ${t.captureRing}` }}
                    aria-hidden="true"
                  />
                )}
                {showRank && (
                  <span
                    className="absolute top-0.5 left-1 text-[10px] leading-none font-bold"
                    style={{ color: coordColor }}
                    aria-hidden="true"
                  >
                    {rank}
                  </span>
                )}
                {showFile && (
                  <span
                    className="absolute right-1 bottom-0.5 text-[10px] leading-none font-bold"
                    style={{ color: coordColor }}
                    aria-hidden="true"
                  >
                    {file}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>

      {/* Promotion picker: queen / rook / bishop / knight. */}
      {pendingPromotion && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/55 p-4"
          onClick={() => setPendingPromotion(null)}
        >
          <div
            className="card w-full max-w-xs p-4"
            role="dialog"
            aria-label={promotionTitle}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-sm font-semibold">{promotionTitle}</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {PROMOTION_PIECES.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-label={pieceNames[p]}
                  onClick={() => choosePromotion(p)}
                  className="flex aspect-square items-center justify-center rounded-xl transition-transform hover:scale-105 active:scale-95"
                  style={{ background: "var(--surface2)" }}
                >
                  <PieceView type={p} color={turn} style={pieceStyle} size="82%" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Paired move history (1. e4 e5  2. Nf3 …), auto-scrolled to the end. */
export function ChessMoveList({ sans, emptyLabel }: { sans: string[]; emptyLabel: string }) {
  const pairs: Array<{ n: number; white: string; black: string | null }> = [];
  for (let i = 0; i < sans.length; i += 2) {
    pairs.push({ n: i / 2 + 1, white: sans[i], black: sans[i + 1] ?? null });
  }
  return (
    <div className="max-h-36 overflow-y-auto pr-1" aria-label="Move history">
      {pairs.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {emptyLabel}
        </p>
      ) : (
        <ol className="grid grid-cols-1 gap-y-1">
          {pairs.map((pair) => (
            <li key={pair.n} className="grid grid-cols-[2.2rem_1fr_1fr] gap-2 text-sm tabular-nums">
              <span style={{ color: "var(--muted)" }}>{pair.n}.</span>
              <span className="font-medium">{pair.white}</span>
              <span className="font-medium">{pair.black ?? ""}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
