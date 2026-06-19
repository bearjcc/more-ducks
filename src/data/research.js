// @ts-check
/**
 * Research-purchased efficiency upgrades. Each raises `efficiencyMult` (supply
 * ↑ per duck). Costs are research currency. Tone: ops jargon, earnest.
 *
 * @typedef {{ kind: "efficiencyMult", mult: number }} ResearchEffect
 *
 * @typedef {object} ResearchUpgradeDef
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {string} blurb
 * @property {number} cost
 * @property {number} era
 * @property {"research"} currency
 * @property {ResearchEffect} effect
 */

/** @type {ResearchUpgradeDef[]} */
export const RESEARCH_UPGRADES = [
  {
    id: "promptcache",
    name: "Prompt Caching",
    emoji: "📦",
    blurb: "We remembered the question. The ducks answer faster now. Same wrong answers.",
    cost: 5,
    era: 0,
    currency: "research",
    effect: { kind: "efficiencyMult", mult: 1.25 },
  },
  {
    id: "quantweights",
    name: "Quantized Weights",
    emoji: "⚖️",
    blurb: "Fewer bits per quack. Margins improve. Confidence unchanged.",
    cost: 25,
    era: 0,
    currency: "research",
    effect: { kind: "efficiencyMult", mult: 1.5 },
  },
  {
    id: "distilled",
    name: "Distilled Duck Model",
    emoji: "🧪",
    blurb: "A smaller flock thinks it's a bigger flock. It works on benchmarks.",
    cost: 100,
    era: 1,
    currency: "research",
    effect: { kind: "efficiencyMult", mult: 2 },
  },
];
