/* Local-game controller: a pure state machine over the Ludo engine
   for solo and same-device pass-and-play games. Friends rooms do NOT
   use this — they keep their realtime sync path.

   The machine enforces the turn flow: identify player → enable dice
   → fair 1-6 roll → legal moves → select → animate → capture / home
   / bonus → winner check → bonus roll or next player. Every action
   is guarded: double rolls, moves while rolling or animating, moves
   in the roll phase, passes while legal moves exist, and actions on
   a finished game are all rejected (the state is returned unchanged).

   Animation timing lives in the UI (timeouts matching the board's
   hop/fly durations); it never changes the rules — the engine
   transition is committed immediately, the animation only delays
   the next input. */

import {
  applyMove,
  applyRoll,
  createGame,
  legalMoves,
  type LudoBonus,
  type LudoState,
} from "./engine";
import { chooseAiMove as pickAiMove } from "./ai";
import { type SavedLocalGame, type LocalPlayerStats, emptyPlayerStats } from "./save";
import type { LudoLocalSettings } from "./settings";

export type LocalEvent =
  | { kind: "started" }
  | { kind: "restored" }
  | { kind: "rolled"; seat: number; value: number }
  | { kind: "forfeit"; seat: number }
  | { kind: "noMoves"; seat: number }
  | { kind: "moved"; seat: number; token: number; captured: boolean; reachedHome: boolean; bonus: LudoBonus | null; winner: number | null }
  | { kind: "passed"; seat: number };

export interface LocalControllerState {
  game: LudoState;
  /** A roll has been started (dice tumbling) but not yet settled. */
  rolling: boolean;
  /** A token move animation is playing; input is blocked. */
  animating: boolean;
  /** The die value waiting to be settled by settleRoll. */
  pendingRoll: number | null;
  /** Human seats: 1 = vs Sweet AI (4 seats, seats 1-3 are AI),
      2-4 = pass-and-play (all seats human). */
  humans: 1 | 2 | 3 | 4;
  settings: LudoLocalSettings;
  stats: LocalPlayerStats[];
  startedAt: number;
  gameKey: number;
  lastEvent: LocalEvent | null;
}

export type LocalAction =
  | { type: "beginRoll"; value: number }
  | { type: "settleRoll" }
  | { type: "move"; token: number }
  | { type: "animationDone" }
  | { type: "pass" }
  | { type: "newGame"; humans: 1 | 2 | 3 | 4; settings: LudoLocalSettings; gameKey: number; startedAt: number }
  | { type: "restore"; saved: SavedLocalGame };

export function createLocalController(
  humans: 1 | 2 | 3 | 4,
  settings: LudoLocalSettings,
  gameKey: number,
  startedAt: number,
): LocalControllerState {
  const playerCount = humans === 1 ? 4 : humans;
  const game = createGame(playerCount as 2 | 3 | 4, settings.rules);
  return {
    game,
    rolling: false,
    animating: false,
    pendingRoll: null,
    humans,
    settings,
    stats: Array.from({ length: playerCount }, () => emptyPlayerStats()),
    startedAt,
    gameKey,
    lastEvent: { kind: "started" },
  };
}

export function restoreLocalController(saved: SavedLocalGame): LocalControllerState {
  return {
    game: saved.game,
    rolling: false,
    animating: false,
    pendingRoll: null,
    humans: saved.humans,
    settings: saved.settings,
    stats: saved.stats,
    startedAt: saved.startedAt,
    gameKey: saved.gameKey,
    lastEvent: { kind: "restored" },
  };
}

/** True when the seat is played by Sweet AI (1P mode, seats 1-3). */
export function isAiSeat(controller: LocalControllerState, seat: number): boolean {
  return controller.humans === 1 && seat > 0;
}

export function tokensHome(game: LudoState, seat: number): number {
  return game.players[seat].tokens.filter((t) => t === 57).length;
}

export function tokensInBase(game: LudoState, seat: number): number {
  return game.players[seat].tokens.filter((t) => t === -1).length;
}

function bumpStats(
  stats: LocalPlayerStats[],
  seat: number,
  patch: Partial<LocalPlayerStats>,
): LocalPlayerStats[] {
  return stats.map((s, i) => (i === seat ? { ...s, ...patch } : s));
}

