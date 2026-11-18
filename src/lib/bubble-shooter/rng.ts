/* Seeded PRNG — mulberry32. Everything random in the Bubble
   Shooter sim flows through one of these; Math.random() is banned in
   sim code so the same level always produces the same board.
   Adapted from maryayi/color-shoot src/core/Rng.ts (MIT License);
   the mulberry32 algorithm itself is public domain. */

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) this.state = 0x9e3779b9; // avoid the absorbing all-zero state
  }

  /** FNV-1a style string hash → 32-bit seed. */
  static hash(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /** Next float in [0, 1). */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Next integer in [0, max). */
  int(max: number): number {
    return Math.floor(this.next() * max);
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** True with probability p (0..1). */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Weighted pick from `entries` of [value, weight] pairs. */
  static weightedPick<T>(entries: ReadonlyArray<readonly [T, number]>, rng: Rng): T {
    let total = 0;
    for (const [, w] of entries) total += w;
    let r = rng.next() * total;
    for (const [v, w] of entries) {
      r -= w;
      if (r <= 0) return v;
    }
    return entries[entries.length - 1][0];
  }
}

export function hashCombine(a: number, b: number): number {
  return (Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ b) >>> 0;
}
