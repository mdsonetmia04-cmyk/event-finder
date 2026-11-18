export type LudoColor = "red" | "green" | "yellow" | "blue";

export const COLORS: LudoColor[] = ["red", "green", "yellow", "blue"];

export const START_OFFSETS: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const SAFE_CELLS: number[] = [0, 8, 13, 21, 26, 34, 39, 47];

/** Starting squares (one per colour) — safe under classic rules. */
export const START_CELLS: number[] = [0, 13, 26, 39];

/** Star squares — safe under classic rules. */
export const STAR_CELLS: number[] = [8, 21, 34, 47];

/**
 * Configurable rule set. Classic defaults match the behaviour the
 * game has always had; friends rooms always play classic (their
 * stored states carry no rules field, which resolves to classic).
 * Local games may customise via the pre-match settings panel; the
 * rules are locked for the whole match once it starts.
 */
export interface LudoRules {
  /** Tokens leave base only on a 6. Off: a 1 also brings a token out. */
  entryOnSix: boolean;
  /** Rolling a 6 earns another roll after the move. */
  bonusOnSix: boolean;
  /** Capturing an opponent earns another roll. */
  bonusOnCapture: boolean;
  /** Bringing a token home earns another roll. */
  bonusOnHome: boolean;
  /** A third consecutive 6 cancels the turn (the 6 can't be used). */
  threeSixes: boolean;
  /** Star squares (★) protect tokens from capture. */
  safeStars: boolean;
  /** Starting squares protect tokens from capture. */
  safeStarts: boolean;
  /** Two same-colour tokens on a square block opponents from passing
      or landing on it. */
  blockade: boolean;
}

export const CLASSIC_RULES: LudoRules = {
  entryOnSix: true,
  bonusOnSix: true,
  bonusOnCapture: true,
  bonusOnHome: true,
  threeSixes: true,
  safeStars: true,
  safeStarts: true,
  blockade: true,
};

/** Rules in force for a state — classic when the state predates the
    rules field (all friends-room states). Never mutates the input. */
export function resolveRules(state: LudoState): LudoRules {
  return state.rules ?? CLASSIC_RULES;
}

/** Track cells that protect tokens under `rules`. Home lanes are
    always safe (they are off-track) regardless of these toggles. */
export function effectiveSafeCells(rules: LudoRules): number[] {
  const cells: number[] = [];
  if (rules.safeStarts) cells.push(...START_CELLS);
  if (rules.safeStars) cells.push(...STAR_CELLS);
  return cells;
}

export const TRACK_CELLS: [number, number][] = [
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],
  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6],
  [1, 6],
  [0, 6],
  [0, 7],
  [0, 8],
  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [6, 13],
  [6, 14],
  [7, 14],
  [8, 14],
  [8, 13],
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  [14, 8],
  [14, 7],
  [14, 6],
  [13, 6],
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6],
  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2],
  [8, 1],
  [8, 0],
  [7, 0],
  [6, 0],
];

export const HOME_CELLS: Record<LudoColor, [number, number][]> = {
  red: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6],
  ],
  green: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
    [6, 7],
  ],
  yellow: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
    [7, 8],
  ],
  blue: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
    [8, 7],
  ],
};

/** Why the current player kept the turn (or lost it) — UI messaging only.
    Added in Ludo v2; older stored states simply lack the field. */
export type LudoBonus = "six" | "capture" | "home" | "forfeit";

export interface LudoPlayerState {
  color: LudoColor;
  tokens: number[];
}

export interface LudoState {
  players: LudoPlayerState[];
  turn: number;
  phase: "roll" | "move" | "finished";
  roll: number | null;
  lastRoll: number | null;
  sixes: number;
  winner: number | null;
  move_no: number;
  lastBonus?: LudoBonus | null;
  /** Rule set in force for this game. Absent = classic rules (all
      friends-room states and every state created before the rules
      field existed). Local games store their chosen rules here so
      every transition — and every save/resume — uses the same rules. */
  rules?: LudoRules;
}

