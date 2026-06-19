// @ts-check
/**
 * Game state that lives outside the continuum-engine entities — collection,
 * upgrades, narrative progress, and bookkeeping. Saved alongside the engine
 * state by save.js.
 *
 * @typedef {object} Settings
 * @property {"word"|"compact"|"scientific"} notation
 * @property {boolean|null} reduceMotion  null = follow system preference
 * @property {"day"|"night"|"system"} timeOfDay
 * @property {boolean} sfx
 * @property {1|10|100|"max"} buyMode
 *
 * @typedef {object} Meta
 * @property {number} clickPower      Legacy; hold-repeat replaces click hatch.
 * @property {number} era             Current era index (0-based).
 * @property {string[]} dexUnlocked   Ids of catalogued duck breeds.
 * @property {string[]} upgradesOwned Ids of purchased upgrades.
 * @property {string[]} quackmarksOwned Certified benchmark ids.
 * @property {Record<string, boolean>} flags  One-shot narrative/milestone flags.
 * @property {string[]} achievements  Toast milestones already shown.
 * @property {number} totalDucksEver  Lifetime ducks produced (for milestones).
 * @property {number} questionsAnswered  Lifetime manual questions asked.
 * @property {number} coherence          Narrative coherence (meta progression).
 * @property {number} answersTotal       Lifetime answers (distinct from questionsAnswered taps).
 * @property {number} demand             Runtime market demand (recomputed each tick).
 * @property {boolean} ponderingUnlocked Whether the pondering layer is unlocked.
 * @property {number} citations          Prestige currency banked across runs (+income mult).
 * @property {number} prestigeCount      Number of prestige resets completed.
 * @property {number} answersSinceFeed   Answers since last manual feed.
 * @property {number} manualFeeds        Lifetime manual duck feeds (onboarding).
 * @property {boolean} autoFeederOwned   Auto feeder removes feed gate, adds opex.
 * @property {string[]} answerdexSeen    Unique base quacks discovered.
 * @property {number} pondCount          Extra ponds purchased (capacity).
 * @property {number} pondCapacityBonus  From upgrades.
 * @property {number} gameStartMs          Real clock at run start.
 * @property {string|null} endingId        Terminal ending branch id.
 * @property {string|null} competitorBird  Random bird for competitor ending.
 * @property {string[]} regionsUnlocked
 * @property {string[]} regionsRented
 * @property {boolean} australiaFlooded
 * @property {boolean} saltwaterDeployed
 * @property {boolean} spaceDeployed
 * @property {number} gameDayAccumulator   Seconds toward next rent day.
 * @property {number} pendingRent          Rent queued for next apply.
 * @property {number} holdRepeatIntervalMs Ms between hold-repeat sends.
 * @property {Settings} settings
 */

/** @returns {Settings} */
export function defaultSettings() {
  return {
    notation: "word",
    reduceMotion: null,
    timeOfDay: "system",
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
    quackmarksOwned: [],
    flags: {},
    achievements: [],
    totalDucksEver: 1,
    questionsAnswered: 0,
    coherence: 0,
    answersTotal: 0,
    demand: 0,
    ponderingUnlocked: false,
    citations: 0,
    prestigeCount: 0,
    answersSinceFeed: 0,
    manualFeeds: 0,
    autoFeederOwned: false,
    answerdexSeen: [],
    pondCount: 0,
    pondCapacityBonus: 0,
    gameStartMs: Date.now(),
    endingId: null,
    competitorBird: null,
    regionsUnlocked: ["home"],
    regionsRented: [],
    australiaFlooded: false,
    saltwaterDeployed: false,
    spaceDeployed: false,
    gameDayAccumulator: 0,
    pendingRent: 0,
    holdRepeatIntervalMs: 450,
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