export function localReducer(
  controller: LocalControllerState,
  action: LocalAction,
): LocalControllerState {
  const game = controller.game;
  switch (action.type) {
    case "newGame":
      return createLocalController(action.humans, action.settings, action.gameKey, action.startedAt);
    case "restore":
      return restoreLocalController(action.saved);
    case "beginRoll": {
      if (game.phase !== "roll" || controller.rolling || controller.animating) return controller;
      if (!Number.isInteger(action.value) || action.value < 1 || action.value > 6) return controller;
      return { ...controller, rolling: true, pendingRoll: action.value };
    }
    case "settleRoll": {
      if (!controller.rolling || controller.pendingRoll === null) return controller;
      if (game.phase !== "roll") return controller;
      const value = controller.pendingRoll;
      const seat = game.turn;
      const next = applyRoll(game, value);
      const stats = value === 6 ? bumpStats(controller.stats, seat, { sixes: controller.stats[seat].sixes + 1 }) : controller.stats;
      const forfeited = next.turn !== seat && next.phase === "roll" && next.lastBonus === "forfeit";
      let event: LocalEvent;
      if (forfeited) {
        event = { kind: "forfeit", seat };
      } else if (next.phase === "move" && legalMoves(next, value).length === 0) {
        event = { kind: "noMoves", seat };
      } else {
        event = { kind: "rolled", seat, value };
      }
      return { ...controller, game: next, rolling: false, pendingRoll: null, stats, lastEvent: event };
    }
    case "move": {
      if (game.phase !== "move" || controller.rolling || controller.animating) return controller;
      if (game.roll === null) return controller;
      const legal = legalMoves(game, game.roll);
      if (legal.indexOf(action.token) === -1) return controller;
      const seat = game.turn;
      const before = game.players.map((p) => [...p.tokens]);
      const next = applyMove(game, { token: action.token });
      if (next === game) return controller;
      const captured = next.players.some(
        (p, pi) => pi !== seat && p.tokens.some((t, ti) => t === -1 && before[pi][ti] !== -1),
      );
      const reachedHome = next.players[seat].tokens[action.token] === 57;
      const stats = bumpStats(controller.stats, seat, {
        moves: controller.stats[seat].moves + 1,
        captures: controller.stats[seat].captures + (captured ? 1 : 0),
      });
      return {
        ...controller,
        game: next,
        animating: true,
        stats,
        lastEvent: {
          kind: "moved",
          seat,
          token: action.token,
          captured,
          reachedHome,
          bonus: next.lastBonus ?? null,
          winner: next.winner,
        },
      };
    }
    case "animationDone": {
      if (!controller.animating) return controller;
      return { ...controller, animating: false };
    }
    case "pass": {
      if (game.phase !== "move" || controller.rolling || controller.animating) return controller;
      if (game.roll === null) return controller;
      if (legalMoves(game, game.roll).length > 0) return controller;
      const seat = game.turn;
      const next = applyMove(game, { token: null });
      if (next === game) return controller;
      return { ...controller, game: next, lastEvent: { kind: "passed", seat } };
    }
    default:
      return controller;
  }
}

/**
 * Automatic play for one turn segment: bot turns, the 30s-timeout
 * fallback, and auto-pass. Returns the actions to dispatch in order
 * (the UI spaces them out with the animation timings). Pure: the die
 * value comes from `dieFn`, the move from the configured AI
 * difficulty. Never returns actions for a finished, rolling, or
 * animating game.
 */
export function autoPlayTurn(
  controller: LocalControllerState,
  dieFn: () => number,
): LocalAction[] {
  const game = controller.game;
  if (game.phase === "finished" || controller.rolling || controller.animating) return [];
  if (game.phase === "roll") {
    const value = dieFn();
    if (!Number.isInteger(value) || value < 1 || value > 6) return [];
    const actions: LocalAction[] = [{ type: "beginRoll", value }, { type: "settleRoll" }];
    const settled = applyRoll(game, value);
    if (settled.phase !== "move" || settled.roll === null) return actions;
    const token = pickAiMove(settled, settled.roll, controller.settings.aiDifficulty);
    actions.push(token === null ? { type: "pass" } : { type: "move", token });
    return actions;
  }
  /* phase === "move" */
  if (game.roll === null) return [];
  const token = pickAiMove(game, game.roll, controller.settings.aiDifficulty);
  return [token === null ? { type: "pass" } : { type: "move", token }];
}
