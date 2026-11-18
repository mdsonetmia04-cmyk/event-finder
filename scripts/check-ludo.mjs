/* Ludo engine checks + fuzz — proves the rules library behaves and
 * that no game can reach a state with no legal next action.
 *
 * Run:  node scripts/check-ludo.mjs
 *
 * Compiles the REAL src/lib/ludo/*.ts modules with the project's own
 * TypeScript compiler into a temp dir, then runs the checks against
 * the compiled output — no duplicated logic, no mocks. Exits non-zero
 * if any check fails:
 *   (a) rule checks: base exit needs a 6, captures, safe cells,
 *       blockades (landing + passing + own-token freedom), extra
 *       turns (6 / capture / home), three-six forfeit, exact finish,
 *       home-column safety, win detection, pass behaviour, and
 *       rejected transitions returning the state unchanged;
 *   (b) seeded bot-vs-bot fuzz (2/3/4 players) with a stuck-state
 *       invariant checked after EVERY transition: the game must
 *       always have a legal next action (a roll, a move/pass, or be
 *       finished), move_no must strictly increase, tokens must stay
 *       in range, and a non-safe track cell must never hold tokens
 *       of two colours;
 *   (c) capture-heavy and blockade-heavy crafted starts, fuzzed the
 *       same way, plus a determinism check (same seed, same game).
 *   (d) rollDie fairness: 60,000 rolls must be uniform over 1-6 with
 *       a chance-level repeat rate (repeats by chance are legitimate;
 *       a stuck or biased source would show ~0 or ~1 repeats).
 *   (e) config-driven rules: every rules toggle changes exactly the
 *       behaviour it names and nothing else; states without a rules
 *       field (all friends-room states) keep exact classic behaviour;
 *       custom-rules fuzz with the same stuck-state invariant.
 *   (f) AI decisions per difficulty, settings parsing/persistence,
 *       save/resume validation, and the local-game state machine
 *       (transition guards, stats, auto-play, determinism).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = mkdtempSync(join(ROOT, ".tmp-ludo-check-"));

let failures = 0;
let count = 0;
function check(name, ok, detail = "") {
  count += 1;
  if (ok) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

try {
  execFileSync(
    join(ROOT, "node_modules", ".bin", "tsc"),
    [
      join(ROOT, "src", "lib", "ludo", "engine.ts"),
      join(ROOT, "src", "lib", "ludo", "settings.ts"),
      join(ROOT, "src", "lib", "ludo", "ai.ts"),
      join(ROOT, "src", "lib", "ludo", "save.ts"),
      join(ROOT, "src", "lib", "ludo", "local-game.ts"),
      "--outDir",
      OUT,
      "--module",
      "commonjs",
      "--target",
      "es2022",
      "--lib",
      "es2022,dom",
      "--moduleResolution",
      "node",
      "--esModuleInterop",
      "--skipLibCheck",
      "--declaration",
      "false",
      "--sourceMap",
      "false",
    ],
    { stdio: "pipe" },
  );
} catch (e) {
  console.log("tsc compile failed:");
  console.log(e.stdout?.toString() ?? "");
  console.log(e.stderr?.toString() ?? "");
  rmSync(OUT, { recursive: true, force: true });
  process.exit(1);
}

const require = createRequire(import.meta.url);
const eng = require(join(OUT, "engine.js"));
const {
  applyMove,
  applyRoll,
  blockadeCells,
  botMove,
  createGame,
  effectiveSafeCells,
  legalMoves,
  resolveRules,
  rollDie,
  CLASSIC_RULES,
  SAFE_CELLS,
  trackIndex,
} = eng;
const settingsMod = require(join(OUT, "settings.js"));
const {
  ANIMATION_TIMINGS,
  DEFAULT_LOCAL_SETTINGS,
  isLudoRules,
  loadLocalSettings,
  parseLocalSettings,
  saveLocalSettings,
} = settingsMod;
const { chooseAiMove } = require(join(OUT, "ai.js"));
const saveMod = require(join(OUT, "save.js"));
const {
  LOCAL_SAVE_VERSION,
  clearSavedLocalGame,
  isValidLudoState,
  loadSavedLocalGame,
  parseSavedLocalGame,
  saveLocalGame,
} = saveMod;
const localGameMod = require(join(OUT, "local-game.js"));
const {
  autoPlayTurn,
  createLocalController,
  isAiSeat,
  localReducer,
  restoreLocalController,
  tokensHome,
  tokensInBase,
} = localGameMod;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a state directly (tests only — the engine never sees these). */
function craft(players, turn = 0, phase = "roll", roll = null, sixes = 0) {
  return {
    players: players.map(([color, tokens]) => ({ color, tokens: tokens.slice() })),
    turn,
    phase,
    roll,
    lastRoll: roll,
    sixes,
    winner: null,
    move_no: 0,
    lastBonus: null,
  };
}

/** Attach a rule set to a crafted state. */
function withRules(state, rules) {
  return { ...state, rules: { ...rules } };
}

const ALL_OFF = {
  entryOnSix: false,
  bonusOnSix: false,
  bonusOnCapture: false,
  bonusOnHome: false,
  threeSixes: false,
  safeStars: false,
  safeStarts: false,
  blockade: false,
};

function classicWith(patch) {
  return { ...CLASSIC_RULES, ...patch };
}

console.log("rule checks:");

/* --- creation --- */
{
  const g2 = createGame(2);
  check("createGame(2): 2 players, red+green, all in base", g2.players.length === 2 &&
    g2.players[0].color === "red" && g2.players[1].color === "green" &&
    g2.players.every((p) => p.tokens.every((t) => t === -1)));
  check("createGame: phase roll, turn 0, move_no 0", g2.phase === "roll" && g2.turn === 0 && g2.move_no === 0);
  const g4 = createGame(4);
  check("createGame(4): 4 colours in order", g4.players.map((p) => p.color).join(",") === "red,green,yellow,blue");
}

/* --- rollDie fairness: the single roll source for every roll path
 * (solo human/bot/timeout, room human/timeout). Uniform 1-6, with a
 * chance-level repeat rate — repeats by chance are legitimate dice
 * behaviour and are NOT suppressed. Tolerances are many sigma wide
 * at N=60000, so a fair die never trips them. --- */
{
  const N = 60000;
  const counts = [0, 0, 0, 0, 0, 0];
  let repeats = 0;
  let prev = -1;
  let inRange = true;
  for (let i = 0; i < N; i++) {
    const r = rollDie();
    if (!Number.isInteger(r) || r < 1 || r > 6) inRange = false;
    else counts[r - 1] += 1;
    if (r === prev) repeats += 1;
    prev = r;
  }
  const expected = N / 6;
  const uniform = counts.every((c) => Math.abs(c - expected) <= expected * 0.1);
  check("rollDie: integers 1-6 only", inRange);
  check(`rollDie: uniform over ${N} rolls`, uniform, counts.join(","));
  const repeatRate = repeats / (N - 1);
  check("rollDie: repeat rate near 1/6 (chance repeats, no forcing)", repeatRate > 0.13 && repeatRate < 0.2, repeatRate.toFixed(3));
}

/* --- trackIndex boundaries --- */
{
  check("trackIndex: -1 and 51+ are off-track", trackIndex("red", -1) === null && trackIndex("red", 51) === null && trackIndex("red", 57) === null);
  check("trackIndex: start offsets", trackIndex("red", 0) === 0 && trackIndex("green", 0) === 13 && trackIndex("yellow", 0) === 26 && trackIndex("blue", 0) === 39);
  check("trackIndex: wraps at 52", trackIndex("blue", 13) === 0 && trackIndex("red", 51) === null && trackIndex("red", 50) === 50);
  check("SAFE_CELLS has 8 entries", SAFE_CELLS.length === 8);
}

/* --- base exit needs a 6 --- */
{
  const g = createGame(4);
  check("rolls 1-5: no base token movable", [1, 2, 3, 4, 5].every((r) => legalMoves(g, r).length === 0));
  check("roll 6: all 4 base tokens movable", legalMoves(g, 6).length === 4);
  const moved = applyMove(applyRoll(g, 6), { token: 2 });
  check("base exit lands on progress 0", moved.players[0].tokens[2] === 0);
  check("base exit on a 6 keeps the turn", moved.turn === 0 && moved.phase === "roll" && moved.sixes === 1);
}