export interface LudoMove {
  token: number | null;
}

function clonePlayers(players: LudoPlayerState[]): LudoPlayerState[] {
  const copy: LudoPlayerState[] = [];
  for (let i = 0; i < players.length; i++) {
    copy.push({ color: players[i].color, tokens: players[i].tokens.slice() });
  }
  return copy;
}

export function createGame(playerCount: 2 | 3 | 4, rules?: LudoRules): LudoState {
  const players: LudoPlayerState[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({ color: COLORS[i], tokens: [-1, -1, -1, -1] });
  }
  return {
    players: players,
    turn: 0,
    phase: "roll",
    roll: null,
    lastRoll: null,
    sixes: 0,
    winner: null,
    move_no: 0,
    lastBonus: null,
    ...(rules ? { rules: { ...rules } } : {}),
  };
}

export function trackIndex(color: LudoColor, progress: number): number | null {
  if (progress < 0 || progress > 50) {
    return null;
  }
  return (START_OFFSETS[color] + progress) % 52;
}

/**
 * Track cells currently blocked for `playerIndex`: any cell holding 2+
 * tokens of ONE opponent colour (a blockade). Opponents may neither land
 * on nor pass over a blockade; the owner's own tokens pass freely, and
 * home-column cells can never hold a blockade (single colour only).
 */
export function blockadeCells(state: LudoState, playerIndex: number): number[] {
  if (!resolveRules(state).blockade) {
    return [];
  }
  const blocked: number[] = [];
  for (let p = 0; p < state.players.length; p++) {
    if (p === playerIndex) {
      continue;
    }
    const opp: LudoPlayerState = state.players[p];
    const perCell: Record<number, number> = {};
    for (let t = 0; t < opp.tokens.length; t++) {
      const cell: number | null = trackIndex(opp.color, opp.tokens[t]);
      if (cell === null) {
        continue;
      }
      perCell[cell] = (perCell[cell] ?? 0) + 1;
    }
    for (const key of Object.keys(perCell)) {
      const cell = Number(key);
      if (perCell[cell] >= 2 && blocked.indexOf(cell) === -1) {
        blocked.push(cell);
      }
    }
  }
  return blocked;
}

/** Is the path from `from` (exclusive) to `dest` (inclusive) free of
    opponent blockades? Only the on-track part of the path is checked. */
function pathClear(
  color: LudoColor,
  from: number,
  dest: number,
  blocked: number[],
): boolean {
  const lastTrack = Math.min(dest, 50);
  for (let p = from + 1; p <= lastTrack; p++) {
    const cell: number | null = trackIndex(color, p);
    if (cell !== null && blocked.indexOf(cell) !== -1) {
      return false;
    }
  }
  return true;
}

export function legalMoves(state: LudoState, roll: number): number[] {
  const rules = resolveRules(state);
  if (rules.threeSixes && roll === 6 && state.sixes >= 2) {
    return [];
  }
  const player: LudoPlayerState = state.players[state.turn];
  const blocked: number[] = blockadeCells(state, state.turn);
  const moves: number[] = [];
  for (let i = 0; i < player.tokens.length; i++) {
    const progress: number = player.tokens[i];
    if (progress === -1) {
      const canExit = roll === 6 || (!rules.entryOnSix && roll === 1);
      if (canExit) {
        const destCell: number | null = trackIndex(player.color, 0);
        if (destCell === null || blocked.indexOf(destCell) === -1) {
          moves.push(i);
        }
      }
    } else if (progress >= 0 && progress <= 56) {
      const dest = progress + roll;
      if (dest > 57) {
        continue;
      }
      if (pathClear(player.color, progress, dest, blocked)) {
        moves.push(i);
      }
    }
  }
  return moves;
}

