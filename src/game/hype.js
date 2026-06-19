// @ts-check
import { HYPE_CAMPAIGNS } from "../data/hype.js";

/**
 * @param {string} id
 * @returns {import("../data/hype.js").HypeCampaignDef|undefined}
 */
export function findCampaign(id) {
  return HYPE_CAMPAIGNS.find((c) => c.id === id);
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
 * Spend coins and grant Hype. Repeatable — stacks with decay in market.js.
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @param {string} id
 * @returns {import("../data/hype.js").HypeCampaignDef|null}
 */
export function buyHypeCampaign(engine, meta, id) {
  const def = findCampaign(id);
  if (!def || !campaignVisible(meta, def)) return null;

  const coins = engine.currency("coins");
  const hype = engine.currency("hype");
  if (!coins || !hype || coins.value < def.cost) return null;

  coins.incrementBy(-def.cost);
  hype.incrementBy(def.hypeGain);
  return def;
}