/* --- rejected transitions return the state unchanged --- */
{
  const g = createGame(2);
  check("applyRoll in move phase is a no-op", applyRoll(applyRoll(g, 3), 4) === applyRoll(g, 3) || JSON.stringify(applyRoll(applyRoll(g, 3), 4)) === JSON.stringify(applyRoll(g, 3)));
  check("applyMove in roll phase is a no-op", applyMove(g, { token: 0 }) === g);
  const inMove = applyRoll(g, 6);
  check("applyMove with an illegal token is a no-op", applyMove(inMove, { token: 0 }) !== inMove && (() => {
    // token 0 IS legal here; use a finished-token state instead
    const s = craft([["red", [57, -1, -1, -1]], ["green", [-1, -1, -1, -1]]], 0, "move", 3);
    return applyMove(s, { token: 0 }) === s;
  })());
}

/* --- captures --- */
{
  // Green token at progress 44 (track 5); red at progress 4 rolls 1 -> lands on track 5 -> captures.
  const s = craft([["red", [4, -1, -1, -1]], ["green", [44, -1, -1, -1]]], 0, "move", 1);
  const after = applyMove(s, { token: 0 });
  check("capture sends the victim back to base", after.players[1].tokens[0] === -1);
  check("capture grants an extra turn", after.turn === 0 && after.phase === "roll" && after.lastBonus === "capture");
  check("capture resets the sixes counter", after.sixes === 0);
}
{
  // Safe cell: red progress 8 = track 8 (safe); green progress 47 = track 8. No capture.
  const s = craft([["red", [7, -1, -1, -1]], ["green", [47, -1, -1, -1]]], 0, "move", 1);
  const after = applyMove(s, { token: 0 });
  check("safe cell: no capture", after.players[1].tokens[0] === 47);
  check("safe cell: turn passes on a plain roll", after.turn === 1);
}
{
  // Two opponents of DIFFERENT colours on one non-safe cell: both captured.
  const s = craft([["red", [4, -1, -1, -1]], ["green", [44, -1, -1, -1]], ["yellow", [31, -1, -1, -1]]], 0, "move", 1);
  const after = applyMove(s, { token: 0 });
  check("two victims of different colours both captured", after.players[1].tokens[0] === -1 && after.players[2].tokens[0] === -1);
}

/* --- blockades --- */
{
  // Green blockade on track 20 (progress 7 x2). Red at progress 18 (track 18) rolling 3 would land on 20.
  const s = craft([["red", [18, -1, -1, -1]], ["green", [7, 7, -1, -1]]]);
  check("blockadeCells reports the blocked cell", blockadeCells(s, 0).includes(20));
  check("blockade: landing on it is illegal", !legalMoves(s, 2).includes(0));
  check("blockade: passing over it is illegal", !legalMoves(s, 3).includes(0) && !legalMoves(s, 5).includes(0));
  check("blockade: stopping before it is legal", legalMoves(s, 1).includes(0));
  // Own tokens pass freely over an own blockade.
  const own = craft([["red", [18, 20, 20, -1]], ["green", [-1, -1, -1, -1]]]);
  check("own blockade: own tokens pass and stack freely", legalMoves(own, 2).includes(0) && legalMoves(own, 1).includes(1));
  // Blocked start cell: green blockade on track 0 (progress 39 x2) blocks red's base exit.
  const start = craft([["red", [-1, -1, -1, -1]], ["green", [39, 39, -1, -1]]]);
  check("blockade on a start cell blocks base exit", legalMoves(start, 6).length === 0);
  // Single opponent token is NOT a blockade.
  const single = craft([["red", [18, -1, -1, -1]], ["green", [7, -1, -1, -1]]]);
  check("single token is not a blockade", blockadeCells(single, 0).length === 0 && legalMoves(single, 2).includes(0));
}

/* --- extra turns / three-six forfeit --- */
{
  let g = createGame(2);
  g = applyMove(applyRoll(g, 6), { token: 0 });
  check("six keeps the turn, sixes=1", g.turn === 0 && g.sixes === 1 && g.lastBonus === "six");
  g = applyMove(applyRoll(g, 6), { token: 0 });
  check("second six keeps the turn, sixes=2", g.turn === 0 && g.sixes === 2);
  const forfeit = applyRoll(g, 6);
  check("third six forfeits the turn", forfeit.turn === 1 && forfeit.phase === "roll" && forfeit.sixes === 0 && forfeit.lastBonus === "forfeit");
  check("forfeit roll shows lastRoll 6", forfeit.lastRoll === 6);
  // A non-six roll resets the counter.
  let h = createGame(2);
  h = applyMove(applyRoll(h, 6), { token: 0 });
  h = applyMove(applyRoll(h, 4), { token: 0 });
  check("non-six move resets sixes and passes the turn", h.sixes === 0 && h.turn === 1);
}
{
  // Reaching home (57) grants an extra turn.
  const s = craft([["red", [56, -1, -1, -1]], ["green", [-1, -1, -1, -1]]], 0, "move", 1);
  const after = applyMove(s, { token: 0 });
  check("reaching home grants an extra turn", after.turn === 0 && after.lastBonus === "home" && after.players[0].tokens[0] === 57);
}

/* --- exact finish --- */
{
  const s = craft([["red", [56, -1, -1, -1]], ["green", [-1, -1, -1, -1]]]);
  check("exact finish: overshoot is illegal", !legalMoves(s, 2).includes(0));
  check("exact finish: exact roll is legal", legalMoves(s, 1).includes(0));
  const fin = craft([["red", [57, -1, -1, -1]], ["green", [-1, -1, -1, -1]]]);
  check("finished token never moves", !legalMoves(fin, 6).includes(0));
}

/* --- home column safety --- */
{
  // Red token in home column (progress 52); green cannot reach it.
  const s = craft([["red", [52, -1, -1, -1]], ["green", [44, -1, -1, -1]]]);
  check("home-column tokens are off-track (no capture possible)", trackIndex("red", 52) === null);
  const moved = applyMove(craft([["red", [52, -1, -1, -1]], ["green", [44, -1, -1, -1]]], 1, "move", 6), { token: 0 });
  check("opponent move leaves the home-column token alone", moved.players[0].tokens[0] === 52);
}

/* --- win + pass --- */
{
  const s = craft([["red", [57, 57, 57, 56]], ["green", [-1, -1, -1, -1]]], 0, "move", 1);
  const after = applyMove(s, { token: 3 });
  check("all 4 home finishes the game with the winner", after.phase === "finished" && after.winner === 0);
  const pass = applyMove(craft([["red", [-1, -1, -1, -1]], ["green", [-1, -1, -1, -1]]], 0, "move", 3), { token: null });
  check("pass advances the turn and resets sixes", pass.turn === 1 && pass.phase === "roll" && pass.sixes === 0);
  check("every accepted transition bumps move_no", pass.move_no === 1 && after.move_no === 1);
}

/* --- botMove --- */
{
  const g = createGame(2);
  check("botMove returns null with no legal moves", botMove(g, 3) === null);
  const b = botMove(g, 6);
  check("botMove returns a legal token", b !== null && legalMoves(g, 6).includes(b));
  const cap = craft([["red", [4, 10, -1, -1]], ["green", [44, -1, -1, -1]]]);
  check("botMove prefers the capture", botMove(cap, 1) === 0);
}

/* --- fuzz with the stuck-state invariant after EVERY transition --- */
console.log("fuzz:");

function cellColorMap(state) {
  // non-safe track cell -> set of colours present
  const map = new Map();
  for (const p of state.players) {
    for (const prog of p.tokens) {
      const cell = trackIndex(p.color, prog);
      if (cell === null || SAFE_CELLS.includes(cell)) continue;
      if (!map.has(cell)) map.set(cell, new Set());
      map.get(cell).add(p.color);
    }
  }
  return map;
}

