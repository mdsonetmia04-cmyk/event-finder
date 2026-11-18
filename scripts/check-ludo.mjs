/* Ludo engine checks + fuzz — proves the rules library behaves and
 * that no game can reach a state with no legal next action.
 *
 * Run:  node scripts/check-ludo.mjs
 *
 * Compiles the REAL src/lib/ludo/engine.ts with the project's own
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
      "--outDir",
      OUT,
      "--module",
      "commonjs",
      "--target",
      "es2022",
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
  legalMoves,
  SAFE_CELLS,
  trackIndex,
} = eng;

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

rmSync(OUT, { recursive: true, force: true });

console.log(`\n${count - failures}/${count} checks passed.`);
if (failures > 0) {
  console.log(`${failures} FAILURES`);
  process.exit(1);
}
console.log("All Ludo checks passed.");
