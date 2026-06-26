// @ts-check

import { UPGRADES } from "../data/upgrades.js";
import { PRODUCERS } from "../data/producers.js";
import { dexMods } from "./dexMods.js";
import { bulkScaledCost } from "./scaledCost.js";
import { upgradeLevel } from "./levels.js";
/** @type {readonly import("../data/upgrades.js").UpgradeDef[]} */

export const ALL_UPGRADES = UPGRADES;
const DEFAULT_MAX_LEVEL = 25;

/**
 * @param {string} id
 * @returns {import("../data/upgrades.js").UpgradeDef|undefined}
 */
export function findUpgrade(id) {
  return ALL_UPGRADES.find((x) => x.id === id);
}

/**
 * @param {import("../data/upgrades.js").UpgradeDef} def
 * @returns {number}
 */
export function maxLevelFor(def) {
  if (def.purchaseMode === "once") return 1;
  if (def.purchaseMode === "quantity") return Infinity;
  return def.maxLevel ?? DEFAULT_MAX_LEVEL;
}

/**
 * Cost for the next purchase of an upgrade.
 * @param {import("../data/upgrades.js").UpgradeDef} def
 * @param {number} currentLevel
 * @returns {number}
 */
export function upgradeNextCost(def, currentLevel) {
  if (def.purchaseMode === "once") {
    return currentLevel >= 1 ? Infinity : def.baseCost;
  }

  const coeff = def.costCoefficient ?? 1.15;
  return bulkScaledCost(def.baseCost, coeff, currentLevel, 1);
}

/**
 * @param {import("../data/upgrades.js").UpgradeDef} def
 * @param {number} level
 * @returns {boolean}
 */
export function upgradeAtCap(def, level) {
  return level >= maxLevelFor(def);
}

/**
 * Per-level mult so total at maxLevel equals effect.mult (ponytail: explicit formula).
 * @param {number} targetMult
 * @param {number} level
 * @param {number} maxLevel
 */
function stackedMult(targetMult, level, maxLevel) {
  if (level <= 0) return 1;
  const perLevel = targetMult ** (1 / maxLevel);
  return perLevel ** level;
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
 * @param {import("./meta.js").Meta} meta
 * @param {import("../data/upgrades.js").UpgradeDef} def
 * @param {import("../data/upgrades.js").Effect} e
 * @param {number} level
 * @param {{
 *   clickAddSum: number,
 *   clickMultProd: number,
 *   crumbMult: number,
 *   globalMult: number,
 *   efficiencyMult: number,
 *   holdRepeat: boolean,
 *   holdSpeedMult: number,
 *   pondCapBonus: number,
 *   perProducer: Record<string, number>,
 * }} acc
 */
function applyEffect(meta, def, e, level, acc) {
  const cap = maxLevelFor(def);
  switch (e.kind) {
    case "clickAdd":
      acc.clickAddSum += e.amount * level;
      break;
    case "clickMult":
      acc.clickMultProd *= stackedMult(e.mult, level, cap === Infinity ? DEFAULT_MAX_LEVEL : cap);
      break;
    case "crumbMult":
      acc.crumbMult *= stackedMult(e.mult, level, cap === Infinity ? DEFAULT_MAX_LEVEL : cap);
      break;
    case "globalMult":
      acc.globalMult *= stackedMult(e.mult, level, cap === Infinity ? DEFAULT_MAX_LEVEL : cap);
      break;
    case "producerMult": {
      const m = stackedMult(e.mult, level, cap === Infinity ? DEFAULT_MAX_LEVEL : cap);
      acc.perProducer[e.target] = (acc.perProducer[e.target] || 1) * m;
      break;
    }

    case "efficiencyMult":
      acc.efficiencyMult *= stackedMult(e.mult, level, cap === Infinity ? DEFAULT_MAX_LEVEL : cap);
      break;
    case "holdRepeat":
      if (level >= 1) acc.holdRepeat = true;
      break;
    case "holdRepeatSpeed": {
      const m = stackedMult(e.mult, level, cap === Infinity ? DEFAULT_MAX_LEVEL : cap);
      acc.holdSpeedMult *= m;
      break;
    }

    case "autoFeeder":
      if (level >= 1) meta.autoFeederOwned = true;
      break;
    case "pondCapacity":
      acc.pondCapBonus += e.amount * level;
      break;
    case "capstone":
      break;
  }

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
  meta.autoFeederOwned = false;

  /** @type {{
 *   clickAddSum: number,
 *   clickMultProd: number,
 *   crumbMult: number,
 *   globalMult: number,
 *   efficiencyMult: number,
 *   holdRepeat: boolean,
 *   holdSpeedMult: number,
 *   pondCapBonus: number,
 *   perProducer: Record<string, number>,
 * }} */
  const acc = {
    clickAddSum: 0,
    clickMultProd: 1,
    crumbMult: 1,
    globalMult: 1,
    efficiencyMult: 1,
    holdRepeat: false,
    holdSpeedMult: 1,
    pondCapBonus: 0,
    perProducer: {},
  };

  for (const u of ALL_UPGRADES) {
    const level = upgradeLevel(meta, u.id);
    if (level <= 0) continue;
    applyEffect(meta, u, u.effect, level, acc);
  }

  for (const p of PRODUCERS) {
    const prod = engine.producer(p.id);
    if (!prod) continue;
    const mult = acc.globalMult * dexMods(meta).produceMult * (acc.perProducer[p.id] || 1);
    prod.outputs.resources.ducks.productionAmount = p.productionAmount * mult;
  }

  mods.clickPower = (1 + acc.clickAddSum) * acc.clickMultProd;
  mods.crumbMult = acc.crumbMult;
  mods.efficiencyMult = acc.efficiencyMult;
  mods.holdRepeat = acc.holdRepeat;
  mods.holdRepeatIntervalMs = Math.max(120, Math.floor(450 * acc.holdSpeedMult));
  meta.clickPower = mods.clickPower;
  meta.pondCapacityBonus = acc.pondCapBonus;
  meta.holdRepeatIntervalMs = mods.holdRepeatIntervalMs;
}

/**
 * Attempt to buy one level/unit of an upgrade.
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @param {Mods} mods
 * @param {string} id
 * @returns {boolean}
 */
export function buyUpgrade(engine, meta, mods, id) {
  const u = findUpgrade(id);
  if (!u) return false;
  const level = upgradeLevel(meta, u.id);
  if (upgradeAtCap(u, level)) return false;
  const cost = upgradeNextCost(u, level);
  if (!isFinite(cost)) return false;
  const coins = engine.currency("coins");
  if (!coins || coins.value < cost) return false;
  coins.incrementBy(-cost);
  meta.upgradeLevels[u.id] = level + 1;
  applyUpgrades(engine, meta, mods);
  if (id === "scalinglaws") meta.ponderingUnlocked = true;
  return true;
}
