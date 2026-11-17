import type { Board } from "./solver";
import { parseGrid } from "./solver";

export interface ArrowsLevel {
  /** 1-based level number. */
  n: number;
  /** One string per row; `^` `v` `<` `>` arrows, `.` empty. */
  rows: string[];
}

/* 30 levels, difficulty rising: 4x4 (1-5), 5x5 (6-12), 6x6 (13-20),
   7x7 (21-26), 8x8 (27-30), with arrow density rising within each
   size. Every level is proven solvable by scripts/check-arrows-levels.mjs
   (greedy solver: repeatedly remove any arrow with a clear lane).
   Boards were generated with a seeded sampler and filtered for
   solvability + a bounded number of initially-clearable arrows, so
   each level needs real thought about the removal order. */
export const ARROWS_LEVELS: ArrowsLevel[] = [
  {
    n: 1,
    rows: [
      ".<..",
      "v...",
      "..>>",
      ">..^",
    ],
  },
  {
    n: 2,
    rows: [
      ".>.^",
      "...^",
      ".^>.",
      ".^.^",
    ],
  },
  {
    n: 3,
    rows: [
      "....",
      ">v.v",
      "<<>v",
      "^...",
    ],
  },
  {
    n: 4,
    rows: [
      "v.<>",
      "v..^",
      ">>>.",
      "..v.",
    ],
  },
  {
    n: 5,
    rows: [
      ".v<<",
      "v.^.",
      "..^^",
      "v>.v",
    ],
  },
  {
    n: 6,
    rows: [
      ".....",
      ">.v>>",
      "....v",
      "^..v<",
      "...>v",
    ],
  },
  {
    n: 7,
    rows: [
      ">.^..",
      ".v.<.",
      ".v..v",
      ".v..v",
      "^.^.<",
    ],
  },
  {
    n: 8,
    rows: [
      "^.v^.",
      "^..^>",
      "^<...",
      "..>.>",
      "^.<..",
    ],
  },
  {
    n: 9,
    rows: [
      ">.v.>",
      "^..<<",
      "^....",
      "v.v^>",
      "v.v..",
    ],
  },
  {
    n: 10,
    rows: [
      ".v.v^",
      "^<.<.",
      "...<^",
      "^..>^",
      "v..<^",
    ],
  },
  {
    n: 11,
    rows: [
      ".<>.v",
      ".>v.>",
      ".^v^<",
      ".^..v",
      "v.<^.",
    ],
  },
  {
    n: 12,
    rows: [
      ">.^>^",
      "^>.^.",
      "^.^^.",
      ".>^v.",
      "<.<.^",
    ],
  },
  {
    n: 13,
    rows: [
      ".<.>.^",
      "...^<^",
      "....v.",
      "^..>..",
      "v...<>",
      ">^.>.^",
    ],
  },
  {
    n: 14,
    rows: [
      "^.<^..",
      "..v.<.",
      "vvv..<",
      "<vv...",
      "...>>^",
      "..v^<.",
    ],
  },
  {
    n: 15,
    rows: [
      "v.<<.^",
      ".<>>..",
      ".<<<<^",
      ".....v",
      "v<.v<.",
      "..^<.<",
    ],
  },
  {
    n: 16,
    rows: [
      "<.v.>>",
      "v.>>.>",
      "<v<.<<",
      "vv.<v.",
      "<.v.<.",
      "...^.^",
    ],
  },
  {
    n: 17,
    rows: [
      "....<<",
      ">v.^.>",
      "v.<^^<",
      "vv.>^.",
      "<v^v>>",
      "..v.<^",
    ],
  },
  {
    n: 18,
    rows: [
      "^v.>.v",
      ".<..^v",
      "^>.>^.",
      ".<>.^.",
      "v<<<v<",
      "v<>>v.",
    ],
  },
  {
    n: 19,
    rows: [
      "..<.v<",
      ".<>^v.",
      "^.<vv^",
      "^v..v<",
      "..^v>v",
      "^v<vvv",
    ],
  },
  {
    n: 20,
    rows: [
      "..>...",
      "^v<>.>",
      ".<>^>>",
      "^vv^<v",
      ">>>>.>",
      ">.v^^>",
    ],
  },
  {
    n: 21,
    rows: [
      ">..^...",
      "v.<....",
      "v.^..<<",
      "..v<.^>",
      ">^...v.",
      ".<<^<.v",
      "<v<<>>.",
    ],
  },
  {
    n: 22,
    rows: [
      "^.<^^>^",
      "...>^.^",
      ".v>.v..",
      "^v.<<.^",
      "...v.^<",
      "<<v.<>>",
      "...<..v",
    ],
  },
  {
    n: 23,
    rows: [
      "^>^.>.>",
      "^>...>^",
      ".>>v^>.",
      "^<.<<..",
      "v<..vvv",
      ">..>v.>",
      "..^..<v",
    ],
  },
  {
    n: 24,
    rows: [
      ".>v^v^>",
      "^..<>v.",
      "^>v^.v.",
      "^.>..>.",
      "v..v>v>",
      ".<.vv>.",
      "<..<>>^",
    ],
  },
  {
    n: 25,
    rows: [
      "<^<.^v.",
      "^v>>>>.",
      "<..^>..",
      "^<^<.>.",
      "<<.<>.^",
      "^.^.^<<",
      "^.^.>v^",
    ],
  },
  {
    n: 26,
    rows: [
      "^.>.v.>",
      "<>.v.^.",
      "<^<vv>>",
      "<>v>>^>",
      "^>vvv^^",
      ".>..>^.",
      ".>.vv.v",
    ],
  },
  {
    n: 27,
    rows: [
      "..^.^^v.",
      ".<.<^.v>",
      ".<<..>.^",
      "^v^>v...",
      "<...v.<^",
      "...<.^<<",
      "<..v.v.^",
      "^<<.>>.v",
    ],
  },
  {
    n: 28,
    rows: [
      "^<.....>",
      "<..<^<>.",
      "..vv>>vv",
      "..<.^<v>",
      "^^.<..>v",
      ".>.>>v..",
      "<.v>^..v",
      "vv<.<>vv",
    ],
  },
  {
    n: 29,
    rows: [
      ".^.^.^^.",
      "<.<^<^>^",
      ".>>^>..v",
      "....v.>v",
      ">^^v>..>",
      "^..v.>vv",
      "^^vv>>>>",
      "<.>>v^v.",
    ],
  },
  {
    n: 30,
    rows: [
      "vv^^>^.^",
      "v<..^v>>",
      "<.>>^.^>",
      "<<>v>>>^",
      "<<<.<>.^",
      "vv>>...>",
      ".<..>v.>",
      "v<v.>.>^",
    ],
  },
];

export function levelBoard(level: ArrowsLevel): Board {
  return parseGrid(level.rows);
}
