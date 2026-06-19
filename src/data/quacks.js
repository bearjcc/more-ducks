// @ts-check
/**
 * Weighted quack table (ported from QLM DUCK_SOUNDS_BASE) and verbosity tiers.
 * Intelligence Score and coherence pick verbosity tiers; raw quack text is nonsense
 * until coherence blends in fluent lines from questions.js (economy.md §4).
 *
 * @typedef {{ min: number, wrap: (q: string) => string }} Tier
 */

/** @type {[string, number][]} */
export const QUACKS = [
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

/**
 * Verbosity tiers (ascending min score). QLM fidelity: answers stay nonsense
 * quacks; the most a high score adds is a short, confident prefix — never the
 * corporate "Comprehensive analysis…" line and never the reserved finale
 * punchline (FINAL_ANSWER in quack.js). "After careful consideration:" is the
 * ceiling on purpose.
 * @type {Tier[]}
 */
export const TIERS = [
  { min: 0, wrap: (q) => q },
  { min: 100, wrap: (q) => `${q} ${q}` },
  { min: 10_000, wrap: (q) => `After careful consideration: ${q}` },
];
