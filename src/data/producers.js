// @ts-check
/**
 * Duck-makers. Costs are in breadcrumbs; output is ducks. Numbers here are the
 * balance surface — tune freely. `era` is the minimum era index at which a
 * producer is revealed (it also stays visible once you own one).
 *
 * @typedef {object} ProducerDef
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {string} blurb
 * @property {number} baseCost          breadcrumbs for the first unit
 * @property {number} costCoefficient   per-unit cost growth
 * @property {number} productionTime     ms between production batches
 * @property {number} productionAmount   ducks per batch, per unit owned
 * @property {number} era
 */

/** @type {ProducerDef[]} */
export const PRODUCERS = [
  { id: "duckling",    name: "Duckling",         emoji: "🐤",  blurb: "It follows the others. That's the whole strategy.",        baseCost: 15,          costCoefficient: 1.15, productionTime: 1500, productionAmount: 1,     era: 0 },
  { id: "nestbox",     name: "Nesting Box",      emoji: "📦",  blurb: "Ducks in. More ducks out. Try not to think about it.",     baseCost: 120,         costCoefficient: 1.15, productionTime: 1000, productionAmount: 1,     era: 0 },
  { id: "breeder",     name: "Breeding Pair",    emoji: "💞",  blurb: "Two ducks, lightly supervised.",                           baseCost: 1300,        costCoefficient: 1.16, productionTime: 1000, productionAmount: 5,     era: 1 },
  { id: "pondfarm",    name: "Pond Farm",        emoji: "🪣",  blurb: "Industrial dabbling. Fully free-range, allegedly.",        baseCost: 14000,       costCoefficient: 1.16, productionTime: 1000, productionAmount: 24,    era: 1 },
  { id: "hatchery",    name: "Mega-Hatchery",    emoji: "🏭",  blurb: "We ran the numbers. The numbers said: more ducks.",        baseCost: 200000,      costCoefficient: 1.17, productionTime: 1000, productionAmount: 130,   era: 2 },
  { id: "datapond",    name: "Data Pond",        emoji: "🛰️",  blurb: "Every duck trains the next. Quack quality is improving.",  baseCost: 3300000,     costCoefficient: 1.17, productionTime: 1000, productionAmount: 700,   era: 2 },
  { id: "recursive",   name: "Recursive Drake",  emoji: "♾️",  blurb: "A duck that makes ducks that make ducks. We're so back.",  baseCost: 55000000,    costCoefficient: 1.18, productionTime: 1000, productionAmount: 3800,  era: 3 },
  { id: "singularity", name: "Quack Singularity", emoji: "🌀", blurb: "Habitat is now a rounding error. Australia volunteered.",  baseCost: 900000000,   costCoefficient: 1.19, productionTime: 1000, productionAmount: 21000, era: 3 },
];