export function applyRoll(state: LudoState, roll: number): LudoState {
  if (state.phase !== "roll") {
    return state;
  }
  if (resolveRules(state).threeSixes && roll === 6 && state.sixes >= 2) {
    return {
      players: clonePlayers(state.players),
      turn: (state.turn + 1) % state.players.length,
      phase: "roll",
      roll: null,
      lastRoll: 6,
      sixes: 0,
      winner: state.winner,
      move_no: state.move_no + 1,
      lastBonus: "forfeit",
      rules: state.rules,
    };
  }
  return {
    players: clonePlayers(state.players),
    turn: state.turn,
    phase: "move",
    roll: roll,
    lastRoll: roll,
    sixes: state.sixes,
    winner: state.winner,
    move_no: state.move_no + 1,
    lastBonus: state.lastBonus ?? null,
    rules: state.rules,
  };
}

export function applyMove(state: LudoState, move: LudoMove): LudoState {
  if (state.phase !== "move" || state.roll === null) {
    return state;
  }
  const roll: number = state.roll;
  const rules = resolveRules(state);
  if (move.token === null) {
    return {
      players: clonePlayers(state.players),
      turn: (state.turn + 1) % state.players.length,
      phase: "roll",
      roll: null,
      lastRoll: state.lastRoll,
      sixes: 0,
      winner: state.winner,
      move_no: state.move_no + 1,
      lastBonus: null,
      rules: state.rules,
    };
  }
  const legal: number[] = legalMoves(state, roll);
  if (legal.indexOf(move.token) === -1) {
    return state;
  }
  const players: LudoPlayerState[] = clonePlayers(state.players);
  const current: LudoPlayerState = players[state.turn];
  const tokenIndex: number = move.token;
  const currentProgress: number = current.tokens[tokenIndex];
  let dest: number;
  if (currentProgress === -1) {
    dest = 0;
  } else {
    dest = currentProgress + roll;
  }
  current.tokens[tokenIndex] = dest;
  let captured = false;
  const safeCells = effectiveSafeCells(rules);
  const destCell: number | null = trackIndex(current.color, dest);
  if (destCell !== null && safeCells.indexOf(destCell) === -1) {
    for (let p = 0; p < players.length; p++) {
      if (p === state.turn) {
        continue;
      }
      const opp: LudoPlayerState = players[p];
      for (let t = 0; t < opp.tokens.length; t++) {
        const oppCell: number | null = trackIndex(opp.color, opp.tokens[t]);
        if (oppCell !== null && oppCell === destCell) {
          opp.tokens[t] = -1;
          captured = true;
        }
      }
    }
  }
  let allHome: boolean = true;
  for (let i = 0; i < current.tokens.length; i++) {
    if (current.tokens[i] !== 57) {
      allHome = false;
    }
  }
  if (allHome) {
    return {
      players: players,
      turn: state.turn,
      phase: "finished",
      roll: null,
      lastRoll: state.lastRoll,
      sixes: state.sixes,
      winner: state.turn,
      move_no: state.move_no + 1,
      lastBonus: null,
      rules: state.rules,
    };
  }
  /* Extra turn: rolling a 6, capturing, or bringing a token home —
     each only when its rule toggle is on. The three-six counter only
     counts consecutive sixes. The bonus label names the highest-
     priority bonus actually granted (six > capture > home). */
  const reachedHome = dest === 57;
  const keepTurn =
    (roll === 6 && rules.bonusOnSix) || (captured && rules.bonusOnCapture) || (reachedHome && rules.bonusOnHome);
  if (keepTurn) {
    let bonus: LudoBonus = "home";
    if (roll === 6 && rules.bonusOnSix) {
      bonus = "six";
    } else if (captured && rules.bonusOnCapture) {
      bonus = "capture";
    }
    return {
      players: players,
      turn: state.turn,
      phase: "roll",
      roll: null,
      lastRoll: state.lastRoll,
      sixes: roll === 6 ? state.sixes + 1 : 0,
      winner: state.winner,
      move_no: state.move_no + 1,
      lastBonus: bonus,
      rules: state.rules,
    };
  }
  return {
    players: players,
    turn: (state.turn + 1) % players.length,
    phase: "roll",
    roll: null,
    lastRoll: state.lastRoll,
    sixes: 0,
    winner: state.winner,
    move_no: state.move_no + 1,
    lastBonus: null,
    rules: state.rules,
  };
}

