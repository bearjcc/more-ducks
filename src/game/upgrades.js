// @ts-check
import { UPGRADES } from "../data/upgrades.js";
import { PRODUCERS } from "../data/producers.js";

/**
 * Derived multipliers that aren't stored on engine entities. Recomputed from
 * owned upgrades; not persisted (rebuilt on load).
 * @typedef {{ clickPower: number, crumbMult: number }} Mods
 */

/** @returns {Mods} */
export function createMods() {
  return { clickPower: 1, crumbMult: 1 };
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
  /** @type {Record<string, number>} */
  const perProducer = {};

  for (const u of UPGRADES) {
    if (!meta.upgradesOwned.includes(u.id)) continue;
    const e = u.effect;
    switch (e.kind) {
      case "clickAdd": clickAddSum += e.amount; break;
      case "clickMult": clickMultProd *= e.mult; break;
      case "crumbMult": crumbMult *= e.mult; break;
      case "globalMult": globalMult *= e.mult; break;
      case "producerMult": perProducer[e.target] = (perProducer[e.target] || 1) * e.mult; break;
    }
  }

  for (const p of PRODUCERS) {
    const prod = engine.producer(p.id);
    if (!prod) continue;
    const mult = globalMult * (perProducer[p.id] || 1);
    prod.outputs.resources.ducks.productionAmount = p.productionAmount * mult;
  }

  mods.clickPower = (1 + clickAddSum) * clickMultProd;
  mods.crumbMult = crumbMult;
  meta.clickPower = mods.clickPower; // keep in sync for display/save
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
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) return false;

  const crumbs = engine.currency("breadcrumbs");
  if (crumbs.value < u.cost) return false;

  crumbs.incrementBy(-u.cost);
  meta.upgradesOwned.push(id);
  applyUpgrades(engine, meta, mods);
  return true;
}
