// @ts-check

/**
 * One-time, level, and quantity upgrades. Costs scale via purchaseMode.
 * `era` gates when it's revealed. Effect lines are generated in cardCopy.js;
 * `flavour` is humour only (no digits/math symbols).
 *
 * @typedef {{ kind: "clickAdd", amount: number }
 *   | { kind: "clickMult", mult: number }
 *   | { kind: "coinMult", mult: number }
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
 * @property {string} flavour
 * @property {number} era
 * @property {"once"|"level"|"quantity"} purchaseMode
 * @property {number} baseCost       First purchase cost (coins)
 * @property {number} [costCoefficient] Per-purchase growth for level/quantity
 * @property {number} [maxLevel]     Cap for level mode (default 25)
 * @property {Effect} effect
 */

/** @type {UpgradeDef[]} */

export const UPGRADES = [

  // Era 0 — The Pond (QLM loop first)
  { id: "steadybeak",    name: "Steady Beak",          emoji: "🙌", flavour: "Wrist optional.",                                                              purchaseMode: "once", baseCost: 25,         era: 0, effect: { kind: "holdRepeat" } },
  { id: "quickquack",    name: "Quick Quack",          emoji: "⚡", flavour: "The Auto button learns stamina.",                                               purchaseMode: "level", baseCost: 40, costCoefficient: 1.15, maxLevel: 25, era: 0, effect: { kind: "holdRepeatSpeed", mult: 0.75 } },
  { id: "promptcache",   name: "Crumb Recall",         emoji: "📦", flavour: "Same wrong answers. The pond just serves them faster.",                          purchaseMode: "level", baseCost: 60, costCoefficient: 1.15, maxLevel: 25, era: 0, effect: { kind: "efficiencyMult", mult: 1.25 } },
  { id: "autofeeder",    name: "Auto Feeder",          emoji: "🍞", flavour: "Never tap-feed again. The bread bill still exists.",                           purchaseMode: "once", baseCost: 200,        era: 0, effect: { kind: "autoFeeder" } },
  // Era 1 — Flock Learning (producers, then crumbs)
  { id: "ducklingcamp",  name: "Duckling Bootcamp",    emoji: "🎓", flavour: "They learn to follow faster.",                                                 purchaseMode: "level", baseCost: 2500, costCoefficient: 1.15, maxLevel: 25, era: 1, effect: { kind: "producerMult", target: "duckling", mult: 3 } },
  { id: "stalebread",    name: "Stale Bread Supply",   emoji: "🥖", flavour: "Ducks aren't picky.",                                                          purchaseMode: "level", baseCost: 3500, costCoefficient: 1.15, maxLevel: 25, era: 1, effect: { kind: "coinMult", mult: 2 } },
  { id: "nestopt",       name: "Nest Optimization",    emoji: "📐", flavour: "We A/B tested the straw. The straw won.",                                      purchaseMode: "level", baseCost: 9000, costCoefficient: 1.15, maxLevel: 25, era: 1, effect: { kind: "producerMult", target: "nestbox", mult: 3 } },
  { id: "quantweights",  name: "Light Peck",           emoji: "⚖️", flavour: "A lighter quack on the ledger. Confidence unchanged.",                          purchaseMode: "level", baseCost: 12000, costCoefficient: 1.15, maxLevel: 25, era: 1, effect: { kind: "efficiencyMult", mult: 1.5 } },
  { id: "opensource",    name: "Open Pond",            emoji: "🔓", flavour: "We opened the gates. The ducks are everywhere now.",                           purchaseMode: "level", baseCost: 40000, costCoefficient: 1.15, maxLevel: 25, era: 1, effect: { kind: "globalMult", mult: 2 } },
  { id: "distilled",     name: "Compact Flock",        emoji: "🧪", flavour: "A smaller flock thinks it's a bigger flock. The auditors nodded.",             purchaseMode: "level", baseCost: 50000, costCoefficient: 1.15, maxLevel: 25, era: 1, effect: { kind: "efficiencyMult", mult: 2 } },
  // Era 2 — Scale the Flock
  { id: "syntheticcrumbs", name: "Synthetic Crumbs",   emoji: "🧪", flavour: "We make the bread now too. Vertical integration.",                             purchaseMode: "level", baseCost: 300000, costCoefficient: 1.15, maxLevel: 25, era: 2, effect: { kind: "coinMult", mult: 3 } },
  { id: "alignment",     name: "Formation Training",   emoji: "🧭", flavour: "The ducks now face the same way. We're calling it solved.",                    purchaseMode: "level", baseCost: 1500000, costCoefficient: 1.15, maxLevel: 25, era: 2, effect: { kind: "clickMult", mult: 10 } },
  { id: "scalinglaws",   name: "Critical Mass",        emoji: "📈", flavour: "More ducks make better ducks. It's just math, honestly.",                      purchaseMode: "once", baseCost: 3000000, era: 2, effect: { kind: "globalMult", mult: 3 } },
  { id: "pondexpansion", name: "Pond Expansion",       emoji: "🪣", flavour: "Density is innovation.",                                                       purchaseMode: "quantity", baseCost: 500_000, costCoefficient: 1.18, era: 2, effect: { kind: "pondCapacity", amount: 25 } },
  // Era 3 — Duck Intelligence
  { id: "recursiveboost", name: "Self-Improvement",    emoji: "🔁", flavour: "The Recursive Drakes are iterating on themselves. Quietly.",                 purchaseMode: "level", baseCost: 6_000_000, costCoefficient: 1.15, maxLevel: 25, era: 3, effect: { kind: "producerMult", target: "recursive", mult: 5 } },
  { id: "manifest",      name: "Manifest Destiny",     emoji: "🌊", flavour: "The continent is basically a pond now. Crumbs everywhere.",                  purchaseMode: "level", baseCost: 5_000_000, costCoefficient: 1.15, maxLevel: 25, era: 3, effect: { kind: "coinMult", mult: 5 } },
  { id: "foiegras",      name: "The Foie Gras Memo",   emoji: "📄", flavour: "Nobody read it. Output rose regardless.",                                      purchaseMode: "level", baseCost: 5_500_000, costCoefficient: 1.15, maxLevel: 25, era: 3, effect: { kind: "globalMult", mult: 4 } },
  // Era 4 — More Ducks (late grind helpers)
  { id: "duckchain",   name: "Duckchain",        emoji: "⛓️", flavour: "Immutable ledger of who quacked first. Mostly ducks.",                           purchaseMode: "level", baseCost: 2500000000, costCoefficient: 1.15, maxLevel: 25, era: 4, effect: { kind: "globalMult", mult: 2 } },
  { id: "crumbfi",     name: "Crumb-Fi",         emoji: "📶", flavour: "Yield farming, but the yield is breadcrumbs. Still crumbs.",                   purchaseMode: "level", baseCost: 500000000, costCoefficient: 1.15, maxLevel: 25, era: 4, effect: { kind: "coinMult", mult: 3 } },
  { id: "omnivore",    name: "Omnivore Protocol", emoji: "🍽️", flavour: "If it exists, it can be converted. Menu is short.",                           purchaseMode: "level", baseCost: 2000000000, costCoefficient: 1.15, maxLevel: 25, era: 4, effect: { kind: "globalMult", mult: 2 } },
  { id: "lastcrumb",   name: "The Last Crumb",   emoji: "🥯", flavour: "There is always one more. There is always one more duck.",                       purchaseMode: "level", baseCost: 5000000000, costCoefficient: 1.15, maxLevel: 25, era: 4, effect: { kind: "coinMult", mult: 2 } },
  { id: "selfgoverning", name: "Self-Governing Flock", emoji: "🏛️", flavour: "The ducks vote. You are optional.",                                          purchaseMode: "once", baseCost: 4_000_000_000, era: 4, effect: { kind: "capstone", ending: "singularity" } },
  { id: "oceanswarm",  name: "Maximum Ocean Density", emoji: "🌊", flavour: "Every drop of water now supports ducks.",                      purchaseMode: "once", baseCost: 6_500_000_000, era: 5, effect: { kind: "capstone", ending: "swarm" } },
];
