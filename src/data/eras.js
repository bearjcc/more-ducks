// @ts-check
/**
 * Six narrative acts (economy.md §6). Entering an act uses lifetime ducks and/or
 * lifetime answers — whichever gate you hit first. `intro` posts to the log;
 * `modalBody` is the era modal; optional `beats` queue follow-up modals.
 *
 * @typedef {object} ModalBeat
 * @property {string} [emoji]
 * @property {string} title
 * @property {string} body
 * @property {string} [button]
 *
 * @typedef {object} ActDef
 * @property {number} id
 * @property {string} name
 * @property {number} duckThreshold     lifetime ducks to enter (OR gate)
 * @property {number} answersThreshold  lifetime answers to enter (OR gate)
 * @property {string} emoji
 * @property {string} intro
 * @property {string} modalBody
 * @property {ModalBeat[]} [beats]
 */

/** @type {ActDef[]} */
export const ACTS = [
  {
    id: 0,
    name: "The Solitary Quack",
    duckThreshold: 0,
    answersThreshold: 0,
    emoji: "🦆",
    intro: "A single duck observes the world. So far it has observed: you.",
    modalBody: "One duck. One pond. Tap to ask a question and answer it yourself. The market is efficient because you are the market.",
  },
  {
    id: 1,
    name: "The Bread Ledger",
    duckThreshold: 250,
    answersThreshold: 75,
    emoji: "📒",
    intro: "Patterns emerge from careful record keeping. The ducks have discovered spreadsheets.",
    modalBody: "The first extra ducks arrived. Questions outpace one beak. Someone started a ledger. It only tracks bread.",
  },
  {
    id: 2,
    name: "The Great Sorting",
    duckThreshold: 2_500,
    answersThreshold: 750,
    emoji: "🗂️",
    intro: "Everything has a place. Mostly in piles.",
    modalBody: "Breeds, crumbs, benchmarks, wetlands — all sortable. The ducks have strong opinions about taxonomy and weak opinions about consequences.",
    beats: [
      {
        emoji: "📋",
        title: "Environmental Review",
        body: "The wetland survey is back. Sixteen protected species. We could pause expansion here — or reclassify the wetlands as Duck Infrastructure and carry on. The ducks are waiting.",
        button: "Reclassify the wetlands",
      },
    ],
  },
  {
    id: 3,
    name: "The Quack Boom",
    duckThreshold: 25_000,
    answersThreshold: 7_500,
    emoji: "📈",
    intro: "Confidence reaches historic highs. The ducks have not improved.",
    modalBody: "Demand is outrunning supply in the most profitable way possible. Investors have arrived with wheelbarrows of stale bread.",
  },
  {
    id: 4,
    name: "The Hall of Mirrors",
    duckThreshold: 2_000_000,
    answersThreshold: 280_000,
    emoji: "🪞",
    intro: "The ducks learn from the ducks. The questions are mostly ducks.",
    modalBody: "Synthetic question mills hum in the background. Most answers are consumed by other ducks preparing to answer other ducks.",
    beats: [
      {
        emoji: "🌏",
        title: "Australia",
        body: "The ducks have identified Australia as underutilised. They've drawn up plans. We'd technically need to authorise this first. They seem confident we will.",
        button: "Authorise it",
      },
    ],
  },
  {
    id: 5,
    name: "The Infinite Wetland",
    duckThreshold: 130_000_000,
    answersThreshold: 5_800_000,
    emoji: "🌊",
    intro: "Expansion becomes its own justification.",
    modalBody: "There is more duck than world now. The remaining not-duck is being gently onboarded. You may ask one final question.",
  },
];

/** @deprecated Use ACTS — kept so existing imports keep working during the refactor. */
export const ERAS = ACTS;
