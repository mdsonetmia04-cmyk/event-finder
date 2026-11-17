/* Arrows Out level check — proves every shipped maze level is valid
 * and solvable.
 *
 * Run:  node scripts/check-arrows-levels.mjs
 *
 * Compiles the REAL solver + REAL level data with the project's own
 * TypeScript compiler into a temp dir, then runs the checks against
 * the compiled output — no duplicated logic, no hand-copied boards.
 * Exits non-zero if any level is unparsable, has shared cells or a
 * self-intersecting path, is unstartable, unsolvable, duplicated,
 * missing head directions, or the size plan drifts.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = mkdtempSync(join(tmpdir(), "arrows-check-"));
try {
  execFileSync(
    join(ROOT, "node_modules", ".bin", "tsc"),
    [
      join(ROOT, "src", "lib", "arrows-out", "solver.ts"),
      join(ROOT, "src", "lib", "arrows-out", "levels.ts"),
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
  console.error("FAIL: could not compile the Arrows Out sources:");
  console.error(err.stdout?.toString() ?? err.message);
  process.exit(1);
}

const require = createRequire(import.meta.url);
const solver = require(join(OUT, "solver.js"));
const { ARROWS_LEVELS, levelDifficulty } = require(join(OUT, "levels.js"));
rmSync(OUT, { recursive: true, force: true });

const { parseLevel, countCells, removableArrows, isSolvable, headCell } = solver;

// Size plan: 8x8 (1-5), 10x10 (6-12), 12x12 (13-20), 14x14 (21-26),
// 16x16 (27-30).
const EXPECTED_SIZES = [
  ...Array(5).fill(8),
  ...Array(7).fill(10),
  ...Array(8).fill(12),
  ...Array(6).fill(14),
  ...Array(4).fill(16),
];

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`FAIL: ${msg}`);
};

if (ARROWS_LEVELS.length !== 30) {
  fail(`expected 30 levels, found ${ARROWS_LEVELS.length}`);
}

const seen = new Set();
ARROWS_LEVELS.forEach((level, i) => {
  const label = `L${String(level.n).padStart(2, "0")}`;
  if (level.n !== i + 1) {
    fail(`${label}: levels must be numbered 1..30 in order (found n=${level.n} at index ${i})`);
    return;
  }
  const expectedSize = EXPECTED_SIZES[i];
  if (level.size !== expectedSize) {
    fail(`${label}: expected size ${expectedSize}, got ${level.size}`);
    return;
  }
  const expectedDifficulty = level.n <= 10 ? "normal" : level.n <= 20 ? "hard" : "superHard";
  if (levelDifficulty(level.n) !== expectedDifficulty) {
    fail(`${label}: difficulty band mismatch`);
    return;
  }
  let arrows;
  try {
    arrows = parseLevel(level.arrows, level.size);
  } catch (err) {
    fail(`${label}: unparsable level — ${err.message}`);
    return;
  }
  const key = JSON.stringify(level.arrows);
  if (seen.has(key)) fail(`${label}: duplicate level`);
  seen.add(key);
  if (arrows.length === 0) fail(`${label}: no arrows on the board`);
  for (const arrow of arrows) {
    if (arrow.cells.length < 2 || arrow.cells.length > 12) {
      fail(`${label}: arrow ${arrow.id} has ${arrow.cells.length} cells (expected 2..12)`);
    }
  }
  const dirs = new Set(arrows.map((a) => a.headDir));
  const needDirs = arrows.length >= 8 ? 4 : 3;
  if (dirs.size < needDirs) {
    fail(`${label}: only ${dirs.size} head directions present (expected >= ${needDirs})`);
  }
  const clearable = removableArrows(arrows, level.size, new Set());
  if (clearable.length === 0) fail(`${label}: no arrow is removable at the start`);
  if (clearable.length > Math.ceil(arrows.length / 2)) {
    fail(`${label}: ${clearable.length}/${arrows.length} arrows removable at the start (too open)`);
  }
  const solvable = isSolvable(arrows, level.size);
  if (!solvable) fail(`${label}: UNSOLVABLE`);
  // Sanity: every head cell is the last cell of its path.
  for (const arrow of arrows) {
    const head = headCell(arrow);
    const last = arrow.cells[arrow.cells.length - 1];
    if (head.row !== last.row || head.col !== last.col) fail(`${label}: arrow ${arrow.id} head mismatch`);
  }
  console.log(
    `${label} ${level.size}x${level.size} arrows=${arrows.length} cells=${countCells(arrows)} ` +
      `clearable-at-start=${clearable.length} dirs=${dirs.size} solvable=${solvable ? "YES" : "NO"}`,
  );
});

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${ARROWS_LEVELS.length} levels solvable.`);
