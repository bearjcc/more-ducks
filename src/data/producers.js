// @ts-check
/**
 * Duck-makers. Costs are in coins; output is ducks. Numbers here are the
 * balance surface — tune freely. `era` is the minimum era index at which a
 * producer is revealed (it also stays visible once you own one).
 *
 * @typedef {object} ProducerDef
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {string} blurb
 * @property {number} baseCost          coins for the first unit
 * @property {number} costCoefficient   per-unit cost growth
 * @property {number} productionTime     ms between production batches
 * @property {number} productionAmount   ducks per batch, per unit owned
 * @property {number} era
 */

/** @type {ProducerDef[]} */
export const PRODUCERS = [
  { id: "duckling",    name: "Duckling",         emoji: "🐤",  blurb: "It follows the others. That's the whole strategy.",        baseCost: 12,          costCoefficient: 1.15, productionTime: 1500, productionAmount: 1,      era: 0 },
  { id: "nestbox",     name: "Nesting Box",      emoji: "📦",  blurb: "Ducks in. More ducks out. Try not to think about it.",     baseCost: 100,         costCoefficient: 1.15, productionTime: 1000, productionAmount: 3,      era: 0 },
  { id: "breeder",     name: "Breeding Pair",    emoji: "💞",  blurb: "Two ducks, lightly supervised.",                           baseCost: 1_100,       costCoefficient: 1.16, productionTime: 1000, productionAmount: 22,     era: 1 },
  { id: "pondfarm",    name: "Pond Farm",        emoji: "🪣",  blurb: "Industrial dabbling. Fully free-range, allegedly.",        baseCost: 12_000,      costCoefficient: 1.16, productionTime: 1000, productionAmount: 140,    era: 1 },
  { id: "hatchery",    name: "Mega-Hatchery",    emoji: "🏭",  blurb: "We ran the numbers. The numbers said: more ducks.",        baseCost: 170_000,     costCoefficient: 1.17, productionTime: 1000, productionAmount: 1200,   era: 2 },
  { id: "datapond",    name: "Data Pond",        emoji: "🛰️",  blurb: "Every duck teaches the next. Quack quality is improving.",  baseCost: 2_800_000,   costCoefficient: 1.17, productionTime: 1000, productionAmount: 12000,  era: 2 },
  { id: "recursive",   name: "Recursive Drake",  emoji: "♾️",  blurb: "A duck that makes ducks that make ducks. We're so back.",  baseCost: 36_000_000,    costCoefficient: 1.18, productionTime: 1000, productionAmount: 93000,  era: 3 },
  { id: "singularity", name: "Quack Singularity", emoji: "🌀", blurb: "Habitat is now a rounding error. Australia volunteered.",  baseCost: 450_000_000, costCoefficient: 1.19, productionTime: 1000, productionAmount: 700000, era: 3 },
];
