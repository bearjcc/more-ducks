// @ts-check
import { PRODUCERS } from "../data/producers.js";
import { dexMods } from "./dexMods.js";
import { totalUpgradePurchases } from "./levels.js";

/**
 * Hero number for question-pool gating. Goes up. Means nothing.
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function intelligenceScore(engine, meta) {
  const ducks = engine.resource("ducks")?.count ?? 0;
  let infra = 0;
  for (const p of PRODUCERS) {
    const prod = engine.producer(p.id);
    if (prod) infra += prod.count * (p.era + 1);
  }
  const upgrades = totalUpgradePurchases(meta) * 50;
  const base = Math.pow(ducks, 0.75) + infra + upgrades;
  return Math.floor(base * dexMods(meta).scoreInflate);
}