function checkInvariants(state, prevMoveNo, label) {
  const problems = [];
  if (state.move_no !== prevMoveNo + 1) problems.push(`move_no ${prevMoveNo} -> ${state.move_no}`);
  if (state.phase === "move" && state.roll === null) problems.push("phase move with null roll");
  if (state.phase === "roll" && state.roll !== null) problems.push("phase roll with a roll set");
  if (state.phase === "finished" && state.winner === null) problems.push("finished without a winner");
  if (state.turn < 0 || state.turn >= state.players.length) problems.push(`turn ${state.turn} out of range`);
  if (state.sixes < 0 || state.sixes > 2) problems.push(`sixes ${state.sixes}`);
  for (const p of state.players) {
    for (const prog of p.tokens) {
      if (!Number.isInteger(prog) || prog < -1 || prog > 57) problems.push(`token progress ${prog}`);
    }
  }
  for (const [cell, colours] of cellColorMap(state)) {
    if (colours.size > 1) problems.push(`cell ${cell} holds ${[...colours].join("+")}`);
  }
  // Next-action invariant: the game must always have a legal next action.
  if (state.phase === "roll") {
    // a roll is always possible
  } else if (state.phase === "move") {
    // a move or a pass is always defined
    if (state.roll === null) problems.push("move phase without a roll");
  } else if (state.phase !== "finished") {
    problems.push(`unknown phase ${state.phase}`);
  }
  if (problems.length > 0) {
    check(`invariants ${label}`, false, problems.join("; "));
    return false;
  }
  return true;
}

function playBotGame(seed, playerCount, startState) {
  const rand = mulberry32(seed);
  let state = startState ?? createGame(playerCount);
  let plies = 0;
  let passes = 0;
  let maxPassStreak = 0;
  let passStreak = 0;
  while (state.phase !== "finished" && plies < 3000) {
    const prev = state.move_no;
    if (state.phase === "roll") {
      const roll = 1 + Math.floor(rand() * 6);
      state = applyRoll(state, roll);
      passStreak = 0;
    } else {
      const token = botMove(state, state.roll);
      if (token === null) {
        passes += 1;
        passStreak += 1;
        maxPassStreak = Math.max(maxPassStreak, passStreak);
      } else {
        passStreak = 0;
      }
      state = applyMove(state, { token });
    }
    plies += 1;
    if (!checkInvariants(state, prev, `seed=${seed} ply=${plies}`)) return null;
  }
  return { state, plies, passes, maxPassStreak };
}

let fuzzGames = 0;
let fuzzPlies = 0;
let fuzzFailed = false;
for (const players of [2, 3, 4]) {
  for (let seed = 1; seed <= 60; seed++) {
    const res = playBotGame(seed * 7919 + players, players, null);
    if (!res) { fuzzFailed = true; break; }
    fuzzGames += 1;
    fuzzPlies += res.plies;
    if (res.state.phase !== "finished") {
      check(`fuzz ${players}p seed=${seed} terminates`, false, `${res.plies} plies without a winner`);
      fuzzFailed = true;
      break;
    }
    if (res.maxPassStreak > 12) {
      check(`fuzz ${players}p seed=${seed} no pass loop`, false, `${res.maxPassStreak} consecutive passes`);
      fuzzFailed = true;
      break;
    }
  }
  if (fuzzFailed) break;
}
check(`${fuzzGames} bot-vs-bot games (2/3/4p) finish with invariants holding every ply`, !fuzzFailed && fuzzGames === 180, `${fuzzPlies} plies played`);

/* Capture-heavy crafted starts: random placements that are LEGAL
 * (no non-safe cell shared across colours — a position real games
 * can reach) with at least two capture threats on the board. */
function randomLegalStart(rand) {
  const colors = ["red", "green", "yellow", "blue"];
  for (let attempt = 0; attempt < 300; attempt++) {
    const players = [];
    const used = new Map(); // non-safe cell -> colour
    let legal = true;
    for (const color of colors) {
      const tokens = [];
      for (let k = 0; k < 3; k++) {
        const prog = Math.floor(rand() * 51); // 0..50, on the track
        const cell = trackIndex(color, prog);
        if (cell === null) { legal = false; break; }
        if (!SAFE_CELLS.includes(cell)) {
          if (used.has(cell) && used.get(cell) !== color) { legal = false; break; }
          used.set(cell, color);
        }
        tokens.push(prog);
      }
      if (!legal) break;
      tokens.push(-1);
      players.push([color, tokens]);
    }
    if (!legal) continue;
    const start = craft(players);
    let threats = 0;
    for (let p = 0; p < 4; p++) {
      for (const prog of start.players[p].tokens) {
        const cell = trackIndex(start.players[p].color, prog);
        if (cell === null || SAFE_CELLS.includes(cell)) continue;
        for (let q = 0; q < 4; q++) {
          if (q === p) continue;
          for (const op of start.players[q].tokens) {
            const oc = trackIndex(start.players[q].color, op);
            if (oc === null) continue;
            const gap = (cell - oc + 52) % 52;
            if (gap >= 1 && gap <= 6) threats += 1;
          }
        }
      }
    }
    if (threats >= 2) return start;
  }
  return null;
}

{
  let ok = true;
  let played = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const start = randomLegalStart(mulberry32(seed * 104729));
    if (!start) { ok = false; break; }
    const res = playBotGame(seed * 31, 4, start);
    if (!res || res.state.phase !== "finished") { ok = false; break; }
    played += 1;
  }
  check(`30 capture-heavy games finish cleanly`, ok && played === 30);
}

/* Blockade-heavy crafted starts. Blockades sit on distinct non-safe
 * cells (10, 36, 20, 44); the lone tokens run straight at them. */
{
  let ok = true;
  let played = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const start = craft([
      ["red", [10, 10, 30, -1]], // blockade on track 10
      ["green", [23, 23, 45, -1]], // blockade on track 36
      ["yellow", [46, 46, 5, -1]], // blockade on track 20
      ["blue", [5, 5, 18, -1]], // blockade on track 44
    ]);
    const res = playBotGame(seed * 47 + 5, 4, start);
    if (!res || res.state.phase !== "finished") { ok = false; break; }
    played += 1;
  }
  check(`30 blockade-heavy games finish cleanly`, ok && played === 30);
}

/* Determinism: same seed, same game. */
{
  const a = playBotGame(12345, 4, null);
  const b = playBotGame(12345, 4, null);
  check("same seed replays identically", a !== null && b !== null &&
    a.state.winner === b.state.winner && a.state.move_no === b.state.move_no &&
    JSON.stringify(a.state.players) === JSON.stringify(b.state.players));
}

