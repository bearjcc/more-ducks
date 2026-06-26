// @ts-check
/**
 * Weighted basic answer table (ported from QLM DUCK_SOUNDS_BASE) and verbosity tiers.
 * Intelligence Score picks repeat tiers. Pondering Mode streams thoughts/facts (QLM
 * thinking); chat answers stay quacks and emoji from this table.
 *
 * @typedef {{ min: number, wrap: (q: string) => string }} Tier
 */

/** @type {[string, number][]} */
export const BASIC_ANSWERS = [
  ["quack", 2600],
  ["Quack", 2900],
  ["Quack!", 800],
  ["Quack?", 500],
  ["🦆", 500],
  ["🦆💦", 100],
  ["🦆💧", 100],
  ["🦆👑", 20],
  ["🦆🎩", 20],
  ["🦆🔥", 20],
  ["🦆🕊️", 20],
  ["🦆🪿", 20],
  ["🦆🎓", 20],
  ["🦆⚖️", 20],
  ["🦆🔬", 20],
  ["🦆🚀", 20],
  ["🦆💼", 20],
  ["🦆🎸", 20],
  ["🦆🏆", 20],
  ["🦆🌟", 20],
  ["🦆📚", 20],
  ["🦆🎭", 20],
  ["🦆🫧", 100],
  ["🦆🌊", 100],
  ["🦆🏊", 100],
  ["🦆🛟", 100],
  ["🦆🐥🐥🐥", 100],
  ["quack quack", 600],
  ["QUACK", 400],
  ["quack!", 400],
  ["Quack quack", 300],
  ["quaaack", 200],
  ["quaack", 200],
  ["quackety quack", 200],
  ["quack quack quack", 200],
  ["You're absolutely right!", 0.1],
];

/** @deprecated use BASIC_ANSWERS */
export const QUACKS = BASIC_ANSWERS;

/**
 * Plain quacks and solo 🦆 are common — Answerdex tracks profession emoji and rares.
 * @param {string} text
 * @returns {boolean}
 */
export function isCollectibleAnswer(text) {
  const entry = BASIC_ANSWERS.find(([t]) => t === text);
  if (!entry) return false;
  const [, weight] = entry;
  if (weight < 50) return true;
  if (text === "🦆") return false;
  const emojis = text.match(/\p{Extended_Pictographic}/gu);
  return emojis != null && emojis.length >= 2;
}

/** Weight below this marks a collectible as rare in the Answerdex UI. */
export const RARE_WEIGHT = 50;

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isRareAnswer(text) {
  const entry = BASIC_ANSWERS.find(([t]) => t === text);
  return entry != null && entry[1] < RARE_WEIGHT && isCollectibleAnswer(text);
}

/** @type {number} */
export const RARE_ANSWER_COUNT = BASIC_ANSWERS.filter(([t, w]) => w < RARE_WEIGHT && isCollectibleAnswer(t)).length;

/**
 * Verbosity tiers (ascending min score). QLM fidelity: answers stay nonsense
 * quacks; high score may repeat the answer — never a prefix, never the corporate
 * "Comprehensive analysis…" line, never the reserved finale punchline
 * (FINAL_ANSWER in quack.js). Duck thoughts/facts are Pondering Mode only.
 * @type {Tier[]}
 */
export const TIERS = [
  { min: 0, wrap: (q) => q },
  { min: 100, wrap: (q) => `${q} ${q}` },
];
