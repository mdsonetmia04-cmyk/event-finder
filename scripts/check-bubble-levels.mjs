/* Bubble Shooter level check — proves every shipped level is valid
 * and the headless sim runs it without errors.
 *
 * Run:  node scripts/check-bubble-levels.mjs
 *
 * Compiles the REAL grid/matcher/level/engine sources with the
 * project's own TypeScript compiler into a temp dir, then runs the
 * checks against the compiled output — no duplicated logic, no
 * hand-copied boards. Exits non-zero if any level is mis-numbered,
 * breaks the difficulty/colour/theme curve, generates a
 * non-deterministic or orphaned board, misses the 3-per-colour floor,
 * duplicates another board, or crashes the engine smoke test.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = mkdtempSync(join(tmpdir(), "bubble-check-"));
try {
  execFileSync(
    join(ROOT, "node_modules", ".bin", "tsc"),
    [
      join(ROOT, "src", "lib", "bubble-shooter", "tuning.ts"),
      join(ROOT, "src", "lib", "bubble-shooter", "rng.ts"),
      join(ROOT, "src", "lib", "bubble-shooter", "grid.ts"),
      join(ROOT, "src", "lib", "bubble-shooter", "matcher.ts"),
      join(ROOT, "src", "lib", "bubble-shooter", "levels.ts"),
      join(ROOT, "src", "lib", "bubble-shooter", "engine.ts"),
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
} catch (err) {
  console.error("FAIL: could not compile the Bubble Shooter sources:");
  console.error(err.stdout?.toString() ?? err.message);
  process.exit(1);
}

const require = createRequire(import.meta.url);
const { TUNING } = require(join(OUT, "tuning.js"));
const { findOrphans, colorCounts } = require(join(OUT, "matcher.js"));
const { BUBBLE_LEVELS, levelDifficulty, generateBoard } = require(join(OUT, "levels.js"));
const { BubbleEngine } = require(join(OUT, "engine.js"));
rmSync(OUT, { recursive: true, force: true });

// Curve plan: colours 3 (1-5), 4 (6-10), 5 (11-20), 6 (21-30);
// themes dawn (1-10), neon (11-20), deep (21-30); boss layouts at
// 10 (rings), 20 (heart), 30 (star).
const EXPECTED_COLORS = [
  ...Array(5).fill(3),
  ...Array(5).fill(4),
  ...Array(10).fill(5),
  ...Array(10).fill(6),
];
const EXPECTED_THEMES = [
  ...Array(10).fill("dawn"),
  ...Array(10).fill("neon"),
  ...Array(10).fill("deep"),
];
const BOSS_LEVELS = new Set([10, 20, 30]);

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`FAIL: ${msg}`);
};

if (BUBBLE_LEVELS.length !== 30) {
  fail(`expected 30 levels, found ${BUBBLE_LEVELS.length}`);
}

const seenBoards = new Set();
const seenSeeds = new Set();

BUBBLE_LEVELS.forEach((level, i) => {
  const label = `L${String(level.n).padStart(2, "0")}`;
  if (level.n !== i + 1) {
    fail(`${label}: levels must be numbered 1..30 in order (found n=${level.n} at index ${i})`);
    return;
  }
  const expectedDifficulty = level.n <= 10 ? "normal" : level.n <= 20 ? "hard" : "superHard";
  if (levelDifficulty(level.n) !== expectedDifficulty) {
    fail(`${label}: difficulty band mismatch`);
    return;
  }
  if (level.colorCount !== EXPECTED_COLORS[i]) {
    fail(`${label}: expected ${EXPECTED_COLORS[i]} colours, got ${level.colorCount}`);
    return;
  }
  if (level.theme !== EXPECTED_THEMES[i]) {
    fail(`${label}: expected theme ${EXPECTED_THEMES[i]}, got ${level.theme}`);
    return;
  }
  if (BOSS_LEVELS.has(level.n) !== Boolean(level.layout)) {
    fail(`${label}: boss layout ${level.layout ? "present" : "missing"} (expected ${BOSS_LEVELS.has(level.n) ? "present" : "absent"})`);
    return;
  }
  if (seenSeeds.has(level.seed)) fail(`${label}: duplicate seed ${level.seed}`);
  seenSeeds.add(level.seed);
  if (level.initialRows < 4 || level.initialRows > 8) {
    fail(`${label}: initialRows ${level.initialRows} outside 4..8`);
    return;
  }
  if (level.fillDensity < 0.85 || level.fillDensity > 1) {
    fail(`${label}: fillDensity ${level.fillDensity} outside 0.85..1.0`);
    return;
  }
  if (level.pushInterval < 5 || level.pushInterval > 8) {
    fail(`${label}: pushInterval ${level.pushInterval} outside 5..8`);
    return;
  }
  if (!(level.starThreshold2 > 0 && level.starThreshold2 < level.starThreshold3)) {
    fail(`${label}: star thresholds not ordered (${level.starThreshold2}/${level.starThreshold3})`);
    return;
  }

  // Generation: deterministic, anchored, colour floor, no duplicates.
  let first;
  let second;
  try {
    first = generateBoard(level);
    second = generateBoard(level);
  } catch (err) {
    fail(`${label}: board generation threw — ${err.message}`);
    return;
  }
  const serialise = (cells) =>
    [...cells.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
  const serial = serialise(first.cells);
  if (serial !== serialise(second.cells)) {
    fail(`${label}: board generation is not deterministic`);
    return;
  }
  if (seenBoards.has(serial)) fail(`${label}: duplicate board`);
  seenBoards.add(serial);
  if (first.parity !== 0) fail(`${label}: starting parity must be 0, got ${first.parity}`);
  const orphans = findOrphans(first.cells, first.parity, TUNING.GRID_COLS);
  if (orphans.length > 0) {
    fail(`${label}: ${orphans.length} orphaned ball(s) at start (first: row ${orphans[0].row}, col ${orphans[0].col})`);
  }
  const counts = colorCounts(first.cells);
  for (let c = 0; c < level.colorCount; c++) {
    const count = counts.get(c) ?? 0;
    if (count < 3) fail(`${label}: colour ${c} appears only ${count} time(s) (floor is 3)`);
  }
  for (const c of counts.keys()) {
    if (c >= level.colorCount) fail(`${label}: colour ${c} outside the level palette`);
  }
  if (first.cells.size < 12) fail(`${label}: only ${first.cells.size} balls on the board (too few)`);
  if (first.cells.size > 64) fail(`${label}: ${first.cells.size} balls on the board (too many)`);

  // Engine smoke test: three aimed shots must resolve cleanly, the
  // swap must work, and no NaN may ever appear in the projectile.
  try {
    const engine = new BubbleEngine(level);
    const events = [];
    engine.onEvent((e) => events.push(e.type));
    if (engine.chamber < 0 || engine.chamber >= level.colorCount) {
      fail(`${label}: chamber colour ${engine.chamber} outside the palette`);
    }
    const chamberBefore = engine.chamber;
    const nextBefore = engine.next;
    engine.swap();
    if (engine.chamber !== nextBefore || engine.next !== chamberBefore) {
      fail(`${label}: swap did not exchange chamber and next`);
    }
    const angles = [-0.6, 0.15, 0.7];
    for (const angle of angles) {
      if (engine.phase === "won" || engine.phase === "failed") break;
      engine.setAim(angle);
      if (!engine.fire()) {
        fail(`${label}: fire() refused at angle ${angle} in phase ${engine.phase}`);
        break;
      }
      let steps = 0;
      while (engine.phase === "flying" && steps < 4000) {
        engine.fixedUpdate(TUNING.SIM_DT);
        steps++;
        const p = engine.projectile;
        if (p && (!Number.isFinite(p.x) || !Number.isFinite(p.y))) {
          fail(`${label}: projectile went NaN`);
          break;
        }
      }
      if (engine.phase === "resolving") engine.finishResolving();
      if (engine.phase !== "aiming" && engine.phase !== "won" && engine.phase !== "failed") {
        fail(`${label}: stuck in phase ${engine.phase} after ${steps} steps`);
        break;
      }
    }
    if (!events.includes("stick") && !events.includes("refund")) {
      fail(`${label}: no stick/refund event fired during the smoke test`);
    }
  } catch (err) {
    fail(`${label}: engine smoke test threw — ${err.message}`);
  }

  console.log(
    `${label} colours=${level.colorCount} rows=${level.initialRows} density=${level.fillDensity} ` +
      `push=${level.pushInterval} balls=${first.cells.size} stars=${level.starThreshold2}/${level.starThreshold3} ` +
      `theme=${level.theme}${level.layout ? " boss" : ""} anchored=${orphans.length === 0 ? "YES" : "NO"}`,
  );
});

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${BUBBLE_LEVELS.length} levels valid, anchored and smoke-tested.`);