/* --- config-driven rules --- */
console.log("config-driven rules:");
{
  const noRules = createGame(4);
  check("states without a rules field resolve to classic", !("rules" in noRules) &&
    JSON.stringify(resolveRules(noRules)) === JSON.stringify(CLASSIC_RULES));
  const custom = createGame(4, ALL_OFF);
  check("createGame stores the given rules", JSON.stringify(custom.rules) === JSON.stringify(ALL_OFF));
  const mutable = { ...ALL_OFF };
  const g = createGame(4, mutable);
  mutable.entryOnSix = true;
  check("createGame copies the rules (later mutation is ignored)", g.rules.entryOnSix === false);
  check("effectiveSafeCells: classic has all 8", effectiveSafeCells(CLASSIC_RULES).length === 8);
  check("effectiveSafeCells: all off has none", effectiveSafeCells(ALL_OFF).length === 0);
  check("effectiveSafeCells: stars only", JSON.stringify(effectiveSafeCells(classicWith({ safeStarts: false })).sort((a, b) => a - b)) === "[8,21,34,47]");
  check("effectiveSafeCells: starts only", JSON.stringify(effectiveSafeCells(classicWith({ safeStars: false })).sort((a, b) => a - b)) === "[0,13,26,39]");
}
{
  /* Entry on 1 when entryOnSix is off. */
  const g = withRules(createGame(4), classicWith({ entryOnSix: false }));
  check("entryOnSix off: roll 1 exits base", legalMoves(g, 1).length === 4);
  check("entryOnSix off: rolls 2-5 still cannot exit", [2, 3, 4, 5].every((r) => legalMoves(g, r).length === 0));
  check("entryOnSix off: roll 6 still exits", legalMoves(g, 6).length === 4);
  const moved = applyMove(applyRoll(g, 1), { token: 1 });
  check("entry on 1 lands on progress 0 and passes the turn", moved.players[0].tokens[1] === 0 && moved.turn === 1);
}
{
  /* A captured token re-enters under the same entry rule. */
  const s = withRules(craft([["red", [4, -1, -1, -1]], ["green", [44, -1, -1, -1]]], 0, "move", 1), CLASSIC_RULES);
  const after = applyMove(s, { token: 0 });
  const victimTurn = { ...after, turn: 1, phase: "roll", roll: null };
  check("classic: captured token needs a 6 to re-enter", [1, 2, 3, 4, 5].every((r) => legalMoves(victimTurn, r).length === 0) && legalMoves(victimTurn, 6).length === 4);
  const victimTurnOff = withRules(victimTurn, classicWith({ entryOnSix: false }));
  check("entryOnSix off: captured token re-enters on a 1", legalMoves(victimTurnOff, 1).length === 4);
}
{
  /* Each bonus toggle, in isolation and combined. */
  const noSix = withRules(createGame(2), classicWith({ bonusOnSix: false }));
  const m1 = applyMove(applyRoll(noSix, 6), { token: 0 });
  check("bonusOnSix off: a 6 passes the turn", m1.turn === 1 && m1.lastBonus === null && m1.sixes === 0);
  const onlySix = withRules(createGame(2), { ...ALL_OFF, bonusOnSix: true, threeSixes: true });
  const m2 = applyMove(applyRoll(onlySix, 6), { token: 0 });
  check("bonusOnSix on (others off): a 6 keeps the turn", m2.turn === 0 && m2.lastBonus === "six" && m2.sixes === 1);
  const noCap = withRules(craft([["red", [4, -1, -1, -1]], ["green", [44, -1, -1, -1]]], 0, "move", 1), classicWith({ bonusOnCapture: false }));
  const m3 = applyMove(noCap, { token: 0 });
  check("bonusOnCapture off: a capture passes the turn", m3.turn === 1 && m3.lastBonus === null && m3.players[1].tokens[0] === -1);
  const onlyCap = withRules(craft([["red", [4, -1, -1, -1]], ["green", [44, -1, -1, -1]]], 0, "move", 1), { ...ALL_OFF, bonusOnCapture: true });
  const m4 = applyMove(onlyCap, { token: 0 });
  check("bonusOnCapture on (others off): a capture keeps the turn", m4.turn === 0 && m4.lastBonus === "capture");
  const noHome = withRules(craft([["red", [56, -1, -1, -1]], ["green", [-1, -1, -1, -1]]], 0, "move", 1), classicWith({ bonusOnHome: false }));
  const m5 = applyMove(noHome, { token: 0 });
  check("bonusOnHome off: reaching home passes the turn", m5.turn === 1 && m5.lastBonus === null && m5.players[0].tokens[0] === 57);
  const onlyHome = withRules(craft([["red", [56, -1, -1, -1]], ["green", [-1, -1, -1, -1]]], 0, "move", 1), { ...ALL_OFF, bonusOnHome: true });
  const m6 = applyMove(onlyHome, { token: 0 });
  check("bonusOnHome on (others off): reaching home keeps the turn", m6.turn === 0 && m6.lastBonus === "home");
  /* Six + capture: the six bonus wins the label. Red 4 + 6 -> track 10; green 49 -> track 10. */
  const both = withRules(craft([["red", [4, -1, -1, -1]], ["green", [49, -1, -1, -1]]], 0, "move", 6), CLASSIC_RULES);
  const m7 = applyMove(both, { token: 0 });
  check("six + capture: bonus label is six", m7.lastBonus === "six" && m7.turn === 0 && m7.players[1].tokens[0] === -1);
}
{
  /* Three-sixes toggle. */
  const off = withRules(craft([["red", [0, -1, -1, -1]], ["green", [-1, -1, -1, -1]]], 0, "roll", null, 2), classicWith({ threeSixes: false }));
  const rolled = applyRoll(off, 6);
  check("threeSixes off: third 6 is playable, no forfeit", rolled.phase === "move" && legalMoves(rolled, 6).length > 0);
  const moved = applyMove(rolled, { token: 0 });
  check("threeSixes off: sixes counter reaches 3", moved.sixes === 3 && moved.turn === 0);
  const on = withRules(craft([["red", [0, -1, -1, -1]], ["green", [-1, -1, -1, -1]]], 0, "roll", null, 2), CLASSIC_RULES);
  check("explicit classic rules still forfeit on the third 6", applyRoll(on, 6).lastBonus === "forfeit");
}
{
  /* Safe-square toggles. Star cell track 8: red 7 -> 8, green 47 -> 8.
     Start cell track 0: yellow 25 -> 26 (track 0), green 39 -> 0. */
  const starOff = withRules(craft([["red", [7, -1, -1, -1]], ["green", [47, -1, -1, -1]]], 0, "move", 1), classicWith({ safeStars: false }));
  check("safeStars off: capture on a star cell", applyMove(starOff, { token: 0 }).players[1].tokens[0] === -1);
  const starOffStartOn = withRules(craft([["red", [-1, -1, -1, -1]], ["green", [39, -1, -1, -1]], ["yellow", [25, -1, -1, -1]]], 2, "move", 1), classicWith({ safeStars: false }));
  check("safeStars off: start cells still protected", applyMove(starOffStartOn, { token: 0 }).players[1].tokens[0] === 39);
  const startOff = withRules(craft([["red", [-1, -1, -1, -1]], ["green", [39, -1, -1, -1]], ["yellow", [25, -1, -1, -1]]], 2, "move", 1), classicWith({ safeStarts: false }));
  check("safeStarts off: capture on a start cell", applyMove(startOff, { token: 0 }).players[1].tokens[0] === -1);
  const startOffStarOn = withRules(craft([["red", [7, -1, -1, -1]], ["green", [47, -1, -1, -1]]], 0, "move", 1), classicWith({ safeStarts: false }));
  check("safeStarts off: star cells still protected", applyMove(startOffStarOn, { token: 0 }).players[1].tokens[0] === 47);
  const homeLane = withRules(craft([["red", [52, -1, -1, -1]], ["green", [44, -1, -1, -1]]], 1, "move", 6), ALL_OFF);
  check("home lane stays safe with both safe toggles off", applyMove(homeLane, { token: 0 }).players[0].tokens[0] === 52);
}
{
  /* Blockade toggle. Green blockade on track 20 (progress 7 x2). */
  const blocked = withRules(craft([["red", [18, -1, -1, -1]], ["green", [7, 7, -1, -1]]]), CLASSIC_RULES);
  const free = withRules(craft([["red", [18, -1, -1, -1]], ["green", [7, 7, -1, -1]]]), classicWith({ blockade: false }));
  check("blockade off: blockadeCells is empty", blockadeCells(free, 0).length === 0);
  check("blockade off: landing on the stack is legal", legalMoves(free, 2).includes(0));
  check("blockade off: passing over the stack is legal", legalMoves(free, 3).includes(0));
  const landed = applyMove(withRules(craft([["red", [18, -1, -1, -1]], ["green", [7, 7, -1, -1]]], 0, "move", 2), classicWith({ blockade: false })), { token: 0 });
  check("blockade off: landing captures both stacked tokens", landed.players[1].tokens[0] === -1 && landed.players[1].tokens[1] === -1);
  const starStack = withRules(craft([["red", [7, -1, -1, -1]], ["green", [47, 47, -1, -1]]]), classicWith({ safeStars: false }));
  check("blockade on + safeStars off: the stack still blocks", !legalMoves(starStack, 1).includes(0));
  const starStackFree = withRules(craft([["red", [7, -1, -1, -1]], ["green", [47, 47, -1, -1]]], 0, "move", 1), { ...ALL_OFF, bonusOnCapture: true });
  const starLanded = applyMove(starStackFree, { token: 0 });
  check("blockade off + safeStars off: landing captures both", starLanded.players[1].tokens[0] === -1 && starLanded.players[1].tokens[1] === -1);
  const startBlocked = withRules(craft([["red", [-1, -1, -1, -1]], ["green", [39, 39, -1, -1]]]), classicWith({ blockade: false }));
  check("blockade off: base exit onto a stacked start cell is legal", legalMoves(startBlocked, 6).length === 4);
  const exitShared = applyMove(applyRoll(startBlocked, 6), { token: 0 });
  check("blockade off + safe start: exit shares the cell, no capture", exitShared.players[1].tokens[0] === 39 && exitShared.players[1].tokens[1] === 39);
  const exitCapture = applyMove(applyRoll(withRules(craft([["red", [-1, -1, -1, -1]], ["green", [39, 39, -1, -1]]]), ALL_OFF), 6), { token: 0 });
  check("all toggles off: base exit onto the stack captures both", exitCapture.players[1].tokens[0] === -1 && exitCapture.players[1].tokens[1] === -1);
}
{
  /* Movement from every start, clockwise order, home-lane entry, overshoot. */
  const starts = [0, 13, 26, 39];
  let startsOk = true;
  for (let i = 0; i < 4; i++) {
    const colors = ["red", "green", "yellow", "blue"];
    const players = colors.slice(0, 4).map((c) => [c, [-1, -1, -1, -1]]);
    const s = craft(players, i, "roll", null);
    const moved = applyMove(applyRoll(s, 6), { token: 0 });
    if (moved.players[i].tokens[0] !== 0 || trackIndex(colors[i], 0) !== starts[i]) startsOk = false;
  }
  check("every colour exits base onto its own start cell", startsOk);
  let clockwiseOk = true;
  const offsets = { red: 0, green: 13, yellow: 26, blue: 39 };
  for (const [color, off] of Object.entries(offsets)) {
    for (let p = 0; p <= 50; p++) {
      if (trackIndex(color, p) !== (off + p) % 52) clockwiseOk = false;
    }
  }
  check("clockwise: progress maps to (start + progress) % 52 for all colours", clockwiseOk);
  check("wraparound: blue 13, yellow 26, green 39 all land on track 0", trackIndex("blue", 13) === 0 && trackIndex("yellow", 26) === 0 && trackIndex("green", 39) === 0);
  const lane = withRules(craft([["red", [50, -1, -1, -1]], ["green", [-1, -1, -1, -1]]]), CLASSIC_RULES);
  check("home-lane entry: 50 + 1 enters the lane off-track", applyMove(applyRoll(lane, 1), { token: 0 }).players[0].tokens[0] === 51 && trackIndex("red", 51) === null);
  check("home-lane entry: 50 + 6 reaches the last lane cell", applyMove(applyRoll(withRules(craft([["red", [50, -1, -1, -1]], ["green", [-1, -1, -1, -1]]]), CLASSIC_RULES), 6), { token: 0 }).players[0].tokens[0] === 56);
  const over = withRules(craft([["red", [56, -1, -1, -1]], ["green", [-1, -1, -1, -1]]]), CLASSIC_RULES);
  check("overshoot: 56 + 2 and 55 + 3 are illegal", !legalMoves(over, 2).includes(0) && !legalMoves(withRules(craft([["red", [55, -1, -1, -1]], ["green", [-1, -1, -1, -1]]]), CLASSIC_RULES), 3).includes(0));
  check("exact finish: 55 + 2 and 54 + 3 are legal", legalMoves(withRules(craft([["red", [55, -1, -1, -1]], ["green", [-1, -1, -1, -1]]]), CLASSIC_RULES), 2).includes(0) && legalMoves(withRules(craft([["red", [54, -1, -1, -1]], ["green", [-1, -1, -1, -1]]]), CLASSIC_RULES), 3).includes(0));
  const noMoves = withRules(createGame(2), ALL_OFF);
  check("no-legal-moves: all in base + roll 3 has no moves even with entry on 1", legalMoves(noMoves, 3).length === 0);
  const nearWin = withRules(craft([["red", [57, 57, 57, 56]], ["green", [-1, -1, -1, -1]]], 0, "move", 1), ALL_OFF);
  const won = applyMove(nearWin, { token: 3 });
  check("win detection under custom rules", won.phase === "finished" && won.winner === 0);
  check("finished games reject further transitions", applyRoll(won, 3) === won && applyMove(won, { token: 0 }) === won);
  const carried = applyMove(applyRoll(createGame(2, ALL_OFF), 6), { token: 0 });
  check("rules survive transitions unchanged", JSON.stringify(carried.rules) === JSON.stringify(ALL_OFF) && carried.move_no === 2);
}

