"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Crown } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import {
  HOME_CELLS,
  SAFE_CELLS,
  START_OFFSETS,
  TRACK_CELLS,
  trackIndex,
  type LudoColor,
  type LudoState,
} from "@/lib/ludo/engine";
import { COLOR_HEX, COLOR_TINT } from "@/lib/ludo/room";

export interface LudoPlayerMeta {
  name: string;
  avatar_url: string | null;
  isBot: boolean;
  isYou: boolean;
}

export interface LudoGameProps {
  state: LudoState;
  metas: LudoPlayerMeta[];
  canRoll: boolean;
  canMove: boolean;
  movable: number[];
  diceRolling: boolean;
  timerKey: string | number;
  timerSeconds: number;
  timerActive: boolean;
  onRoll: () => void;
  onToken: (token: number) => void;
  onTimeout: () => void;
  onPlayAgain: () => void;
  onExit: () => void;
  exitLabel: string;
  chat?: ReactNode;
}

/** Round avatar: the player's picture, or a gold initial-letter circle. */
export function LudoAvatar({
  url,
  name,
  size = 40,
  ringColor,
}: {
  url: string | null;
  name: string;
  size?: number;
  ringColor?: string;
}) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    ...(ringColor ? { boxShadow: `0 0 0 2px ${ringColor}` } : {}),
  };
  if (url) {
    return <img src={url} alt="" className="shrink-0 rounded-full object-cover" style={style} />;
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className="font-serif-d flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ ...style, background: "var(--gold)", fontSize: Math.round(size * 0.45) }}
    >
      {initial}
    </span>
  );
}

