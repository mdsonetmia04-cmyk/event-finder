export type LudoColor = "red" | "green" | "yellow" | "blue";

export const COLORS: LudoColor[] = ["red", "green", "yellow", "blue"];

export const START_OFFSETS: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const SAFE_CELLS: number[] = [0, 8, 13, 21, 26, 34, 39, 47];

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

export function createGame(playerCount: 2 | 3 | 4): LudoState {
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
  };
}

export function trackIndex(color: LudoColor, progress: number): number | null {
  if (progress < 0 || progress > 50) {
    return null;
  }
  return (START_OFFSETS[color] + progress) % 52;
}

export function legalMoves(state: LudoState, roll: number): number[] {
  if (roll === 6 && state.sixes >= 2) {
    return [];
  }
  const player: LudoPlayerState = state.players[state.turn];
  const moves: number[] = [];
  for (let i = 0; i < player.tokens.length; i++) {
    const progress: number = player.tokens[i];
    if (progress === -1) {
      if (roll === 6) {
        moves.push(i);
      }
    } else if (progress >= 0 && progress <= 56) {
      if (progress + roll <= 57) {
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
  if (roll === 6 && state.sixes >= 2) {
    return {
      players: clonePlayers(state.players),
      turn: (state.turn + 1) % state.players.length,
      phase: "roll",
      roll: null,
      lastRoll: 6,
      sixes: 0,
      winner: state.winner,
      move_no: state.move_no + 1,
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
  };
}

export function applyMove(state: LudoState, move: LudoMove): LudoState {
  if (state.phase !== "move" || state.roll === null) {
    return state;
  }
  const roll: number = state.roll;
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
  const destCell: number | null = trackIndex(current.color, dest);
  if (destCell !== null && SAFE_CELLS.indexOf(destCell) === -1) {
    for (let p = 0; p < players.length; p++) {
      if (p === state.turn) {
        continue;
      }
      const opp: LudoPlayerState = players[p];
      for (let t = 0; t < opp.tokens.length; t++) {
        const oppCell: number | null = trackIndex(opp.color, opp.tokens[t]);
        if (oppCell !== null && oppCell === destCell) {
          opp.tokens[t] = -1;
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
    };
  }
  if (roll === 6) {
    return {
      players: players,
      turn: state.turn,
      phase: "roll",
      roll: null,
      lastRoll: state.lastRoll,
      sixes: state.sixes + 1,
      winner: state.winner,
      move_no: state.move_no + 1,
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
  };
}

export function botMove(state: LudoState, roll: number): number | null {
  const legal: number[] = legalMoves(state, roll);
  if (legal.length === 0) {
    return null;
  }
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
    if (destCell !== null && SAFE_CELLS.indexOf(destCell) === -1) {
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
    if (progress === -1 && roll === 6) {
      score += 80;
    }
    if (dest === 57) {
      score += 70;
    }
    score += dest;
    if (destCell !== null) {
      if (SAFE_CELLS.indexOf(destCell) !== -1) {
        score += 10;
      } else {
        score -= 25;
      }
    }
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