/* --- custom-rules fuzz --- */
console.log("custom-rules fuzz:");

function checkInvariantsCustom(state, prevMoveNo, safeCells, allowBigSixes, label) {
  const problems = [];
  if (state.move_no !== prevMoveNo + 1) problems.push(`move_no ${prevMoveNo} -> ${state.move_no}`);
  if (state.phase === "move" && state.roll === null) problems.push("phase move with null roll");
  if (state.phase === "roll" && state.roll !== null) problems.push("phase roll with a roll set");
  if (state.phase === "finished" && state.winner === null) problems.push("finished without a winner");
  if (state.turn < 0 || state.turn >= state.players.length) problems.push(`turn ${state.turn} out of range`);
  if (state.sixes < 0 || (!allowBigSixes && state.sixes > 2)) problems.push(`sixes ${state.sixes}`);
  for (const p of state.players) {
    for (const prog of p.tokens) {
      if (!Number.isInteger(prog) || prog < -1 || prog > 57) problems.push(`token progress ${prog}`);
    }
  }
  const map = new Map();
  for (const p of state.players) {
    for (const prog of p.tokens) {
      const cell = trackIndex(p.color, prog);
      if (cell === null || safeCells.includes(cell)) continue;
      if (!map.has(cell)) map.set(cell, new Set());
      map.get(cell).add(p.color);
    }
  }
  for (const [cell, colours] of map) {
    if (colours.size > 1) problems.push(`cell ${cell} holds ${[...colours].join("+")}`);
  }
  if (problems.length > 0) {
    check(`custom invariants ${label}`, false, problems.join("; "));
    return false;
  }
  return true;
}

function playBotGameCustom(seed, playerCount, rules) {
  const rand = mulberry32(seed);
  const safeCells = effectiveSafeCells(rules);
  let state = createGame(playerCount, rules);
  let plies = 0;
  while (state.phase !== "finished" && plies < 3000) {
    const prev = state.move_no;
    if (state.phase === "roll") {
      state = applyRoll(state, 1 + Math.floor(rand() * 6));
    } else {
      state = applyMove(state, { token: botMove(state, state.roll) });
    }
    plies += 1;
    if (!checkInvariantsCustom(state, prev, safeCells, !rules.threeSixes, `seed=${seed} ply=${plies}`)) return null;
  }
  return { state, plies };
}

{
  let ok = true;
  let played = 0;
  for (const players of [2, 3, 4]) {
    for (let seed = 1; seed <= 10; seed++) {
      const res = playBotGameCustom(seed * 331 + players, players, ALL_OFF);
      if (!res || res.state.phase !== "finished") { ok = false; break; }
      played += 1;
    }
    if (!ok) break;
  }
  check("30 all-toggles-off games (2/3/4p) finish with invariants holding", ok && played === 30);
}
{
  let ok = true;
  let played = 0;
  const keys = Object.keys(CLASSIC_RULES);
  for (let seed = 1; seed <= 20; seed++) {
    const rand = mulberry32(seed * 1013);
    const rules = {};
    for (const k of keys) rules[k] = rand() < 0.5;
    const res = playBotGameCustom(seed * 77, 4, rules);
    if (!res || res.state.phase !== "finished") { ok = false; break; }
    played += 1;
  }
  check("20 random rule combinations finish with invariants holding", ok && played === 20);
}
{
  const a = playBotGameCustom(4242, 4, ALL_OFF);
  const b = playBotGameCustom(4242, 4, ALL_OFF);
  check("custom-rules games replay identically from the same seed", a !== null && b !== null &&
    a.state.winner === b.state.winner && a.state.move_no === b.state.move_no &&
    JSON.stringify(a.state.players) === JSON.stringify(b.state.players));
}

