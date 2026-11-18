"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Crown, Volume2, VolumeX } from "lucide-react";
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
import {
  isSoundEnabled,
  playButtonClick,
  playCapture,
  playDiceRoll,
  playDiceSettle,
  playTokenHome,
  playTokenPop,
  playTokenSelect,
  playTokenStep,
  playTurnChime,
  playWinFanfare,
  setSoundEnabled,
  unlockAudio,
} from "@/lib/ludo/sounds";
import { ADOBE_STOCK_NUDGE, NUDGE_AFTER_WINS, recordWin } from "@/lib/games/win-motivation";

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
  /** Stable identity of this game instance (e.g. room id + finish
      timestamp, or a solo game key). The session win counter counts
      each identity once, so reloads showing the same finished game
      never double-count. Omit to disable win counting. */
  winIdentity?: string;
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

/* 3D dice cube: opposite faces sum to 7 (1-6, 2-5, 3-4). */
const DICE_FACE_TRANSFORM: Record<number, string> = {
  1: "rotateY(0deg) translateZ(31px)",
  6: "rotateY(180deg) translateZ(31px)",
  3: "rotateY(90deg) translateZ(31px)",
  4: "rotateY(-90deg) translateZ(31px)",
  2: "rotateX(90deg) translateZ(31px)",
  5: "rotateX(-90deg) translateZ(31px)",
};

