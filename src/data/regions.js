// @ts-check
/**
 * Regional expansion. Home = owned; abroad = rent risk.
 *
 * @typedef {object} RegionDef
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {string} blurb
 * @property {number} era          Min act to reveal
 * @property {number} unlockCost   Coins to unlock access
 * @property {number} rentPerDay     Coins per game-day (0 = no rent)
 * @property {number} [floodCost]    One-time capex (Australia)
 * @property {boolean} [saltwater]   Ocean deployment, no pond
 * @property {boolean} [orbital]     Space deployment ending
 * @property {boolean} [requiresSaltwater] Unlock only after saltwater ducks
 */

/** Real seconds per in-game day. */
export const GAME_DAY_SEC = 120;

/** @type {RegionDef[]} */
export const REGIONS = [
  {
    id: "home",
    name: "Home Pond",
    emoji: "🏡",
    blurb: "You own it. Idle ducks are capex, not opex.",
    era: 0,
    unlockCost: 0,
    rentPerDay: 0,
  },
  {
    id: "europe",
    name: "Northern Wetlands",
    emoji: "🌿",
    blurb: "Rent a pond. Species: mallard variants with opinions.",
    era: 4,
    unlockCost: 2_500_000,
    rentPerDay: 800,
  },
  {
    id: "asia",
    name: "Eastern Reaches",
    emoji: "🎋",
    blurb: "Rent required. Ducks migrate here for tax purposes.",
    era: 4,
    unlockCost: 5_000_000,
    rentPerDay: 1200,
  },
  {
    id: "australia",
    name: "Interior Basin",
    emoji: "🏜️",
    blurb: "Flood the desert once. No rent after that. Giant lake, giant capex.",
    era: 4,
    unlockCost: 8_000_000,
    floodCost: 50_000_000,
    rentPerDay: 0,
  },
  {
    id: "ocean",
    name: "Open Ocean",
    emoji: "🌊",
    blurb: "Saltwater ducks. No pond. No rent.",
    era: 5,
    unlockCost: 25_000_000,
    rentPerDay: 0,
    saltwater: true,
  },
  {
    id: "space",
    name: "Orbital Reach",
    emoji: "🚀",
    blurb: "Ducks in spaaaace. So long, and thanks for all the fish.",
    era: 5,
    unlockCost: 80_000_000,
    rentPerDay: 0,
    orbital: true,
    requiresSaltwater: true,
  },
];
