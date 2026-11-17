/* Arrows Out level check — proves every shipped level is solvable.
 *
 * Run:  node scripts/check-arrows-levels.mjs
 *
 * Compiles the REAL solver + REAL level data with the project's own
 * TypeScript compiler into a temp dir, then runs the checks against
 * the compiled output — no duplicated logic, no hand-copied boards.
 * Exits non-zero if any level is ragged, unstartable, unsolvable,
 * duplicated, or the size plan drifts.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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
const { ARROWS_LEVELS } = require(join(OUT, "levels.js"));
rmSync(OUT, { recursive: true, force: true });

const { parseGrid, countArrows, findClearableArrow, isSolvable } = solver;

// Size plan: 4x4 (1-5), 5x5 (6-12), 6x6 (13-20), 7x7 (21-26), 8x8 (27-30).
const EXPECTED_SIZES = [
  ...Array(5).fill(4),
  ...Array(7).fill(5),
  ...Array(8).fill(6),
  ...Array(6).fill(7),
  ...Array(4).fill(8),
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
  let board;
  try {
    board = parseGrid(level.rows);
  } catch (err) {
    fail(`${label}: unparsable grid — ${err.message}`);
    return;
  }
  if (board.length !== expectedSize) {
    fail(`${label}: expected ${expectedSize}x${expectedSize}, got ${board.length}x${board.length}`);
    return;
  }
  const key = level.rows.join("\n");
  if (seen.has(key)) fail(`${label}: duplicate board`);
  seen.add(key);
  const arrows = countArrows(board);
  if (arrows === 0) fail(`${label}: no arrows on the board`);
  const first = findClearableArrow(board);
  if (!first) fail(`${label}: no arrow is clearable at the start`);
  if (!isSolvable(board)) fail(`${label}: UNSOLVABLE`);
  console.log(
    `${label} ${board.length}x${board.length} arrows=${arrows} ` +
      `clearable-at-start=${first ? "yes" : "no"} solvable=${isSolvable(board) ? "YES" : "NO"}`,
  );
});

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${ARROWS_LEVELS.length} levels solvable.`);
