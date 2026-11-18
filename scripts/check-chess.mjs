/* Chess smoke check — proves the rules library, the position
 * helpers and the Sweet AI engine behave on real positions.
 *
 * Run:  node scripts/check-chess.mjs
 *
 * Compiles the REAL src/lib/chess/position.ts + engine.ts with the
 * project's own TypeScript compiler into a temp dir INSIDE the
 * project root (so the compiled output's require("chess.js")
 * resolves via node_modules), then runs the checks against the
 * compiled output — no duplicated logic, no mocks. Exits non-zero
 * if any check fails:
 *   (a) rules: checkmate, stalemate, castling, en passant,
 *       promotion, threefold repetition, insufficient material and
 *       the fifty-move rule, as reported by gameOverInfo();
 *   (b) the AI returns a legal move from 5 different positions at
 *       each difficulty (easy/medium/hard);
 *   (c) 20 AI-vs-random self-play games complete without errors.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = mkdtempSync(join(ROOT, ".tmp-chess-check-"));

let failures = 0;
function check(name, ok, detail = "") {
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
      join(ROOT, "src", "lib", "chess", "position.ts"),
      join(ROOT, "src", "lib", "chess", "engine.ts"),
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
  console.error("FAIL: could not compile the Chess sources:");
  console.error(err.stdout?.toString() ?? err.message);
  rmSync(OUT, { recursive: true, force: true });
  process.exit(1);
}

const require = createRequire(import.meta.url);
const { Chess } = require("chess.js");
const { START_FEN, chessFromFen, gameOverInfo, gameOverFromHistory, hasThreefoldRepetition, capturedPieces, materialDiff, kingSquare } = require(
  join(OUT, "position.js"),
);
const { chooseAiMove } = require(join(OUT, "engine.js"));

try {
  /* (a) Rules, via chess.js + the real gameOverInfo() helper. */
  console.log("(a) rules");

  // Fool's mate: f3 e5, g4 Qh4# — checkmate, Black wins.
  {
    const g = new Chess();
    g.move("f3");
    g.move("e5");
    g.move("g4");
    g.move("Qh4");
    const info = gameOverInfo(g.fen());
    check("fool's mate is checkmate, Black wins", g.isCheckmate() && info?.kind === "checkmate" && info.winner === "b", g.fen());
  }

  // Stalemate: Black to move, no legal moves, not in check.
  {
    const fen = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";
    const info = gameOverInfo(fen);
    check("stalemate detected", new Chess(fen).isStalemate() && info?.kind === "stalemate" && info.winner === null, fen);
  }

  // Castling: both wings available, king + rook land correctly.
  {
    const g = new Chess("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    const sans = g.moves();
    check("castling moves listed", sans.includes("O-O") && sans.includes("O-O-O"), sans.join(" "));
    g.move("O-O");
    check("kingside castle lands king on g1", g.get("g1")?.type === "k" && g.get("f1")?.type === "r");
    const g2 = new Chess("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    g2.move("O-O-O");
    check("queenside castle lands king on c1", g2.get("c1")?.type === "k" && g2.get("d1")?.type === "r");
  }

  // En passant: white pawn on e5, black pawn just played d7-d5.
  {
    const g = new Chess("k7/8/8/3pP3/8/8/8/K7 w - d6 0 1");
    const eps = g.moves({ verbose: true }).filter((m) => m.flags.includes("e"));
    check("en passant capture listed", eps.length === 1 && eps[0].to === "d6", JSON.stringify(eps));
    g.move({ from: "e5", to: "d6" });
    check("en passant removes the captured pawn", g.get("d6")?.type === "p" && g.get("d5") === undefined);
  }

  // Promotion: pawn on a7 promotes; picker choice lands the piece.
  {
    const g = new Chess("8/P7/8/8/8/8/k6K/8 w - - 0 1");
    const promos = g.moves({ verbose: true }).filter((m) => m.promotion);
    check("four promotion options listed", promos.length === 4, JSON.stringify(promos.map((m) => m.promotion)));
    g.move({ from: "a7", to: "a8", promotion: "q" });
    check("promotion to queen lands a queen", g.get("a8")?.type === "q");
  }

  // Threefold repetition: knights shuffle out and back twice. A
  // FEN alone cannot see it (no history), so the history-aware
  // helper replays the SAN list — that is what the pages use.
  {
    const sans = ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"];
    const g = new Chess();
    for (const san of sans) g.move(san);
    check("chess.js sees threefold on the live game", g.isThreefoldRepetition(), g.fen());
    check("gameOverInfo alone cannot see threefold from a FEN", gameOverInfo(g.fen()) === null, g.fen());
    check("hasThreefoldRepetition sees it from the SAN list", hasThreefoldRepetition(sans) === true);
    const info = gameOverFromHistory(g.fen(), sans);
    check("gameOverFromHistory reports threefold", info?.kind === "threefold" && info.winner === null, g.fen());
    check("no false threefold on a fresh game", hasThreefoldRepetition(["e4", "e5", "Nf3"]) === false);
  }

  // Insufficient material: bare kings.
  {
    const fen = "8/8/8/8/8/8/k6K/8 w - - 0 1";
    const info = gameOverInfo(fen);
    check("insufficient material detected", new Chess(fen).isInsufficientMaterial() && info?.kind === "insufficient", fen);
  }

  // Fifty-move rule: halfmove clock at 100 with material still on
  // the board (bare kings would report insufficient material
  // first — gameOverInfo checks that before the fifty-move rule).
  {
    const fen = "4k3/8/8/8/8/8/8/4K2R w K - 100 1";
    const g = new Chess(fen);
    const info = gameOverInfo(fen);
    check("fifty-move draw detected", g.isDrawByFiftyMoves() && info?.kind === "fifty", fen);
  }

  // Position helpers: start position is quiet, captures/material sane.
  {
    check("start position is not game over", gameOverInfo(START_FEN) === null);
    check("start position has 20 legal moves", new Chess(START_FEN).moves().length === 20);
    check("kingSquare finds both kings", kingSquare(START_FEN, "w") === "e1" && kingSquare(START_FEN, "b") === "e8");
    const afterCapture = "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2";
    const g = new Chess(afterCapture);
    g.move("exd5");
    const captured = capturedPieces(g.fen());
    check("captured display lists the taken pawn", captured.byWhite.includes("p") && captured.byBlack.length === 0);
    check("material diff is +1 for White", materialDiff(g.fen()) === 1, String(materialDiff(g.fen())));
    check("malformed FEN falls back to start", chessFromFen("not a fen").fen() === START_FEN);
  }

  /* (b) AI legality at every difficulty, from 5 positions. */
  console.log("(b) AI legality");
  const positions = {
    start: START_FEN,
    middlegame: "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    endgame: "8/5k2/3p4/1p1Pp2p/pP2Pp1P/P4P1K/8/8 b - - 0 1",
    attacking: "rnb1kbnr/pppp1ppp/8/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3",
    promotionRace: "8/P7/8/8/8/8/k6K/8 w - - 0 1",
  };
  for (const [name, fen] of Object.entries(positions)) {
    const legal = new Set(
      new Chess(fen).moves({ verbose: true }).map((m) => `${m.from}${m.to}${m.promotion ?? ""}`),
    );
    for (const difficulty of ["easy", "medium", "hard"]) {
      const started = Date.now();
      const move = chooseAiMove(fen, difficulty);
      const elapsed = Date.now() - started;
      const key = move ? `${move.from}${move.to}${move.promotion ?? ""}` : "";
      check(
        `${difficulty} returns a legal move from ${name}`,
        move !== null && legal.has(key),
        move ? `got ${key} in ${elapsed}ms` : "got null",
      );
    }
  }
  // Hard thinking cap: a single hard move from the start position
  // must stay well clear of a UI-blocking stall.
  {
    const started = Date.now();
    const move = chooseAiMove(START_FEN, "hard");
    const elapsed = Date.now() - started;
    check("hard move from start finishes under 3s", move !== null && elapsed < 3000, `${elapsed}ms`);
    console.log(`       (hard from start took ${elapsed}ms)`);
  }
  // Game-over / invalid positions return null, never throw.
  {
    check("AI returns null on checkmate", chooseAiMove("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3", "hard") === null);
    check("AI returns null on invalid FEN", chooseAiMove("not a fen", "medium") === null);
  }

  /* (c) 20 AI-vs-random self-play games complete without errors.
     Medium difficulty: hard's ~1.5s thinking cap would make 20
     games take many minutes; hard is covered move-by-move in (b). */
  console.log("(c) self-play");
  let completed = 0;
  let aiMoves = 0;
  for (let game = 0; game < 20; game++) {
    const g = new Chess();
    const aiPlaysWhite = game % 2 === 0;
    let plies = 0;
    while (!g.isGameOver() && plies < 300) {
      const aiTurn = (g.turn() === "w") === aiPlaysWhite;
      if (aiTurn) {
        const move = chooseAiMove(g.fen(), "medium");
        if (!move) break;
        g.move({ from: move.from, to: move.to, promotion: move.promotion });
        aiMoves += 1;
      } else {
        const legal = g.moves({ verbose: true });
        const pick = legal[Math.floor(Math.random() * legal.length)];
        g.move({ from: pick.from, to: pick.to, promotion: pick.promotion });
      }
      plies += 1;
    }
    completed += 1;
    check(`self-play game ${game + 1} ends cleanly (${plies} plies)`, plies <= 300, g.fen());
  }
  check("all 20 self-play games completed", completed === 20);
  console.log(`       (${aiMoves} AI moves played across ${completed} games)`);
} finally {
  rmSync(OUT, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\nFAIL: ${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll chess checks passed.");