/* --- AI decisions --- */
console.log("AI decisions:");
{
  const g = createGame(2);
  check("easy: null with no legal moves", chooseAiMove(g, 3, "easy") === null);
  check("medium: null with no legal moves", chooseAiMove(g, 3, "medium") === null);
  check("hard: null with no legal moves", chooseAiMove(g, 3, "hard") === null);
  check("easy: rand 0 picks the first legal token", chooseAiMove(g, 6, "easy", () => 0) === 0);
  check("easy: rand ~1 picks the last legal token", chooseAiMove(g, 6, "easy", () => 0.999) === 3);
  const picks = new Set([0, 0.25, 0.5, 0.75, 0.99].map((v) => chooseAiMove(g, 6, "easy", () => v)));
  check("easy: different rand values pick different tokens", picks.size >= 3, [...picks].join(","));
  check("easy: always a legal token", [0, 0.3, 0.6, 0.9].every((v) => legalMoves(g, 6).includes(chooseAiMove(g, 6, "easy", () => v))));
  const cap = craft([["red", [4, 10, -1, -1]], ["green", [44, -1, -1, -1]]]);
  check("medium: prefers the capture", chooseAiMove(cap, 1, "medium") === 0);
  const exit = craft([["red", [-1, 10, -1, -1]], ["green", [-1, -1, -1, -1]]]);
  check("medium: prefers leaving base over plain progress", chooseAiMove(exit, 6, "medium") === 0);
  const home = craft([["red", [56, 10, -1, -1]], ["green", [-1, -1, -1, -1]]]);
  check("medium: prefers reaching home", chooseAiMove(home, 1, "medium") === 0);
  check("medium: deterministic on the same state", chooseAiMove(cap, 1, "medium") === chooseAiMove(cap, 1, "medium"));
  const states = [
    createGame(2),
    craft([["red", [4, 10, -1, -1]], ["green", [44, -1, -1, -1]]]),
    craft([["red", [18, -1, -1, -1]], ["green", [7, 7, -1, -1]]]),
    craft([["red", [52, 20, -1, -1]], ["green", [30, -1, -1, -1]]]),
    craft([["red", [56, 10, -1, -1]], ["green", [44, -1, -1, -1]]]),
  ];
  const rolls = [6, 1, 2, 3, 1];
  let hardMatches = true;
  for (let i = 0; i < states.length; i++) {
    if (chooseAiMove(states[i], rolls[i], "hard") !== botMove(states[i], rolls[i])) hardMatches = false;
  }
  const rand = mulberry32(99);
  for (let i = 0; i < 50; i++) {
    const s = craft([
      ["red", [Math.floor(rand() * 58) - 1, Math.floor(rand() * 58) - 1, -1, -1]],
      ["green", [Math.floor(rand() * 58) - 1, -1, -1, -1]],
    ]);
    const roll = 1 + Math.floor(rand() * 6);
    if (chooseAiMove(s, roll, "hard") !== botMove(s, roll)) hardMatches = false;
  }
  check("hard: identical decisions to the full heuristic", hardMatches);
  /* Star capture: red 7 -> 8, green 47 -> 8; red 20 -> 21 (other star). */
  const starPos = craft([["red", [7, 20, -1, -1]], ["green", [47, -1, -1, -1]]]);
  check("hard: takes the star capture when stars are unsafe",
    chooseAiMove(withRules(starPos, classicWith({ safeStars: false })), 1, "hard") === 0);
  check("hard: prefers the other safe star when stars are safe",
    chooseAiMove(withRules(starPos, CLASSIC_RULES), 1, "hard") === 1);
}

/* --- settings + save/resume --- */
console.log("settings & saves:");

/* In-memory localStorage stand-in: the modules only touch `window`
   through guarded calls, so a mock window exercises the real code. */
const memStore = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (memStore.has(k) ? memStore.get(k) : null),
    setItem: (k, v) => memStore.set(k, String(v)),
    removeItem: (k) => memStore.delete(k),
  },
};

{
  const valid = { rules: { ...CLASSIC_RULES }, sound: false, animationSpeed: "fast", aiDifficulty: "hard" };
  const parsed = parseLocalSettings(valid);
  check("parseLocalSettings: accepts a valid shape", parsed !== null && parsed.sound === false && parsed.animationSpeed === "fast");
  check("parseLocalSettings: copies the rules", parsed !== null && parsed.rules !== valid.rules);
  check("parseLocalSettings: tolerates extra fields", parseLocalSettings({ ...valid, extra: 1 }) !== null);
  check("parseLocalSettings: rejects null and {}", parseLocalSettings(null) === null && parseLocalSettings({}) === null);
  check("parseLocalSettings: rejects a missing rules field", parseLocalSettings({ sound: true, animationSpeed: "normal", aiDifficulty: "easy" }) === null);
  check("parseLocalSettings: rejects a non-boolean rule", parseLocalSettings({ ...valid, rules: { ...CLASSIC_RULES, blockade: "yes" } }) === null);
  check("parseLocalSettings: rejects a non-boolean sound flag", parseLocalSettings({ ...valid, sound: "on" }) === null);
  check("parseLocalSettings: rejects an unknown speed", parseLocalSettings({ ...valid, animationSpeed: "turbo" }) === null);
  check("parseLocalSettings: rejects an unknown difficulty", parseLocalSettings({ ...valid, aiDifficulty: "insane" }) === null);
  check("isLudoRules: classic and all-off pass, bad shapes fail",
    isLudoRules(CLASSIC_RULES) && isLudoRules(ALL_OFF) &&
    !isLudoRules(null) && !isLudoRules({ ...CLASSIC_RULES, blockade: 1 }) &&
    !isLudoRules({ entryOnSix: true }));
  check("ANIMATION_TIMINGS: normal matches the classic timings",
    ANIMATION_TIMINGS.normal.hopMs === 135 && ANIMATION_TIMINGS.normal.flyHomeMs === 550 &&
    ANIMATION_TIMINGS.normal.settleMs === 800 && ANIMATION_TIMINGS.normal.botRollDelayMs === 800 &&
    ANIMATION_TIMINGS.normal.botMoveDelayMs === 700 && ANIMATION_TIMINGS.normal.autoPassMs === 900);
  check("ANIMATION_TIMINGS: slow > normal > fast",
    ANIMATION_TIMINGS.slow.hopMs > ANIMATION_TIMINGS.normal.hopMs &&
    ANIMATION_TIMINGS.normal.hopMs > ANIMATION_TIMINGS.fast.hopMs &&
    ANIMATION_TIMINGS.slow.settleMs > ANIMATION_TIMINGS.normal.settleMs &&
    ANIMATION_TIMINGS.normal.settleMs > ANIMATION_TIMINGS.fast.settleMs);
  memStore.clear();
  check("loadLocalSettings: defaults with no stored value", JSON.stringify(loadLocalSettings()) === JSON.stringify(DEFAULT_LOCAL_SETTINGS));
  saveLocalSettings(valid);
  check("settings persist: save then load round-trips", JSON.stringify(loadLocalSettings()) === JSON.stringify(valid));
  memStore.set("ssc:ludo:local-settings", "{not json");
  check("settings: corrupted JSON falls back to defaults", JSON.stringify(loadLocalSettings()) === JSON.stringify(DEFAULT_LOCAL_SETTINGS));
  memStore.set("ssc:ludo:local-settings", JSON.stringify({ rules: { entryOnSix: true } }));
  check("settings: invalid shape falls back to defaults", JSON.stringify(loadLocalSettings()) === JSON.stringify(DEFAULT_LOCAL_SETTINGS));
}