const DICE_PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Dice({
  value,
  rolling,
  disabled,
  label,
  onRoll,
}: {
  value: number;
  rolling: boolean;
  disabled: boolean;
  label: string;
  onRoll: () => void;
}) {
  const pips = DICE_PIPS[value] ?? DICE_PIPS[6];
  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={disabled}
      aria-label={label}
      className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border-2 transition-transform ${
        rolling ? "ludo-dice-rolling" : ""
      } ${disabled ? "cursor-default opacity-70" : "cursor-pointer hover:scale-105 active:scale-95"}`}
      style={{ background: "var(--surface)", borderColor: "var(--line)", boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}
    >
      <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-2.5" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="flex items-center justify-center">
            {pips.includes(i) && (
              <span className="block h-[11px] w-[11px] rounded-full" style={{ background: "var(--text)" }} />
            )}
          </span>
        ))}
      </span>
    </button>
  );
}

/* Board geometry: positions in cell units (0..15); left% = x * 100/15. */
const BASE_ORIGIN: Record<LudoColor, [number, number]> = {
  red: [0, 0],
  green: [0, 9],
  yellow: [9, 9],
  blue: [9, 0],
};

const FINISH_DIR: Record<LudoColor, [number, number]> = {
  red: [-1.05, 0],
  green: [0, -1.05],
  yellow: [1.05, 0],
  blue: [0, 1.05],
};

interface TokenPos {
  x: number;
  y: number;
  kind: "base" | "track" | "home" | "finished";
  key: string;
}

function tokenPosition(color: LudoColor, tokenIndex: number, progress: number): TokenPos {
  if (progress === -1) {
    const [r0, c0] = BASE_ORIGIN[color];
    const x = c0 + (tokenIndex % 2 === 0 ? 1.5 : 4.5);
    const y = r0 + (tokenIndex < 2 ? 1.5 : 4.5);
    return { x, y, kind: "base", key: `base:${color}:${tokenIndex}` };
  }
  if (progress >= 0 && progress <= 50) {
    const ti = trackIndex(color, progress);
    const [r, c] = TRACK_CELLS[ti ?? 0];
    return { x: c + 0.5, y: r + 0.5, kind: "track", key: `cell:${r},${c}` };
  }
  if (progress >= 51 && progress <= 56) {
    const [r, c] = HOME_CELLS[color][progress - 51];
    return { x: c + 0.5, y: r + 0.5, kind: "home", key: `cell:${r},${c}` };
  }
  const [dx, dy] = FINISH_DIR[color];
  const jx = (tokenIndex % 2 === 0 ? -0.3 : 0.3) * 0.6;
  const jy = (tokenIndex < 2 ? -0.3 : 0.3) * 0.6;
  return { x: 7.5 + dx + jx, y: 7.5 + dy + jy, kind: "finished", key: `fin:${color}:${tokenIndex}` };
}

function Board({
  state,
  movable,
  canMove,
  onToken,
  colorNames,
}: {
  state: LudoState;
  movable: number[];
  canMove: boolean;
  onToken: (token: number) => void;
  colorNames: Record<LudoColor, string>;
}) {
  /* Tokens, with stacking offsets when several share one cell. */
  interface PlacedToken {
    player: number;
    token: number;
    color: LudoColor;
    pos: TokenPos;
    groupIndex: number;
    groupSize: number;
  }
  const placed: PlacedToken[] = [];
  const groups = new Map<string, number>();
  state.players.forEach((player, pi) => {
    player.tokens.forEach((progress, ti) => {
      const pos = tokenPosition(player.color, ti, progress);
      const groupIndex = groups.get(pos.key) ?? 0;
      groups.set(pos.key, groupIndex + 1);
      placed.push({ player: pi, token: ti, color: player.color, pos, groupIndex, groupSize: 0 });
    });
  });
  placed.forEach((p) => {
    p.groupSize = p.pos.kind === "track" || p.pos.kind === "home" ? (groups.get(p.pos.key) ?? 1) : 1;
  });

  const startColorOf = (i: number): LudoColor | null => {
    const entry = (Object.entries(START_OFFSETS) as [LudoColor, number][]).find(([, off]) => off === i);
    return entry ? entry[0] : null;
  };

  return (
    <div className="relative aspect-square w-full select-none overflow-hidden rounded-2xl border" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
      {/* Static cells: 15x15 grid */}
      <div
        className="absolute inset-0 grid"
        style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))", gridTemplateRows: "repeat(15, minmax(0, 1fr))" }}
        aria-hidden="true"
      >
        {/* Base blocks */}
        {(Object.keys(BASE_ORIGIN) as LudoColor[]).map((color) => {
          const [r0, c0] = BASE_ORIGIN[color];
          return (
            <div
              key={`base-${color}`}
              className="relative"
              style={{ gridRow: `${r0 + 1} / span 6`, gridColumn: `${c0 + 1} / span 6`, background: COLOR_HEX[color] }}
            >
              <div className="absolute rounded-xl bg-white/95" style={{ inset: "13%" }} />
              {[25, 75].map((top) =>
                [25, 75].map((left) => (
                  <span
                    key={`${top}-${left}`}
                    className="absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      top: `${top}%`,
                      left: `${left}%`,
                      width: "22%",
                      background: "rgba(255,255,255,0.9)",
                      border: `2px solid ${COLOR_HEX[color]}`,
                    }}
                  />
                )),
              )}
            </div>
          );
        })}
        {/* Track cells */}
        {TRACK_CELLS.map(([r, c], i) => {
          const start = startColorOf(i);
          const safe = SAFE_CELLS.includes(i);
          return (
            <div
              key={`track-${i}`}
              className="relative flex items-center justify-center border"
              style={{
                gridRow: r + 1,
                gridColumn: c + 1,
                borderColor: "var(--line)",
                background: start ? COLOR_TINT[start] : "var(--surface)",
              }}
            >
              {safe && !start && (
                <span className="leading-none" style={{ color: "var(--muted)", fontSize: "clamp(7px, 1.6vw, 12px)" }}>
                  ★
                </span>
              )}
              {start && (
                <span className="block rounded-full" style={{ width: "38%", height: "38%", background: COLOR_HEX[start] }} />
              )}
            </div>
          );
        })}
        {/* Home columns */}
        {(Object.keys(HOME_CELLS) as LudoColor[]).map((color) =>
          HOME_CELLS[color].map(([r, c], i) => (
            <div
              key={`home-${color}-${i}`}
              className="border"
              style={{ gridRow: r + 1, gridColumn: c + 1, borderColor: "var(--line)", background: COLOR_TINT[color] }}
            />
          )),
        )}
        {/* Centre home triangle: 4 clipped triangles */}
        <div className="relative" style={{ gridRow: "7 / span 3", gridColumn: "7 / span 3" }}>
          <span className="absolute inset-0" style={{ background: COLOR_HEX.green, clipPath: "polygon(0 0, 100% 0, 50% 50%)" }} />
          <span className="absolute inset-0" style={{ background: COLOR_HEX.yellow, clipPath: "polygon(100% 0, 100% 100%, 50% 50%)" }} />
          <span className="absolute inset-0" style={{ background: COLOR_HEX.blue, clipPath: "polygon(0 100%, 100% 100%, 50% 50%)" }} />
          <span className="absolute inset-0" style={{ background: COLOR_HEX.red, clipPath: "polygon(0 0, 0 100%, 50% 50%)" }} />
        </div>
      </div>

      {/* Tokens overlay */}
      <div className="pointer-events-none absolute inset-0">
        {placed.map((p) => {
          let x = p.pos.x;
          let y = p.pos.y;
          let widthPct = p.pos.kind === "base" ? 6.2 : p.pos.kind === "finished" ? 3.8 : 5.4;
          if (p.groupSize > 1) {
            const cols = p.groupSize <= 4 ? 2 : 3;
            const rows = Math.ceil(p.groupSize / cols);
            const gx = p.groupIndex % cols;
            const gy = Math.floor(p.groupIndex / cols);
            x += (gx - (cols - 1) / 2) * 0.46;
            y += (gy - (rows - 1) / 2) * 0.46;
            widthPct = 4.3;
          }
          const isMovable = canMove && p.player === state.turn && movable.includes(p.token);
          const hex = COLOR_HEX[p.color];
          const commonStyle: React.CSSProperties = {
            left: `${(x * 100) / 15}%`,
            top: `${(y * 100) / 15}%`,
            width: `${widthPct}%`,
            background: hex,
            border: "2px solid #fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          };
          const inner = (
            <>
              <span className="absolute rounded-full bg-white/95" style={{ inset: "26%" }} aria-hidden="true" />
              <span className="absolute rounded-full" style={{ inset: "41%", background: hex }} aria-hidden="true" />
            </>
          );
          if (isMovable) {
            return (
              <button
                key={`${p.player}-${p.token}`}
                type="button"
                onClick={() => onToken(p.token)}
                aria-label={`${colorNames[p.color]} ${p.token + 1}`}
                className="ludo-token-movable pointer-events-auto absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={commonStyle}
              >
                {inner}
              </button>
            );
          }
          return (
            <div
              key={`${p.player}-${p.token}`}
              className="absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={commonStyle}
              aria-hidden="true"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#E5484D", "#2FA36B", "#E8A90C", "#3E7BFA", "#C18A3A"];

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="ludo-confetti-piece absolute top-0"
          style={{
            left: `${(i * 37 + 11) % 100}%`,
            width: 8,
            height: 14,
            borderRadius: 2,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDuration: `${2.8 + (i % 5) * 0.6}s`,
            animationDelay: `${(i % 7) * 0.35}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function LudoGame(props: LudoGameProps) {
  const {
    state,
    metas,
    canRoll,
    canMove,
    movable,
    diceRolling,
    timerKey,
    timerSeconds,
    timerActive,
    onRoll,
    onToken,
    onTimeout,
    onPlayAgain,
    onExit,
    exitLabel,
    chat,
  } = props;
  const { t } = useLang();

  /* 30s turn countdown: resets when timerKey changes, fires onTimeout once. */
  const [remaining, setRemaining] = useState(timerSeconds);
  const firedKeyRef = useRef<string | number | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;
  useEffect(() => {
    setRemaining(timerSeconds);
  }, [timerKey, timerSeconds]);
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [timerKey, timerActive, timerSeconds]);
  useEffect(() => {
    if (timerActive && remaining <= 0 && firedKeyRef.current !== timerKey) {
      firedKeyRef.current = timerKey;
      onTimeoutRef.current();
    }
  }, [remaining, timerActive, timerKey]);

  const finished = state.phase === "finished";
  const turnMeta = metas[state.turn];
  const turnColor = state.players[state.turn]?.color ?? "red";
  const isYourTurn = turnMeta?.isYou === true;
  const diceValue = state.lastRoll ?? state.roll ?? 6;
  const showSixNote = !finished && state.phase === "roll" && state.lastRoll === 6 && state.sixes > 0;
  const showForfeitNote = !finished && state.phase === "roll" && state.lastRoll === 6 && state.sixes === 0 && state.move_no > 0;

  let statusText: string;
  if (finished) {
    statusText = t.ludo.winnerTitle;
  } else if (state.phase === "roll") {
    statusText = isYourTurn ? t.ludo.tapDice : t.ludo.waitingFor(turnMeta?.name ?? "");
  } else if (isYourTurn) {
    statusText = movable.length > 0 ? t.ludo.tapToken : t.ludo.noMoves;
  } else {
    statusText = t.ludo.waitingFor(turnMeta?.name ?? "");
  }

  const timerPct = Math.max(0, Math.min(100, (remaining / timerSeconds) * 100));
  const timerLow = remaining <= 10;

  return (
    <div className="relative">
      {/* Player panels */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metas.map((meta, i) => {
          const player = state.players[i];
          const home = player ? player.tokens.filter((p) => p === 57).length : 0;
          const active = !finished && i === state.turn;
          const hex = player ? COLOR_HEX[player.color] : "var(--line)";
          return (
            <div
              key={i}
              className="card flex items-center gap-2.5 p-2.5"
              style={active ? { boxShadow: `0 0 0 2px ${hex}` } : undefined}
            >
              <LudoAvatar url={meta.avatar_url} name={meta.name} size={36} ringColor={active ? hex : undefined} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">{meta.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: hex }} aria-hidden="true" />
                  {t.ludo.tokensHome(home)}
                </p>
              </div>
              {(meta.isYou || meta.isBot) && (
                <span className="chip shrink-0">{meta.isYou ? t.ludo.you : t.ludo.computer}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Turn indicator + timer */}
      <div className="card mt-3 p-3">
        <div className="flex items-center gap-3">
          {turnMeta && (
            <LudoAvatar url={turnMeta.avatar_url} name={turnMeta.name} size={40} ringColor={COLOR_HEX[turnColor]} />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {finished
                ? t.ludo.winnerTitle
                : isYourTurn
                  ? t.ludo.yourTurn
                  : t.ludo.turnOf(turnMeta?.name ?? "")}
            </p>
            <p className="truncate text-xs" style={{ color: "var(--muted)" }}>
              {statusText}
            </p>
            {showSixNote && (
              <p className="truncate text-xs font-semibold" style={{ color: "var(--gold-deep)" }}>
                {t.ludo.rolledSix}
              </p>
            )}
            {showForfeitNote && (
              <p className="truncate text-xs" style={{ color: "var(--muted)" }}>
                {t.ludo.threeSixes}
              </p>
            )}
          </div>
          {timerActive && !finished && (
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums"
              style={{
                background: timerLow ? "rgba(229,72,77,0.15)" : "var(--surface2)",
                color: timerLow ? "#E5484D" : "var(--text)",
              }}
              aria-label={String(remaining)}
            >
              {remaining}
            </span>
          )}
        </div>
        {timerActive && !finished && (
          <>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface2)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${timerPct}%`,
                  background: timerLow ? "#E5484D" : "var(--gold)",
                  transition: "width 1s linear",
                }}
              />
            </div>
            <p className="mt-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
              {t.ludo.timerNote}
            </p>
          </>
        )}
      </div>

      {/* Board + chat */}
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="mx-auto w-full max-w-[560px] flex-1">
          <Board state={state} movable={movable} canMove={canMove} onToken={onToken} colorNames={t.ludo.colors} />
          <div className="mt-4 flex flex-col items-center gap-2">
            <Dice value={diceValue} rolling={diceRolling} disabled={!canRoll} label={t.ludo.rollDice} onRoll={onRoll} />
            <p className="text-sm font-semibold">{t.ludo.rollDice}</p>
            <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
              {t.ludo.firstWinnerNote} {t.ludo.rollSixToStart}
            </p>
          </div>
        </div>
        {chat && <div className="w-full lg:w-[340px] lg:shrink-0">{chat}</div>}
      </div>

      {/* Win overlay */}
      {finished && state.winner !== null && (
        <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-2xl bg-black/55 p-4">
          <Confetti />
          <div className="card relative z-10 w-full max-w-sm p-6 text-center">
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white"
              style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-deep))" }}
            >
              <Crown size={28} />
            </span>
            <h2 className="font-serif-d mt-3 text-2xl font-semibold">{t.ludo.winnerTitle}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {metas[state.winner]?.isYou
                ? t.ludo.youWon
                : t.ludo.winnerWon(metas[state.winner]?.name ?? "")}
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button type="button" className="btn btn-gold" onClick={onPlayAgain}>
                {t.ludo.playAgain}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onExit}>
                {exitLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
