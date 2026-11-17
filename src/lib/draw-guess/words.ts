/* Draw & Guess word bank: simple, concrete, universal words that are
   fun to draw and easy to guess. Words stay in English — drawing words
   are universal, and the same bank serves both site languages. All
   words are lowercase; the server stores and compares guesses in
   lowercase too. No word repeats within a game (the server tracks
   used_words). */

/** 82 drawing-friendly words: animals, nature, food, objects, play. */
export const DRAW_WORDS: string[] = [
  // Animals
  "cat",
  "dog",
  "fish",
  "bird",
  "elephant",
  "tiger",
  "lion",
  "monkey",
  "butterfly",
  "bee",
  "snake",
  "horse",
  "cow",
  "rabbit",
  "frog",
  "turtle",
  "penguin",
  "shark",
  "octopus",
  "spider",
  "duck",
  "mouse",
  // Nature
  "tree",
  "flower",
  "mountain",
  "river",
  "ocean",
  "sun",
  "moon",
  "star",
  "rainbow",
  "cloud",
  "volcano",
  "island",
  "mushroom",
  "waterfall",
  "forest",
  "snowman",
  // Food
  "apple",
  "banana",
  "mango",
  "watermelon",
  "cake",
  "pizza",
  "ice cream",
  "popcorn",
  "sandwich",
  "cookie",
  "donut",
  "coffee",
  // Objects
  "house",
  "car",
  "bicycle",
  "boat",
  "train",
  "airplane",
  "rocket",
  "bridge",
  "castle",
  "crown",
  "key",
  "umbrella",
  "glasses",
  "hat",
  "clock",
  "camera",
  "candle",
  "guitar",
  "piano",
  "book",
  "pencil",
  "chair",
  "kite",
  "balloon",
  "robot",
  "drum",
  // Play & imagination
  "football",
  "cricket",
  "pirate",
  "dragon",
  "unicorn",
  "pumpkin",
];

/** Pick `count` distinct random words, skipping anything in `used`.
    Uses crypto randomness like the room-code generator. Falls back to
    the full bank if every word were somehow used (82 words vs at most
    6 rounds per game, so this never happens in practice). */
export function chooseWords(used: readonly string[], count: number): string[] {
  const pool = DRAW_WORDS.filter((w) => !used.includes(w));
  const source = pool.length > 0 ? pool : [...DRAW_WORDS];
  const n = Math.min(count, source.length);
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  const picks: string[] = [];
  for (let i = 0; i < n; i++) {
    const j = i + (bytes[i] % (source.length - i));
    const tmp = source[i];
    source[i] = source[j];
    source[j] = tmp;
    picks.push(source[i]);
  }
  return picks;
}
