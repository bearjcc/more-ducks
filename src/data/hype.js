// @ts-check
/**
 * Hype campaigns: spend Coins → gain Hype (decaying demand buff).
 * purchaseMode: quantity = uncapped placements; level = capped staff/channel (max 25).
 *
 * @typedef {object} HypeCampaignDef
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {string} flavour
 * @property {number} era
 * @property {"quantity"|"level"} purchaseMode
 * @property {number} baseCost
 * @property {number} costCoefficient
 * @property {number} hypeGain   Hype per purchase at level 1 / per unit
 * @property {number} [maxLevel]  For level mode (default 25)
 * @property {number} [hypeDecayMult] Per-level decay reduction for level campaigns
 */

/** @type {HypeCampaignDef[]} */
export const HYPE_CAMPAIGNS = [
  {
    id: "businesscards",
    name: "Business Cards",
    emoji: "💼",
    flavour: "Hand them out. Nobody reads them. Everyone remembers the duck.",
    purchaseMode: "quantity",
    baseCost: 50,
    costCoefficient: 1.15,
    hypeGain: 40,
    era: 0,
  },
  {
    id: "signflipper",
    name: "Sign Flipper",
    emoji: "🔄",
    flavour: "Corner traffic. Spinning enthusiasm. Legally distinct from protest.",
    purchaseMode: "quantity",
    baseCost: 200,
    costCoefficient: 1.15,
    hypeGain: 90,
    era: 0,
  },
  {
    id: "billboards",
    name: "Billboards",
    emoji: "🪧",
    flavour: "You can buy as many as you like. The highway agrees.",
    purchaseMode: "quantity",
    baseCost: 800,
    costCoefficient: 1.16,
    hypeGain: 220,
    era: 1,
  },
  {
    id: "socialmedia",
    name: "Social Media Manager",
    emoji: "📱",
    flavour: "Posts ducks. Engages ducks. Ducks follow ducks.",
    purchaseMode: "level",
    baseCost: 1_200,
    costCoefficient: 1.15,
    maxLevel: 25,
    hypeGain: 35,
    era: 1,
  },
  {
    id: "blogtour",
    name: "Thought Leadership Tour",
    emoji: "🎤",
    flavour: "Keynotes about keynotes. Slides are mostly ducks.",
    purchaseMode: "level",
    baseCost: 8_000,
    costCoefficient: 1.15,
    maxLevel: 25,
    hypeGain: 120,
    era: 2,
  },
  {
    id: "launch",
    name: "Product Launch Livestream",
    emoji: "📺",
    flavour: "Nothing new ships. Viewership does.",
    purchaseMode: "level",
    baseCost: 80_000,
    costCoefficient: 1.15,
    maxLevel: 25,
    hypeGain: 450,
    era: 3,
  },
  {
    id: "viral",
    name: "Viral Moment",
    emoji: "🔥",
    flavour: "Trending briefly. Booked for ages.",
    purchaseMode: "level",
    baseCost: 500_000,
    costCoefficient: 1.15,
    maxLevel: 25,
    hypeGain: 1_600,
    era: 4,
  },
];