/* Cube rotation that brings each face to the front: [rotateX, rotateY]. */
const DICE_ORIENTATION: Record<number, [number, number]> = {
  1: [0, 0],
  2: [-90, 0],
  3: [0, -90],
  4: [0, 90],
  5: [90, 0],
  6: [0, 180],
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
  const [rest, setRest] = useState<[number, number]>(() => DICE_ORIENTATION[value] ?? [0, 0]);
  const [tumbling, setTumbling] = useState(false);
  const spinRef = useRef(0);
  const prevRollingRef = useRef(rolling);

  useEffect(() => {
    if (rolling) {
      if (!prevRollingRef.current) {
        setTumbling(true);
        playDiceRoll();
      }
    } else {
      if (prevRollingRef.current) {
        spinRef.current += 1;
        playDiceSettle();
      }
      const [rx, ry] = DICE_ORIENTATION[value] ?? [0, 0];
      const s = spinRef.current * 360;
      setRest((prev) => (prev[0] === rx + s && prev[1] === ry + s ? prev : [rx + s, ry + s]));
      setTumbling(false);
    }
    prevRollingRef.current = rolling;
  }, [rolling, value]);

  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={disabled}
      aria-label={label}
      className={`flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-2xl border-2 transition-transform ${
        disabled ? "cursor-default opacity-70" : "cursor-pointer hover:scale-105 active:scale-95"
      }`}
      style={{
        background: "var(--surface)",
        borderColor: "var(--line)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
      }}
    >
      <span className="ludo-dice-scene" aria-hidden="true">
        <span
          className={`ludo-dice-cube ${tumbling ? "ludo-dice-cube-tumble" : ""}`}
          style={{ transform: `rotateX(${rest[0]}deg) rotateY(${rest[1]}deg)` }}
        >
          {([1, 2, 3, 4, 5, 6] as const).map((face) => {
            const pips = DICE_PIPS[face];
            return (
              <span key={face} className="ludo-dice-face" style={{ transform: DICE_FACE_TRANSFORM[face] }}>
                <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-2">
                  {Array.from({ length: 9 }, (_, i) => (
                    <span key={i} className="flex items-center justify-center">
                      {pips.includes(i) && (
                        <span
                          className={face === 1 ? "block h-4 w-4 rounded-full" : "block h-[9px] w-[9px] rounded-full"}
                          style={{
                            background: "#2b2620",
                            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
                          }}
                        />
                      )}
                    </span>
                  ))}
                </span>
              </span>
            );
          })}
        </span>
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

/* Track index of the home-column mouth per colour + arrow rotation. */
const HOME_ARROWS: Record<number, { color: LudoColor; deg: number }> = {
  50: { color: "red", deg: 90 },
  11: { color: "green", deg: 180 },
  24: { color: "yellow", deg: 270 },
  37: { color: "blue", deg: 0 },
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

type ProgressGrid = number[][];

function snapshot(state: LudoState): ProgressGrid {
  return state.players.map((p) => p.tokens.slice());
}

interface GridDiff {
  p: number;
  t: number;
  from: number;
  to: number;
}

function diffGrids(oldG: ProgressGrid, newG: ProgressGrid): GridDiff[] {
  const diffs: GridDiff[] = [];
  for (let p = 0; p < newG.length; p++) {
    for (let t = 0; t < 4; t++) {
      const from = oldG[p]?.[t] ?? -1;
      const to = newG[p][t];
      if (from !== to) {
        diffs.push({ p, t, from, to });
      }
    }
  }
  return diffs;
}

const HOP_MS = 135;
const FLY_HOME_MS = 550;

function Board({
  state,
  movable,
  canMove,
  onToken,
  colorNames,
  capturedLabel,
  onAnimatingChange,
}: {
  state: LudoState;
  movable: number[];
  canMove: boolean;
  onToken: (token: number) => void;
  colorNames: Record<LudoColor, string>;
  capturedLabel: string;
  onAnimatingChange: (animating: boolean) => void;
}) {
  /* Displayed token positions — animated toward the real state. */
  const [shown, setShown] = useState<ProgressGrid>(() => snapshot(state));
  const shownRef = useRef(shown);
  const [hop, setHop] = useState<{ p: number; t: number; n: number } | null>(null);
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null);
  const [flyHome, setFlyHome] = useState<ReadonlySet<string>>(new Set());
  const timersRef = useRef<number[]>([]);
  const burstIdRef = useRef(0);
  const onAnimatingRef = useRef(onAnimatingChange);
  onAnimatingRef.current = onAnimatingChange;

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  /* Animate single-token moves step by step; snap complex diffs. */
  useEffect(() => {
    const target = snapshot(state);
    const diffs = diffGrids(shownRef.current, target);
    if (diffs.length === 0) {
      return;
    }
    const movers = diffs.filter((d) => d.to > d.from);
    const victims = diffs.filter((d) => d.to === -1 && d.from >= 0);
    const other = diffs.filter((d) => movers.indexOf(d) === -1 && victims.indexOf(d) === -1);
    if (movers.length !== 1 || other.length !== 0) {
      shownRef.current = target;
      setShown(target);
      setHop(null);
      setBurst(null);
      setFlyHome(new Set());
      onAnimatingRef.current(false);
      return;
    }
    const m = movers[0];
    const steps: number[] = [];
    for (let p = m.from + 1; p <= m.to; p++) {
      steps.push(p);
    }
    onAnimatingRef.current(true);
    let i = 0;
    const runStep = () => {
      if (i < steps.length) {
        const np = steps[i];
        const g = shownRef.current.map((row) => row.slice());
        g[m.p][m.t] = np;
        shownRef.current = g;
        setShown(g);
        setHop({ p: m.p, t: m.t, n: i });
        if (m.from === -1 && i === 0) {
          playTokenPop();
        } else {
          playTokenStep();
        }
        i++;
        timersRef.current.push(window.setTimeout(runStep, HOP_MS));
      } else {
        setHop(null);
        if (victims.length > 0) {
          const pos = tokenPosition(state.players[m.p].color, m.t, m.to);
          burstIdRef.current += 1;
          setBurst({ x: pos.x, y: pos.y, id: burstIdRef.current });
          playCapture();
          setFlyHome(new Set(victims.map((v) => `${v.p}:${v.t}`)));
          const g = shownRef.current.map((row) => row.slice());
          for (const v of victims) {
            g[v.p][v.t] = -1;
          }
          shownRef.current = g;
          setShown(g);
          timersRef.current.push(
            window.setTimeout(() => {
              setFlyHome(new Set());
              setBurst(null);
              onAnimatingRef.current(false);
            }, FLY_HOME_MS),
          );
        } else {
          if (m.to === 57) {
            playTokenHome();
          }
          onAnimatingRef.current(false);
        }
      }
    };
    runStep();
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
    // Only the authoritative state drives the animation; `shown` is a ref mirror.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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
    const row = shown[pi] ?? player.tokens;
    row.forEach((progress, ti) => {
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
    <div
      className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 select-none"
      style={{
        borderColor: "rgba(193,138,58,0.55)",
        background: "var(--surface)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
      }}
    >
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
              style={{
                gridRow: `${r0 + 1} / span 6`,
                gridColumn: `${c0 + 1} / span 6`,
                background: `linear-gradient(135deg, ${COLOR_HEX[color]}, ${COLOR_HEX[color]}DD)`,
                borderRadius: 10,
                boxShadow: "inset 0 2px 8px rgba(255,255,255,0.25), inset 0 -3px 8px rgba(0,0,0,0.18)",
              }}
            >
              <div
                className="absolute rounded-2xl bg-white/95"
                style={{ inset: "13%", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}
              />
              {[25, 75].map((top) =>
                [25, 75].map((left) => (
                  <span
                    key={`${top}-${left}`}
                    className="absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      top: `${top}%`,
                      left: `${left}%`,
                      width: "22%",
                      background: "radial-gradient(circle at 35% 30%, #ffffff, #f1e8d8)",
                      border: `2px solid ${COLOR_HEX[color]}`,
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.12)",
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
          const arrow = HOME_ARROWS[i];
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
                <span
                  className="leading-none"
                  style={{ color: "var(--gold-deep)", fontSize: "clamp(7px, 1.7vw, 13px)", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
                >
                  ★
                </span>
              )}
              {start && (
                <span
                  className="block rounded-full"
                  style={{ width: "38%", height: "38%", background: COLOR_HEX[start], boxShadow: "0 0 0 2px rgba(255,255,255,0.6)" }}
                />
              )}
              {arrow && !safe && (
                <span
                  className="leading-none"
                  style={{
                    color: COLOR_HEX[arrow.color],
                    fontSize: "clamp(7px, 1.6vw, 12px)",
                    transform: `rotate(${arrow.deg}deg)`,
                  }}
                >
                  ▲
                </span>
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
        {/* Centre home triangle: 4 clipped triangles + gold star */}
        <div className="relative" style={{ gridRow: "7 / span 3", gridColumn: "7 / span 3" }}>
          <span className="absolute inset-0" style={{ background: COLOR_HEX.green, clipPath: "polygon(0 0, 100% 0, 50% 50%)" }} />
          <span className="absolute inset-0" style={{ background: COLOR_HEX.yellow, clipPath: "polygon(100% 0, 100% 100%, 50% 50%)" }} />
          <span className="absolute inset-0" style={{ background: COLOR_HEX.blue, clipPath: "polygon(0 100%, 100% 100%, 50% 50%)" }} />
          <span className="absolute inset-0" style={{ background: COLOR_HEX.red, clipPath: "polygon(0 0, 0 100%, 50% 50%)" }} />
          <span
            className="absolute flex items-center justify-center rounded-full bg-white/95"
            style={{ inset: "34%", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }}
          >
            <span className="leading-none" style={{ color: "var(--gold-deep)", fontSize: "clamp(8px, 1.8vw, 14px)" }}>
              ★
            </span>
          </span>
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
          const isHopping = hop !== null && hop.p === p.player && hop.t === p.token;
          const isFlying = flyHome.has(`${p.player}:${p.token}`);
          const hex = COLOR_HEX[p.color];
          const visualClass = [
            "relative block h-full w-full rounded-full",
            isMovable ? "ludo-token-movable" : "",
            isHopping ? (hop !== null && hop.n % 2 === 0 ? "ludo-token-hop-a" : "ludo-token-hop-b") : "",
            isFlying ? "ludo-token-flyhome" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const visualStyle: React.CSSProperties = {
            background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.65), rgba(255,255,255,0) 46%), ${hex}`,
            border: "2px solid #fff",
            boxShadow: "0 3px 7px rgba(0,0,0,0.35), inset 0 -3px 5px rgba(0,0,0,0.22)",
          };
          const inner = (
            <>
              <span className="absolute rounded-full bg-white/95" style={{ inset: "27%" }} aria-hidden="true" />
              <span
                className="absolute rounded-full"
                style={{ inset: "42%", background: hex, boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)" }}
                aria-hidden="true"
              />
            </>
          );
          return (
            <div
              key={`${p.player}-${p.token}`}
              className="absolute"
              style={{
                left: `${(x * 100) / 15}%`,
                top: `${(y * 100) / 15}%`,
                width: `${widthPct}%`,
                aspectRatio: "1",
                transform: "translate(-50%, -50%)",
                transition: isFlying
                  ? "left 0.55s ease-in-out, top 0.55s ease-in-out"
                  : "left 0.13s ease-out, top 0.13s ease-out",
                zIndex: isHopping ? 6 : isMovable ? 5 : 2,
              }}
            >
              {isMovable ? (
                <button
                  type="button"
                  onClick={() => onToken(p.token)}
                  aria-label={`${colorNames[p.color]} ${p.token + 1}`}
                  className={`pointer-events-auto ${visualClass}`}
                  style={{ ...visualStyle, cursor: "pointer" }}
                >
                  {inner}
                </button>
              ) : (
                <div className={visualClass} style={visualStyle} aria-hidden="true">
                  {inner}
                </div>
              )}
            </div>
          );
        })}

        {/* Capture burst effect */}
        {burst && (
          <div
            key={burst.id}
            className="absolute z-10"
            style={{
              left: `${(burst.x * 100) / 15}%`,
              top: `${(burst.y * 100) / 15}%`,
              transform: "translate(-50%, -50%)",
            }}
            aria-hidden="true"
          >
            <div className="ludo-burst">
              <span className="ludo-burst-ring" />
              <span className="ludo-burst-star">✦</span>
              <span className="ludo-burst-label">{capturedLabel}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#E5484D", "#2FA36B", "#E8A90C", "#3E7BFA", "#C18A3A"];

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
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
    winIdentity,
  } = props;
  const { t } = useLang();

  /* Input locks while a token animation is playing. */
  const [animating, setAnimating] = useState(false);
  /** Adobe Stock nudge: shown from the 3rd session win onward. */
  const [showNudge, setShowNudge] = useState(false);
  const onAnimatingChange = useCallback((v: boolean) => setAnimating(v), []);
  const effCanRoll = canRoll && !animating;
  const effCanMove = canMove && !animating;

  /* Sound on/off, persisted in localStorage by the sounds module. */
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) {
        unlockAudio();
        playButtonClick();
      }
      return next;
    });
  }, []);

  const handleRoll = useCallback(() => {
    unlockAudio();
    onRoll();
  }, [onRoll]);

  const handleToken = useCallback(
    (token: number) => {
      unlockAudio();
      playTokenSelect();
      onToken(token);
    },
    [onToken],
  );

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

  /* Chime when the player's own turn begins (not on first render). */
  const prevTurnRef = useRef<{ turn: number; phase: string } | null>(null);
  useEffect(() => {
    const prev = prevTurnRef.current;
    prevTurnRef.current = { turn: state.turn, phase: state.phase };
    if (!prev || finished) return;
    if (isYourTurn && state.phase === "roll" && (prev.turn !== state.turn || prev.phase !== "roll")) {
      playTurnChime();
    }
  }, [state.turn, state.phase, isYourTurn, finished]);

  /* Fanfare when the game is won (not when loading a finished game). */
  const prevFinishedRef = useRef(finished);
  useEffect(() => {
    if (finished && !prevFinishedRef.current) {
      playWinFanfare();
    }
    prevFinishedRef.current = finished;
  }, [finished]);

  /* Session win counter for the Adobe Stock nudge. Counts only when
     the viewing player won; recordWin dedupes reloads/re-renders via
     the win identity, and a new game is a new identity. */
  const iWon = finished && state.winner !== null && metas[state.winner]?.isYou === true;
  useEffect(() => {
    if (!iWon || !winIdentity) {
      setShowNudge(false);
      return;
    }
    const { count } = recordWin("ludo", winIdentity);
    setShowNudge(count >= NUDGE_AFTER_WINS);
  }, [iWon, winIdentity]);

  const diceValue = state.lastRoll ?? state.roll ?? 6;
  const bonus = state.lastBonus;
  const legacy = bonus === undefined;
  const showSixNote =
    !finished && state.phase === "roll" && (bonus === "six" || (legacy && state.lastRoll === 6 && state.sixes > 0));
  const showCaptureNote = !finished && state.phase === "roll" && bonus === "capture";
  const showHomeNote = !finished && state.phase === "roll" && bonus === "home";
  const showForfeitNote =
    !finished &&
    state.phase === "roll" &&
    (bonus === "forfeit" || (legacy && state.lastRoll === 6 && state.sixes === 0 && state.move_no > 0));

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
              className={`card flex items-center gap-2.5 p-2.5 ${active ? "ludo-panel-active" : ""}`}
              style={
                {
                  "--panel-glow": hex,
                  ...(active ? { boxShadow: `0 0 0 2px ${hex}` } : {}),
                } as React.CSSProperties
              }
            >
              <LudoAvatar url={meta.avatar_url} name={meta.name} size={36} ringColor={active ? hex : undefined} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">{meta.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="flex shrink-0 items-center gap-[3px]" aria-hidden="true">
                    {[0, 1, 2, 3].map((d) => (
                      <span
                        key={d}
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{
                          background: d < home ? hex : "transparent",
                          border: `1.5px solid ${hex}`,
                        }}
                      />
                    ))}
                  </span>
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
            <p className="flex items-center gap-2 truncate text-sm font-semibold">
              {isYourTurn && !finished && <span className="ludo-turn-dot" aria-hidden="true" />}
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
            {showCaptureNote && (
              <p className="truncate text-xs font-semibold" style={{ color: "var(--gold-deep)" }}>
                {t.ludo.extraTurnCapture}
              </p>
            )}
            {showHomeNote && (
              <p className="truncate text-xs font-semibold" style={{ color: "var(--gold-deep)" }}>
                {t.ludo.extraTurnHome}
              </p>
            )}
            {showForfeitNote && (
              <p className="truncate text-xs" style={{ color: "var(--muted)" }}>
                {t.ludo.threeSixes}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundOn ? t.ludo.soundOff : t.ludo.soundOn}
            aria-pressed={soundOn}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-transform hover:scale-105 active:scale-95"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
          >
            {soundOn ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
          </button>
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
                  background: timerLow ? "#E5484D" : "linear-gradient(90deg, var(--gold-2), var(--gold-deep))",
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
          <Board
            state={state}
            movable={movable}
            canMove={effCanMove}
            onToken={handleToken}
            colorNames={t.ludo.colors}
            capturedLabel={t.ludo.capturedLabel}
            onAnimatingChange={onAnimatingChange}
          />
          <div className="mt-4 flex flex-col items-center gap-2">
            <div
              className={`rounded-[20px] ${effCanRoll ? "ludo-dice-ring" : ""}`}
              style={
                {
                  "--dice-ring": COLOR_HEX[turnColor],
                  boxShadow: `0 0 0 3px ${COLOR_HEX[turnColor]}`,
                } as React.CSSProperties
              }
            >
              <Dice
                value={diceValue}
                rolling={diceRolling}
                disabled={!effCanRoll}
                label={t.ludo.rollDice}
                onRoll={handleRoll}
              />
            </div>
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
          <div className="ludo-pop-in card relative z-10 w-full max-w-sm p-6 text-center">
            <span
              className="ludo-crown-bounce mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white"
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
            {metas[state.winner]?.isYou && showNudge && (
              <p
                className="mt-3 rounded-xl px-3 py-2 text-sm font-semibold"
                style={{ background: "var(--surface2)", color: "var(--gold-deep)" }}
              >
                {ADOBE_STOCK_NUDGE}
              </p>
            )}
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