function makeSave(overrides = {}) {
  const c = createLocalController(1, { ...DEFAULT_LOCAL_SETTINGS, rules: { ...CLASSIC_RULES } }, 7, 1000);
  const base = {
    version: LOCAL_SAVE_VERSION,
    savedAt: 2000,
    game: c.game,
    humans: 1,
    settings: c.settings,
    gameKey: 7,
    startedAt: 1000,
    stats: c.stats,
  };
  return { ...base, ...overrides };
}

{
  const roundTripped = parseSavedLocalGame(JSON.parse(JSON.stringify(makeSave())));
  check("save: a valid save parses after a JSON round-trip", roundTripped !== null && roundTripped.gameKey === 7 && roundTripped.humans === 1);
  check("save: rejects a wrong version", parseSavedLocalGame(makeSave({ version: 2 })) === null);
  check("save: rejects a missing version", parseSavedLocalGame(makeSave({ version: undefined })) === null);
  const finished = makeSave();
  finished.game = { ...finished.game, phase: "finished", winner: 0 };
  check("save: rejects a finished game", parseSavedLocalGame(finished) === null);
  const badToken = makeSave();
  badToken.game = JSON.parse(JSON.stringify(badToken.game));
  badToken.game.players[0].tokens[0] = 58;
  check("save: rejects a token out of range (58)", parseSavedLocalGame(badToken) === null);
  badToken.game.players[0].tokens[0] = -2;
  check("save: rejects a token out of range (-2)", parseSavedLocalGame(badToken) === null);
  const badPhase = makeSave();
  badPhase.game = { ...badPhase.game, phase: "bogus" };
  check("save: rejects an unknown phase", parseSavedLocalGame(badPhase) === null);
  const moveNoRoll = makeSave();
  moveNoRoll.game = { ...moveNoRoll.game, phase: "move", roll: null };
  check("save: rejects move phase with a null roll", parseSavedLocalGame(moveNoRoll) === null);
  const rollWithRoll = makeSave();
  rollWithRoll.game = { ...rollWithRoll.game, phase: "roll", roll: 3 };
  check("save: rejects roll phase with a roll set", parseSavedLocalGame(rollWithRoll) === null);
  const onePlayer = makeSave();
  onePlayer.game = { ...onePlayer.game, players: onePlayer.game.players.slice(0, 1) };
  check("save: rejects 1 player", parseSavedLocalGame(onePlayer) === null);
  const wrongOrder = makeSave();
  wrongOrder.game = JSON.parse(JSON.stringify(wrongOrder.game));
  wrongOrder.game.players.reverse();
  check("save: rejects colours out of seating order", parseSavedLocalGame(wrongOrder) === null);
  const badTurn = makeSave();
  badTurn.game = { ...badTurn.game, turn: 4 };
  check("save: rejects a turn out of range", parseSavedLocalGame(badTurn) === null);
  const staleWinner = makeSave();
  staleWinner.game = { ...staleWinner.game, winner: 1 };
  check("save: rejects a winner on an unfinished game", parseSavedLocalGame(staleWinner) === null);
  const badBonus = makeSave();
  badBonus.game = { ...badBonus.game, lastBonus: "jackpot" };
  check("save: rejects an unknown bonus label", parseSavedLocalGame(badBonus) === null);
  check("save: rejects humans=2 with 4 players", parseSavedLocalGame(makeSave({ humans: 2 })) === null);
  const twoPlayer = makeSave();
  twoPlayer.game = createGame(2, CLASSIC_RULES);
  twoPlayer.stats = twoPlayer.stats.slice(0, 2);
  check("save: rejects humans=1 with 2 players", parseSavedLocalGame(twoPlayer) === null);
  check("save: rejects humans=5", parseSavedLocalGame(makeSave({ humans: 5 })) === null);
  const mismatch = makeSave();
  mismatch.settings = { ...mismatch.settings, rules: { ...ALL_OFF } };
  check("save: rejects rules that disagree with the engine state", parseSavedLocalGame(mismatch) === null);
  const noRules = makeSave();
  noRules.game = { ...noRules.game };
  delete noRules.game.rules;
  check("save: rejects a state without rules", parseSavedLocalGame(noRules) === null);
  const badStats = makeSave();
  badStats.stats = JSON.parse(JSON.stringify(badStats.stats));
  badStats.stats[0].moves = -1;
  check("save: rejects negative stats", parseSavedLocalGame(badStats) === null);
  check("save: rejects a stats array of the wrong length", parseSavedLocalGame(makeSave({ stats: [{ moves: 0, captures: 0, sixes: 0 }] })) === null);
  check("save: rejects a negative gameKey", parseSavedLocalGame(makeSave({ gameKey: -1 })) === null);
  check("save: rejects a zero startedAt", parseSavedLocalGame(makeSave({ startedAt: 0 })) === null);
  check("save: rejects a zero savedAt", parseSavedLocalGame(makeSave({ savedAt: 0 })) === null);
  check("isValidLudoState: accepts a fresh game, rejects garbage",
    isValidLudoState(createGame(4)) && !isValidLudoState(null) && !isValidLudoState({}) &&
    !isValidLudoState({ ...createGame(4), sixes: -1 }));
  memStore.clear();
  check("save storage: empty store loads null", loadSavedLocalGame() === null);
  const payload = makeSave();
  saveLocalGame(payload);
  const loaded = loadSavedLocalGame();
  check("save storage: save then load round-trips", loaded !== null && JSON.stringify(loaded) === JSON.stringify(payload));
  clearSavedLocalGame();
  check("save storage: clear removes the save", loadSavedLocalGame() === null);
  memStore.set("ssc:ludo:local-save", "{broken");
  check("save storage: corrupted JSON loads null", loadSavedLocalGame() === null);
  memStore.set("ssc:ludo:local-save", JSON.stringify({ version: 99 }));
  check("save storage: wrong shape loads null", loadSavedLocalGame() === null);
  memStore.clear();
}

{
  /* Without a window, storage helpers degrade silently. */
  delete globalThis.window;
  let threw = false;
  try {
    loadLocalSettings();
    saveLocalSettings({ ...DEFAULT_LOCAL_SETTINGS });
    loadSavedLocalGame();
    saveLocalGame(makeSave());
    clearSavedLocalGame();
  } catch {
    threw = true;
  }
  check("storage helpers never throw without a window", !threw && loadLocalSettings() !== null && loadSavedLocalGame() === null);
}

