// @ts-check
/**
 * Hype campaigns: spend Coins → gain Hype (decaying demand buff). Repeatable.
 * Costs and gains are the balance surface — tune in scripts/sim.mjs (H2).
 *
 * @typedef {object} HypeCampaignDef
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {string} blurb
 * @property {number} cost       coins per launch
 * @property {number} hypeGain   Hype currency added (stacks; decays in market.js)
 * @property {number} era        minimum era to appear
 */

/** @type {HypeCampaignDef[]} */
export const HYPE_CAMPAIGNS = [
  {
    id: "pressrelease",
    name: "Press Release",
    emoji: "📰",
    blurb: "We're excited to announce excitement. Embargo lifts at market open.",
    cost: 80,
    hypeGain: 80,
    era: 0,
  },
  {
    id: "blogtour",
    name: "Thought Leadership Tour",
    emoji: "🎤",
    blurb: "Keynotes about keynotes. Slides are mostly ducks.",
    cost: 1_200,
    hypeGain: 280,
    era: 1,
  },
  {
    id: "launch",
    name: "Product Launch Livestream",
    emoji: "📺",
    blurb: "Nothing new ships. Viewership does.",
    cost: 18_000,
    hypeGain: 900,
    era: 2,
  },
  {
    id: "viral",
    name: "Viral Moment",
    emoji: "🔥",
    blurb: "Trending for twelve minutes. Booked for twelve quarters.",
    cost: 240_000,
    hypeGain: 3_200,
    era: 3,
  },
];