/**
 * Is `cell` (absolute track index) threatened — i.e. could an opponent
 * token reach it with a roll of 1..6? Bot heuristic only; ignores
 * blockades, which only makes the bot slightly more cautious.
 */
function cellThreatened(state: LudoState, playerIndex: number, cell: number): boolean {
  for (let p = 0; p < state.players.length; p++) {
    if (p === playerIndex) {
      continue;
    }
    const opp: LudoPlayerState = state.players[p];
    for (let t = 0; t < opp.tokens.length; t++) {
      const oppCell: number | null = trackIndex(opp.color, opp.tokens[t]);
      if (oppCell === null) {
        continue;
      }
      const gap = (cell - oppCell + 52) % 52;
      if (gap >= 1 && gap <= 6) {
        return true;
      }
    }
  }
  return false;
}

function ownTokensOnCell(state: LudoState, playerIndex: number, cell: number): number {
  const player: LudoPlayerState = state.players[playerIndex];
  let count = 0;
  for (let t = 0; t < player.tokens.length; t++) {
    const c: number | null = trackIndex(player.color, player.tokens[t]);
    if (c !== null && c === cell) {
      count++;
    }
  }
  return count;
}

export function botMove(state: LudoState, roll: number): number | null {
  const legal: number[] = legalMoves(state, roll);
  if (legal.length === 0) {
    return null;
  }
  const safeCells = effectiveSafeCells(resolveRules(state));
  const player: LudoPlayerState = state.players[state.turn];
  let bestToken: number | null = null;
  let bestScore: number = 0;
  let first: boolean = true;
  for (let i = 0; i < legal.length; i++) {
    const tokenIndex: number = legal[i];
    const progress: number = player.tokens[tokenIndex];
    let dest: number;
    if (progress === -1) {
      dest = 0;
    } else {
      dest = progress + roll;
    }
    let score: number = 0;
    const destCell: number | null = trackIndex(player.color, dest);
    const fromCell: number | null = trackIndex(player.color, progress);
    /* Capture. */
    if (destCell !== null && safeCells.indexOf(destCell) === -1) {
      let captures: boolean = false;
      for (let p = 0; p < state.players.length; p++) {
        if (p === state.turn) {
          continue;
        }
        const opp: LudoPlayerState = state.players[p];
        for (let t = 0; t < opp.tokens.length; t++) {
          const oppCell: number | null = trackIndex(opp.color, opp.tokens[t]);
          if (oppCell !== null && oppCell === destCell) {
            captures = true;
          }
        }
      }
      if (captures) {
        score += 100;
      }
    }
    /* Leave base. */
    if (progress === -1 && roll === 6) {
      score += 80;
    }
    /* Reach the centre. */
    if (dest === 57) {
      score += 70;
    }
    /* Enter the safety of the home column. */
    if (dest >= 51 && dest <= 56) {
      score += 25;
    }
    /* Form a blockade by stacking onto an own token. */
    if (destCell !== null && ownTokensOnCell(state, state.turn, destCell) >= 1) {
      score += 40;
    }
    /* Breaking an own blockade exposes the token left behind. */
    if (fromCell !== null && ownTokensOnCell(state, state.turn, fromCell) >= 2) {
      score -= 15;
    }
    /* Escape danger / avoid walking into danger. */
    if (fromCell !== null && safeCells.indexOf(fromCell) === -1 && cellThreatened(state, state.turn, fromCell)) {
      score += 30;
    }
    if (destCell !== null) {
      if (safeCells.indexOf(destCell) !== -1) {
        score += 12;
      } else if (cellThreatened(state, state.turn, destCell)) {
        score -= 30;
      }
    }
    /* Prefer the furthest-advanced token as a tiebreak. */
    score += dest * 0.5;
    if (first || score > bestScore) {
      bestScore = score;
      bestToken = tokenIndex;
      first = false;
    }
  }
  return bestToken;
}

export function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}
