// @ts-check
/**
 * Game state that lives outside the continuum-engine entities — collection,
 * upgrades, narrative progress, and bookkeeping. Saved alongside the engine
 * state by save.js.
 *
 * @typedef {object} Meta
 * @property {number} clickPower      Ducks hatched per manual quack.
 * @property {number} era             Current era index (0-based).
 * @property {string[]} dexUnlocked   Ids of catalogued duck breeds.
 * @property {string[]} upgradesOwned Ids of purchased upgrades.
 * @property {Record<string, boolean>} flags  One-shot narrative/milestone flags.
 * @property {number} totalDucksEver  Lifetime ducks produced (for milestones).
 */

/** @returns {Meta} */
export function defaultMeta() {
  return {
    clickPower: 1,
    era: 0,
    dexUnlocked: [],
    upgradesOwned: [],
    flags: {},
    totalDucksEver: 0,
  };
}
