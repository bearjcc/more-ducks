// @ts-check
import { UPGRADES } from "../data/upgrades.js";
import { RESEARCH_UPGRADES } from "../data/research.js";
import { PRODUCERS } from "../data/producers.js";
import { dexMods } from "./dexMods.js";

/** @type {readonly import("../data/upgrades.js").UpgradeDef[]} */
export const ALL_UPGRADES = [...UPGRADES, ...RESEARCH_UPGRADES];

/**
 * @param {string} id
 * @returns {import("../data/upgrades.js").UpgradeDef|import("../data/research.js").ResearchUpgradeDef|undefined}
 */
export function findUpgrade(id) {
  return ALL_UPGRADES.find((x) => x.id === id);
}

/**
 * Derived multipliers that aren't stored on engine entities. Recomputed from
 * owned upgrades; not persisted (rebuilt on load).
 * @typedef {{
 *   clickPower: number,
 *   crumbMult: number,
 *   efficiencyMult: number,
 *   holdRepeat: boolean,
 *   holdRepeatIntervalMs: number,
 * }} Mods
 */

/** @returns {Mods} */
export function createMods() {
  return {
    clickPower: 1,
    crumbMult: 1,
    efficiencyMult: 1,
    holdRepeat: false,
    holdRepeatIntervalMs: 450,
  };
}

/**
 * Recompute every derived multiplier from owned upgrades and write the results
 * onto the engine producers and the shared mods object. Idempotent — safe to
 * call after load and after each purchase.
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @param {Mods} mods
 */
export function applyUpgrades(engine, meta, mods) {
  let clickAddSum = 0;
  let clickMultProd = 1;
  let crumbMult = 1;
  let globalMult = 1;
  let efficiencyMult = 1;
  let holdRepeat = false;
  let holdSpeedMult = 1;
  let pondCapBonus = 0;
  /** @type {Record<string, number>} */
  const perProducer = {};

  for (const u of ALL_UPGRADES) {
    if (!meta.upgradesOwned.includes(u.id)) continue;
    const e = u.effect;
    switch (e.kind) {
      case "clickAdd": clickAddSum += e.amount; break;
      case "clickMult": clickMultProd *= e.mult; break;
      case "crumbMult": crumbMult *= e.mult; break;
      case "globalMult": globalMult *= e.mult; break;
      case "producerMult": perProducer[e.target] = (perProducer[e.target] || 1) * e.mult; break;
      case "efficiencyMult": efficiencyMult *= e.mult; break;
      case "holdRepeat": holdRepeat = true; break;
      case "holdRepeatSpeed": holdSpeedMult *= e.mult; break;
      case "autoFeeder": meta.autoFeederOwned = true; break;
      case "pondCapacity": pondCapBonus += e.amount; break;
      case "capstone": break;
    }
  }

  for (const p of PRODUCERS) {
    const prod = engine.producer(p.id);
    if (!prod) continue;
    const mult = globalMult * dexMods(meta).produceMult * (perProducer[p.id] || 1);
    prod.outputs.resources.ducks.productionAmount = p.productionAmount * mult;
  }

  mods.clickPower = (1 + clickAddSum) * clickMultProd;
  mods.crumbMult = crumbMult;
  mods.efficiencyMult = efficiencyMult;
  mods.holdRepeat = holdRepeat;
  mods.holdRepeatIntervalMs = Math.max(120, Math.floor(450 * holdSpeedMult));
  meta.clickPower = mods.clickPower;
  meta.pondCapacityBonus = pondCapBonus;
  meta.holdRepeatIntervalMs = mods.holdRepeatIntervalMs;
}

/**
 * Attempt to buy a one-time upgrade.
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @param {Mods} mods
 * @param {string} id
 * @returns {boolean}
 */
export function buyUpgrade(engine, meta, mods, id) {
  if (meta.upgradesOwned.includes(id)) return false;
  const u = findUpgrade(id);
  if (!u) return false;

  const currencyKey = "currency" in u && u.currency ? u.currency : "coins";
  const currency = engine.currency(currencyKey);
  if (!currency || currency.value < u.cost) return false;

  currency.incrementBy(-u.cost);
  meta.upgradesOwned.push(id);
  applyUpgrades(engine, meta, mods);
  return true;
}
