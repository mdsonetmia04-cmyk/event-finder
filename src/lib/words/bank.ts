/* Word Meaning Battle — word bank types, aggregation and draw helpers.
   ~300 words in 3 levels × 100, each entry: id, word, correct Bangla
   meaning, 3 distractors, example sentence, level, domain. */

import { BASIC_WORDS } from "./bank-basic";
import { INTERMEDIATE_WORDS } from "./bank-intermediate";
import { ADVANCED_WORDS } from "./bank-advanced";

export type WordLevel = "basic" | "intermediate" | "advanced";
export type WordDomain = "stock" | "general";

export interface WordEntry {
  id: string;
  word: string;
  /** Correct Bangla meaning. */
  meaning: string;
  /** Exactly 3 plausible but clearly-wrong Bangla meanings. */
  distractors: string[];
  /** One short English example sentence. */
  example: string;
  level: WordLevel;
  domain: WordDomain;
}

/** A drawn battle question: the entry plus the shuffled display order
    of the 4 options. order[i] is the index into
    [meaning, ...distractors] shown at display slot i. */
export interface WordBattleQuestion {
  entry: WordEntry;
  order: number[]; // permutation of [0,1,2,3]
}

export const WORD_BANK: WordEntry[] = [
  ...BASIC_WORDS,
  ...INTERMEDIATE_WORDS,
  ...ADVANCED_WORDS,
];

export function wordsByLevel(level: WordLevel): WordEntry[] {
  return WORD_BANK.filter((w) => w.level === level);
}

export function wordById(id: string): WordEntry | undefined {
  return WORD_BANK.find((w) => w.id === id);
}

function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The 4 option strings in display order: [meaning, ...distractors]
    permuted by question.order. */
export function wordOptions(q: WordBattleQuestion): string[] {
  const all = [q.entry.meaning, ...q.entry.distractors];
  return q.order.map((i) => all[i]);
}

/** Display slot (0–3) of the correct answer. */
export function correctWordDisplayIndex(q: WordBattleQuestion): number {
  return q.order.indexOf(0);
}

/** Draw `count` distinct words as battle questions.
    `level` picks one level; omitted draws mixed across all levels. */
export function drawWordQuestions(count = 10, level?: WordLevel): WordBattleQuestion[] {
  const pool = level ? wordsByLevel(level) : WORD_BANK;
  const picked = shuffled(pool).slice(0, count);
  return picked.map((entry) => ({ entry, order: shuffled([0, 1, 2, 3]) }));
}

/** Question ids in battle order (what the server stores). */
export function wordQuestionIds(questions: readonly WordBattleQuestion[]): string[] {
  return questions.map((q) => q.entry.id);
}
