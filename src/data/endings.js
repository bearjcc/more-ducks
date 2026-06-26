// @ts-check
/** Real-time ms before competitor bird ending (80 hours). */
export const COMPETITOR_MS = 80 * 3600 * 1000;

export const VERTICAL_CAPSTONE = "selfgoverning";
export const HORIZONTAL_CAPSTONE = "oceanswarm";

/** @type {readonly string[]} */
export const COMPETITOR_BIRDS = [
  "Night Owl Corp",
  "Sparrow Systems",
  "Pigeon Labs",
  "Crow Composer",
  "Parrot Pro",
  "Emu Answers",
  "Kiwi Core",
];

/**
 * @typedef {object} EndingDef
 * @property {string} id
 * @property {string} title
 * @property {string} line
 * @property {string} soft
 * @property {string} thanks
 */

/** @type {Record<string, EndingDef>} */
export const ENDINGS = {
  bankrupt: {
    id: "bankrupt",
    title: "Pond Foreclosed",
    line: "Rent came due. The ducks kept answering, but the coins ran out first.",
    soft: "Supply without demand is awkward. Demand without solvency is worse.",
    thanks: "The wetlands send their regards.",
  },
  singularity: {
    id: "singularity",
    title: "Self-Governing Flock",
    line: "The ducks have formed a society. They still answer questions — for each other.",
    soft: "Additional ducks may improve confidence. They have improved everything else.",
    thanks: "Thanks for playing. The ducks release you with honors. 🦆",
  },
  swarm: {
    id: "swarm",
    title: "Global Swarm",
    line: "Every biome is pond. Every pond is duck. The oceans were a formality.",
    soft: "Ecosystem services have been reclassified as duck support infrastructure.",
    thanks: "Thanks for playing. It was very duck. 🦆",
  },
  competitor: {
    id: "competitor",
    title: "Market Disrupted",
    line: "Another bird shipped first. Humans still ask questions. They no longer ask you.",
    soft: "Funny how reasonable each pivot seemed.",
    thanks: "Thanks for playing. Quack later. 🦆",
  },
  space: {
    id: "space",
    title: "So Long, and Thanks for All the Fish",
    line: "Ducks in spaaaace. Howard would be proud. The dolphins are less amused.",
    soft: "The Vogons have scheduled a demolition. Earth was mostly pond anyway.",
    thanks: "Thanks for all the ducks. 🦆🚀",
  },
};
