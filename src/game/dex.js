// @ts-check
import { DUCKS } from "../data/ducks.js";
import { upgradeLevel } from "./levels.js";

/**
 * @param {import("../data/ducks.js").Unlock} u
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {boolean}
 */
function isUnlocked(u, engine, meta) {
  switch (u.type) {
    case "era": return meta.era >= u.value;
    case "ducks": return meta.totalDucksEver >= u.value;
    case "producer": {
      const p = engine.producer(u.id);
      return !!p && p.count >= u.count;
    }
    case "upgrade": return upgradeLevel(meta, u.id) >= 1;
    case "region": {
      const mode = u.mode ?? "unlocked";
      if (!meta.regionsUnlocked?.includes(u.id)) return false;
      if (mode === "rented") return meta.regionsRented?.includes(u.id) ?? false;
      if (mode === "flooded") return u.id === "australia" && meta.australiaFlooded;
      if (mode === "saltwater") return meta.saltwaterDeployed;
      if (mode === "orbital") return meta.spaceDeployed;
      return true;
    }
    default: return false;
  }
}

/**
 * Catalogue any newly-unlocked breeds (mutates meta.dexUnlocked) and return
 * the freshly-unlocked definitions for logging/toasts.
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {import("../data/ducks.js").DuckDef[]}
 */
export function checkDex(engine, meta) {
  /** @type {import("../data/ducks.js").DuckDef[]} */
  const newly = [];
  for (const d of DUCKS) {
    if (meta.dexUnlocked.includes(d.id)) continue;
    if (isUnlocked(d.unlock, engine, meta)) {
      meta.dexUnlocked.push(d.id);
      newly.push(d);
    }
  }
  return newly;
}

/** @returns {boolean} true when every breed has been catalogued. */
export function dexComplete(meta) {
  return meta.dexUnlocked.length >= DUCKS.length;
}
