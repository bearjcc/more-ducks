// @ts-check
/**
 * Game state that lives outside the continuum-engine entities — collection,
 * upgrades, narrative progress, and bookkeeping. Saved alongside the engine
 * state by save.js.
 *
 * @typedef {object} Settings
 * @property {"word"|"compact"|"scientific"} notation
 * @property {boolean|null} reduceMotion  null = follow system preference
 * @property {boolean} sfx
 * @property {1|10|100|"max"} buyMode
 *
 * @typedef {object} Meta
 * @property {number} clickPower      Ducks hatched per manual quack.
 * @property {number} era             Current era index (0-based).
 * @property {string[]} dexUnlocked   Ids of catalogued duck breeds.
 * @property {string[]} upgradesOwned Ids of purchased upgrades.
 * @property {Record<string, boolean>} flags  One-shot narrative/milestone flags.
 * @property {string[]} achievements  Toast milestones already shown.
 * @property {number} totalDucksEver  Lifetime ducks produced (for milestones).
 * @property {Settings} settings
 */

/** @returns {Settings} */
export function defaultSettings() {
  return {
    notation: "word",
    reduceMotion: null,
    sfx: true,
    buyMode: 1,
  };
}

/** @returns {Meta} */
export function defaultMeta() {
  return {
    clickPower: 1,
    era: 0,
    dexUnlocked: [],
    upgradesOwned: [],
    flags: {},
    achievements: [],
    totalDucksEver: 1,
    settings: defaultSettings(),
  };
}

/**
 * Merge saved settings over defaults (handles older saves missing keys).
 * @param {Partial<Settings>|undefined} [saved]
 * @returns {Settings}
 */
export function mergeSettings(saved) {
  return { ...defaultSettings(), ...saved };
}
