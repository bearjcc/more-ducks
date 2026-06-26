// @ts-check
import { HYPE_CAMPAIGNS } from "../data/hype.js";
import { bulkScaledCost } from "./scaledCost.js";
import { marketingLevel } from "./levels.js";
import { HYPE_DECAY_PER_SEC } from "./market.js";

const DEFAULT_MAX_LEVEL = 25;

/**
 * @param {string} id
 * @returns {import("../data/hype.js").HypeCampaignDef|undefined}
 */
export function findCampaign(id) {
  return HYPE_CAMPAIGNS.find((c) => c.id === id);
}

/**
 * @param {import("../data/hype.js").HypeCampaignDef} def
 * @returns {number}
 */
export function maxMarketingLevel(def) {
  if (def.purchaseMode === "quantity") return Infinity;
  return def.maxLevel ?? DEFAULT_MAX_LEVEL;
}

/**
 * @param {import("../data/hype.js").HypeCampaignDef} def
 * @param {number} currentLevel
 * @returns {number}
 */
export function campaignNextCost(def, currentLevel) {
  return bulkScaledCost(def.baseCost, def.costCoefficient, currentLevel, 1);
}

/**
 * @param {import("../data/hype.js").HypeCampaignDef} def
 * @param {number} level
 * @returns {boolean}
 */
export function campaignAtCap(def, level) {
  return level >= maxMarketingLevel(def);
}

/**
 * Hype granted on purchase — scales with level for level campaigns.
 * @param {import("../data/hype.js").HypeCampaignDef} def
 * @param {number} levelAfterPurchase
 */
export function campaignHypeGain(def, levelAfterPurchase) {
  if (def.purchaseMode === "quantity") return def.hypeGain;
  return def.hypeGain * levelAfterPurchase;
}

/**
 * Effective hype decay per second after marketing levels (social media manager).
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function effectiveHypeDecay(meta) {
  const lvl = marketingLevel(meta, "socialmedia");
  if (lvl <= 0) return HYPE_DECAY_PER_SEC;
  const def = findCampaign("socialmedia");
  const maxLvl = def ? maxMarketingLevel(def) : DEFAULT_MAX_LEVEL;
  const reduction = 0.04 * lvl / maxLvl;
  return HYPE_DECAY_PER_SEC * (1 - reduction);
}

/**
 * @param {import("./meta.js").Meta} meta
 * @param {import("../data/hype.js").HypeCampaignDef} def
 * @returns {boolean}
 */
export function campaignVisible(meta, def) {
  return def.era <= meta.era;
}

/**
 * Spend coins and grant Hype.
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @param {string} id
 * @returns {import("../data/hype.js").HypeCampaignDef|null}
 */
export function buyHypeCampaign(engine, meta, id) {
  const def = findCampaign(id);
  if (!def || !campaignVisible(meta, def)) return null;

  const level = marketingLevel(meta, id);
  if (campaignAtCap(def, level)) return null;

  const cost = campaignNextCost(def, level);
  const coins = engine.currency("coins");
  const hype = engine.currency("hype");
  if (!coins || !hype || coins.value < cost) return null;

  coins.incrementBy(-cost);
  const newLevel = level + 1;
  meta.marketingLevels[id] = newLevel;
  hype.incrementBy(campaignHypeGain(def, newLevel));
  return def;
}
