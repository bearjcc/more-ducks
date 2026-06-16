// @ts-check
/**
 * One-time upgrades. Each applies a multiplier/bonus via its `effect`. Costs are
 * breadcrumbs. `era` gates when it's revealed. Tone: glib, escalating, earnest.
 *
 * @typedef {{ kind: "clickAdd", amount: number }
 *   | { kind: "clickMult", mult: number }
 *   | { kind: "crumbMult", mult: number }
 *   | { kind: "globalMult", mult: number }
 *   | { kind: "producerMult", target: string, mult: number }} Effect
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
  // Era 0 — The Pond
  { id: "bighands",      name: "Bigger Hands",         emoji: "🙌", blurb: "Hatch two at a time. Ethics review pending.",                    cost: 80,         era: 0, effect: { kind: "clickAdd", amount: 1 } },
  { id: "stalebread",    name: "Stale Bread Supply",   emoji: "🥖", blurb: "Ducks aren't picky. Foraging doubled.",                          cost: 400,        era: 0, effect: { kind: "crumbMult", mult: 2 } },

  // Era 1 — Flock Learning
  { id: "ducklingcamp",  name: "Duckling Bootcamp",    emoji: "🎓", blurb: "They learn to follow faster. Output tripled.",                   cost: 2500,       era: 1, effect: { kind: "producerMult", target: "duckling", mult: 3 } },
  { id: "nestopt",       name: "Nest Optimization",    emoji: "📐", blurb: "We A/B tested the straw. The straw won.",                        cost: 9000,       era: 1, effect: { kind: "producerMult", target: "nestbox", mult: 3 } },
  { id: "opensource",    name: "Open-Source Quack",    emoji: "🔓", blurb: "We released the weights. The ducks are everywhere now.",         cost: 40000,      era: 1, effect: { kind: "globalMult", mult: 2 } },

  // Era 2 — Scale the Flock
  { id: "syntheticcrumbs", name: "Synthetic Crumbs",   emoji: "🧪", blurb: "We make the bread now too. Vertical integration.",              cost: 300000,     era: 2, effect: { kind: "crumbMult", mult: 3 } },
  { id: "alignment",     name: "Alignment Patch",      emoji: "🧭", blurb: "The ducks now face the same way. We're calling it solved.",      cost: 1500000,    era: 2, effect: { kind: "clickMult", mult: 10 } },
  { id: "scalinglaws",   name: "Scaling Laws",         emoji: "📈", blurb: "More ducks make better ducks. It's just math, honestly.",        cost: 3000000,    era: 2, effect: { kind: "globalMult", mult: 3 } },

  // Era 3 — Duck Intelligence
  { id: "recursiveboost", name: "Self-Improvement",    emoji: "🔁", blurb: "The Recursive Drakes are iterating on themselves. Quietly.",     cost: 250000000,  era: 3, effect: { kind: "producerMult", target: "recursive", mult: 5 } },
  { id: "manifest",      name: "Manifest Destiny",     emoji: "🌊", blurb: "The continent is basically a pond now. Crumbs everywhere.",      cost: 600000000,  era: 3, effect: { kind: "crumbMult", mult: 5 } },
  { id: "foiegras",      name: "The Foie Gras Memo",   emoji: "📄", blurb: "Nobody read it. Output quadrupled regardless.",                  cost: 1500000000, era: 3, effect: { kind: "globalMult", mult: 4 } },
];
