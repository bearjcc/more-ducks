// @ts-check
/**
 * Weighted quack table (ported from QLM DUCK_SOUNDS_BASE) and verbosity tiers.
 * Intelligence Score picks a tier; the quack text itself is always nonsense.
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

/** @type {Tier[]} ascending min score */
export const TIERS = [
  { min: 0, wrap: (q) => q },
  { min: 100, wrap: (q) => `${q} ${q}` },
  { min: 10_000, wrap: (q) => `After careful consideration: ${q}` },
  { min: 1_000_000, wrap: (q) => `Comprehensive analysis suggests additional ducks may improve confidence. ${q}` },
];