/* --- local-game state machine --- */
console.log("local-game state machine:");
{
  const settings = { ...DEFAULT_LOCAL_SETTINGS, rules: { ...CLASSIC_RULES } };
  const c1 = createLocalController(1, settings, 11, 5000);
  check("controller: 1P mode seats 4 players (human + 3 AI)", c1.game.players.length === 4 && c1.humans === 1);
  check("controller: rules stored in the game state", JSON.stringify(c1.game.rules) === JSON.stringify(CLASSIC_RULES));
  check("controller: stats start at zero", c1.stats.length === 4 && c1.stats.every((s) => s.moves === 0 && s.captures === 0 && s.sixes === 0));
  check("controller: lastEvent is started", c1.lastEvent !== null && c1.lastEvent.kind === "started");
  const c3 = createLocalController(3, settings, 12, 5000);
  check("controller: 3P mode seats exactly 3 humans", c3.game.players.length === 3 && c3.humans === 3);
  check("isAiSeat: 1P seats 1-3 are AI, seat 0 is human", !isAiSeat(c1, 0) && isAiSeat(c1, 1) && isAiSeat(c1, 2) && isAiSeat(c1, 3));
  check("isAiSeat: pass-and-play has no AI seats", [0, 1, 2].every((s) => !isAiSeat(c3, s)));
  const counted = craft([["red", [57, 57, -1, 10]], ["green", [-1, -1, -1, -1]]]);
  check("tokensHome/tokensInBase count correctly", tokensHome(counted, 0) === 2 && tokensInBase(counted, 0) === 1 && tokensInBase(counted, 1) === 4);
}
{
  const settings = { ...DEFAULT_LOCAL_SETTINGS, rules: { ...CLASSIC_RULES } };
  const fresh = () => createLocalController(1, settings, 21, 5000);
  const rolling = localReducer(fresh(), { type: "beginRoll", value: 6 });
  check("beginRoll: accepted in the roll phase", rolling.rolling === true && rolling.pendingRoll === 6 && rolling.game.phase === "roll");
  check("beginRoll: double roll rejected (identical state)", localReducer(rolling, { type: "beginRoll", value: 3 }) === rolling);
  const c0 = fresh();
  check("beginRoll: 0 and 7 leave the state untouched", localReducer(c0, { type: "beginRoll", value: 0 }) === c0 && localReducer(c0, { type: "beginRoll", value: 7 }) === c0);
  check("settleRoll: rejected when not rolling", localReducer(c0, { type: "settleRoll" }) === c0);
  const settled = localReducer(rolling, { type: "settleRoll" });
  check("settleRoll: applies the roll and clears the flag", settled.game.phase === "move" && settled.game.roll === 6 && settled.rolling === false && settled.pendingRoll === null);
  check("settleRoll: a 6 counts in the sixes stat", settled.stats[0].sixes === 1);
  check("settleRoll: rolling event recorded", settled.lastEvent.kind === "rolled" && settled.lastEvent.value === 6);
  check("move: rejected in the roll phase", localReducer(c0, { type: "move", token: 0 }) === c0);
  check("move: rejected while rolling", localReducer(rolling, { type: "move", token: 0 }) === rolling);
  check("move: illegal token rejected", localReducer(settled, { type: "move", token: 9 }) === settled);
  const moved = localReducer(settled, { type: "move", token: 0 });
  check("move: accepted, animating set, stats counted", moved.animating === true && moved.stats[0].moves === 1 && moved.game.players[0].tokens[0] === 0);
  check("move: rejected while animating", localReducer(moved, { type: "move", token: 1 }) === moved);
  check("beginRoll: rejected while animating", localReducer(moved, { type: "beginRoll", value: 3 }) === moved);
  check("animationDone: no-op when not animating", localReducer(c0, { type: "animationDone" }) === c0);
  const done = localReducer(moved, { type: "animationDone" });
  check("animationDone: clears the lock", done.animating === false && done.game === moved.game);
  const noMoveState = localReducer(localReducer(fresh(), { type: "beginRoll", value: 3 }), { type: "settleRoll" });
  check("pass: rejected while legal moves exist", localReducer(settled, { type: "pass" }) === settled);
  const passed = localReducer(noMoveState, { type: "pass" });
  check("pass: accepted with no legal moves, turn advances", passed.game.turn === 1 && passed.game.phase === "roll" && passed.lastEvent.kind === "passed");
}
{
  /* Three-six forfeit through the whole machine. */
  const settings = { ...DEFAULT_LOCAL_SETTINGS, rules: { ...CLASSIC_RULES } };
  let c = createLocalController(1, settings, 31, 5000);
  const play = (value, token) => {
    c = localReducer(c, { type: "beginRoll", value });
    c = localReducer(c, { type: "settleRoll" });
    if (token !== null && token !== undefined) {
      c = localReducer(c, { type: "move", token });
      c = localReducer(c, { type: "animationDone" });
    }
  };
  play(6, 0);
  play(6, 0);
  c = localReducer(c, { type: "beginRoll", value: 6 });
  c = localReducer(c, { type: "settleRoll" });
  check("reducer: third six forfeits via the machine", c.game.turn === 1 && c.game.sixes === 0 && c.lastEvent.kind === "forfeit");
  check("reducer: sixes stat counted all three sixes", c.stats[0].sixes === 3);
}
{
  /* Capture counting through the machine. */
  const settings = { ...DEFAULT_LOCAL_SETTINGS, rules: { ...CLASSIC_RULES } };
  let c = createLocalController(2, settings, 41, 5000);
  c = { ...c, game: withRules(craft([["red", [4, -1, -1, -1]], ["green", [44, -1, -1, -1]]], 0, "roll", null), CLASSIC_RULES) };
  c = localReducer(c, { type: "beginRoll", value: 1 });
  c = localReducer(c, { type: "settleRoll" });
  c = localReducer(c, { type: "move", token: 0 });
  check("reducer: capture counted in stats and event", c.stats[0].captures === 1 && c.stats[0].moves === 1 && c.lastEvent.kind === "moved" && c.lastEvent.captured === true);
  check("reducer: capture keeps the turn with the bonus", c.game.turn === 0 && c.game.lastBonus === "capture");
}
{
  /* autoPlayTurn. */
  const settings = { ...DEFAULT_LOCAL_SETTINGS, rules: { ...CLASSIC_RULES } };
  const c = createLocalController(1, settings, 51, 5000);
  const actions = autoPlayTurn(c, () => 6);
  check("autoPlayTurn: roll phase yields begin/settle/move", actions.length === 3 && actions[0].type === "beginRoll" && actions[0].value === 6 && actions[1].type === "settleRoll" && actions[2].type === "move");
  const noMoves = localReducer(localReducer(c, { type: "beginRoll", value: 3 }), { type: "settleRoll" });
  const passActions = autoPlayTurn(noMoves, () => 3);
  check("autoPlayTurn: no legal moves yields a pass", passActions.length === 1 && passActions[0].type === "pass");
  const finished = { ...c, game: { ...c.game, phase: "finished", winner: 0 } };
  check("autoPlayTurn: finished/rolling/animating yield nothing",
    autoPlayTurn(finished, () => 6).length === 0 &&
    autoPlayTurn({ ...c, rolling: true, pendingRoll: 6 }, () => 6).length === 0 &&
    autoPlayTurn({ ...c, animating: true }, () => 6).length === 0);
  check("autoPlayTurn: an invalid die value yields nothing", autoPlayTurn(c, () => 7).length === 0 && autoPlayTurn(c, () => 0).length === 0);
}
{
  /* Turn rotation in pass-and-play, determinism, newGame/restore actions. */
  const settings = { ...DEFAULT_LOCAL_SETTINGS, rules: { ...CLASSIC_RULES } };
  let c = createLocalController(3, settings, 61, 5000);
  const turns = [];
  for (let round = 0; round < 3; round++) {
    turns.push(c.game.turn);
    c = localReducer(c, { type: "beginRoll", value: 3 });
    c = localReducer(c, { type: "settleRoll" });
    c = localReducer(c, { type: "pass" });
  }
  check("reducer: 3P turns rotate 0 -> 1 -> 2 -> 0", turns.join(",") === "0,1,2" && c.game.turn === 0);
  const script = [
    { type: "beginRoll", value: 6 },
    { type: "settleRoll" },
    { type: "move", token: 0 },
    { type: "animationDone" },
    { type: "beginRoll", value: 4 },
    { type: "settleRoll" },
    { type: "move", token: 0 },
    { type: "animationDone" },
  ];
  const run = () => script.reduce((acc, a) => localReducer(acc, a), createLocalController(2, settings, 71, 5000));
  const r1 = run();
  const r2 = run();
  check("reducer: the same actions replay identically", JSON.stringify(r1) === JSON.stringify(r2));
  const replaced = localReducer(r1, { type: "newGame", humans: 4, settings, gameKey: 72, startedAt: 6000 });
  check("reducer: newGame starts fresh with the new key", replaced.game.move_no === 0 && replaced.gameKey === 72 && replaced.game.players.length === 4);
  const saved = parseSavedLocalGame(JSON.parse(JSON.stringify(makeSave())));
  const restored = localReducer(r1, { type: "restore", saved });
  check("reducer: restore action rebuilds the controller from a save",
    restored.gameKey === 7 && restored.humans === 1 && restored.rolling === false && restored.animating === false && restored.lastEvent.kind === "restored");
  const direct = restoreLocalController(saved);
  check("restoreLocalController: fields match the save", direct.startedAt === 1000 && direct.game.players.length === 4 && direct.settings.animationSpeed === saved.settings.animationSpeed);
}

rmSync(OUT, { recursive: true, force: true });

console.log(`\n${count - failures}/${count} checks passed.`);
if (failures > 0) {
  console.log(`${failures} FAILURES`);
  process.exit(1);
}
console.log("All Ludo checks passed.");
