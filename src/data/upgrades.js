// @ts-check
/**
 * One-time upgrades. Each applies a multiplier/bonus via its `effect`. Costs are
 * coins. `era` gates when it's revealed. Tone: glib, escalating, earnest.
 *
 * @typedef {{ kind: "clickAdd", amount: number }
 *   | { kind: "clickMult", mult: number }
 *   | { kind: "crumbMult", mult: number }
 *   | { kind: "globalMult", mult: number }
 *   | { kind: "producerMult", target: string, mult: number }
 *   | { kind: "efficiencyMult", mult: number }
 *   | { kind: "holdRepeat" }
 *   | { kind: "holdRepeatSpeed", mult: number }
 *   | { kind: "autoFeeder" }
 *   | { kind: "pondCapacity", amount: number }
 *   | { kind: "capstone", ending: string }} Effect
 *
 * @typedef {object} UpgradeDef
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {string} blurb
 * @property {number} cost
 * @property {number} era
 * @property {Effect} effect
 */

/** @type {UpgradeDef[]} */
export const UPGRADES = [
  // Era 0 — The Pond (QLM loop first)
  { id: "steadybeak",    name: "Steady Beak",          emoji: "🙌", blurb: "Hold Auto to ask again. Ethics review pending.",                  cost: 80,         era: 0, effect: { kind: "holdRepeat" } },
  { id: "quickquack",    name: "Quick Quack",          emoji: "⚡", blurb: "Hold Auto fires faster. Wrist optional.",                        cost: 350,        era: 0, effect: { kind: "holdRepeatSpeed", mult: 0.75 } },
  { id: "autofeeder",    name: "Auto Feeder",          emoji: "🍞", blurb: "Never tap-feed again. Power bill scales with answers/sec.",      cost: 900,        era: 0, effect: { kind: "autoFeeder" } },

  // Era 1 — Flock Learning (producers, then crumbs)
  { id: "ducklingcamp",  name: "Duckling Bootcamp",    emoji: "🎓", blurb: "They learn to follow faster. Output tripled.",                   cost: 2500,       era: 1, effect: { kind: "producerMult", target: "duckling", mult: 3 } },
  { id: "stalebread",    name: "Stale Bread Supply",   emoji: "🥖", blurb: "Ducks aren't picky. Foraging doubled.",                          cost: 3500,       era: 1, effect: { kind: "crumbMult", mult: 2 } },
  { id: "nestopt",       name: "Nest Optimization",    emoji: "📐", blurb: "We A/B tested the straw. The straw won.",                        cost: 9000,       era: 1, effect: { kind: "producerMult", target: "nestbox", mult: 3 } },
  { id: "opensource",    name: "Open-Source Quack",    emoji: "🔓", blurb: "We released the weights. The ducks are everywhere now.",         cost: 40000,      era: 1, effect: { kind: "globalMult", mult: 2 } },

  // Era 2 — Scale the Flock
  { id: "syntheticcrumbs", name: "Synthetic Crumbs",   emoji: "🧪", blurb: "We make the bread now too. Vertical integration.",              cost: 300000,     era: 2, effect: { kind: "crumbMult", mult: 3 } },
  { id: "alignment",     name: "Alignment Patch",      emoji: "🧭", blurb: "The ducks now face the same way. We're calling it solved.",      cost: 1500000,    era: 2, effect: { kind: "clickMult", mult: 10 } },
  { id: "scalinglaws",   name: "Scaling Laws",         emoji: "📈", blurb: "More ducks make better ducks. It's just math, honestly.",        cost: 3000000,    era: 2, effect: { kind: "globalMult", mult: 3 } },
  { id: "pondexpansion", name: "Pond Expansion",       emoji: "🪣", blurb: "+25 duck capacity. Density is innovation.",                    cost: 500_000,    era: 2, effect: { kind: "pondCapacity", amount: 25 } },

  // Era 3 — Duck Intelligence
  { id: "recursiveboost", name: "Self-Improvement",    emoji: "🔁", blurb: "The Recursive Drakes are iterating on themselves. Quietly.",     cost: 6_000_000,   era: 3, effect: { kind: "producerMult", target: "recursive", mult: 5 } },
  { id: "manifest",      name: "Manifest Destiny",     emoji: "🌊", blurb: "The continent is basically a pond now. Crumbs everywhere.",      cost: 5_000_000,   era: 3, effect: { kind: "crumbMult", mult: 5 } },
  { id: "foiegras",      name: "The Foie Gras Memo",   emoji: "📄", blurb: "Nobody read it. Output quadrupled regardless.",                  cost: 5_500_000,   era: 3, effect: { kind: "globalMult", mult: 4 } },

  // Era 4 — More Ducks (late grind helpers)
  { id: "duckchain",   name: "Duckchain",        emoji: "⛓️", blurb: "Immutable ledger of who quacked first. Mostly ducks.",           cost: 2500000000,  era: 4, effect: { kind: "globalMult", mult: 2 } },
  { id: "crumbfi",     name: "Crumb-Fi",         emoji: "📶", blurb: "Yield farming, but the yield is breadcrumbs. Still crumbs.",   cost: 500000000,   era: 4, effect: { kind: "crumbMult", mult: 3 } },
  { id: "omnivore",    name: "Omnivore Protocol", emoji: "🍽️", blurb: "If it exists, it can be converted. Menu is short.",           cost: 2000000000,  era: 4, effect: { kind: "globalMult", mult: 2 } },
  { id: "lastcrumb",   name: "The Last Crumb",   emoji: "🥯", blurb: "There is always one more. There is always one more duck.",       cost: 5000000000,  era: 4, effect: { kind: "crumbMult", mult: 2 } },
  { id: "selfgoverning", name: "Self-Governing Flock", emoji: "🏛️", blurb: "The ducks vote. You are optional.",                          cost: 8_000_000_000, era: 4, effect: { kind: "capstone", ending: "singularity" } },
  { id: "oceanswarm",  name: "Maximum Ocean Density", emoji: "🌊", blurb: "Every drop of water now supports ducks.",                      cost: 12_000_000_000, era: 5, effect: { kind: "capstone", ending: "swarm" } },
];
