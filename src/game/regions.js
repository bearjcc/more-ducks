// @ts-check
import { REGIONS, GAME_DAY_SEC } from "../data/regions.js";

/**
 * @param {string} id
 * @returns {import("../data/regions.js").RegionDef|undefined}
 */
export function findRegion(id) {
  return REGIONS.find((r) => r.id === id);
}

/**
 * @param {import("./meta.js").Meta} meta
 * @returns {boolean}
 */
export function hasRentedRegions(meta) {
  return (meta.regionsRented?.length ?? 0) > 0;
}

/**
 * Daily rent total for all rented regions (per game-day tick).
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function totalRentPerDay(meta) {
  let sum = 0;
  for (const id of meta.regionsRented || []) {
    const r = findRegion(id);
    if (r && r.rentPerDay > 0) sum += r.rentPerDay;
  }
  return sum;
}

/**
 * @param {import("./meta.js").Meta} meta
 * @param {number} dtSec
 */
export function tickRegions(meta, dtSec) {
  if (!meta.gameDayAccumulator) meta.gameDayAccumulator = 0;
  meta.gameDayAccumulator += dtSec;
  while (meta.gameDayAccumulator >= GAME_DAY_SEC) {
    meta.gameDayAccumulator -= GAME_DAY_SEC;
    const rent = totalRentPerDay(meta);
    if (rent > 0) meta.pendingRent = (meta.pendingRent || 0) + rent;
  }
}

/**
 * Apply accumulated rent to coins (may go negative → bankruptcy).
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 */
export function applyPendingRent(engine, meta) {
  const rent = meta.pendingRent || 0;
  if (rent <= 0) return;
  meta.pendingRent = 0;
  const coins = engine.currency("coins");
  if (coins) coins.incrementBy(-rent);
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @param {string} id
 * @returns {boolean}
 */
export function unlockRegion(engine, meta, id) {
  const r = findRegion(id);
  if (!r || id === "home") return false;
  if (r.requiresSaltwater && !meta.saltwaterDeployed) return false;
  if (meta.regionsUnlocked.includes(id)) return false;
  if (meta.era < r.era) return false;
  const coins = engine.currency("coins");
  if (!coins || coins.value < r.unlockCost) return false;
  coins.incrementBy(-r.unlockCost);
  meta.regionsUnlocked.push(id);
  return true;
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @param {string} id
 * @returns {boolean}
 */
export function rentRegion(engine, meta, id) {
  const r = findRegion(id);
  if (!r || id === "home" || r.saltwater || r.orbital) return false;
  if (!meta.regionsUnlocked.includes(id)) return false;
  if (meta.regionsRented.includes(id)) return false;
  if (id === "australia" && !meta.australiaFlooded) return false;
  meta.regionsRented.push(id);
  return true;
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {boolean}
 */
export function floodAustralia(engine, meta) {
  const r = findRegion("australia");
  if (!r || !r.floodCost) return false;
  if (meta.australiaFlooded) return false;
  if (!meta.regionsUnlocked.includes("australia")) return false;
  const coins = engine.currency("coins");
  if (!coins || coins.value < r.floodCost) return false;
  coins.incrementBy(-r.floodCost);
  meta.australiaFlooded = true;
  return true;
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {boolean}
 */
export function deploySaltwater(engine, meta) {
  if (!findRegion("ocean")) return false;
  if (meta.saltwaterDeployed) return false;
  if (!meta.regionsUnlocked.includes("ocean")) return false;
  meta.saltwaterDeployed = true;
  return true;
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {boolean}
 */
export function deploySpace(engine, meta) {
  if (!findRegion("space")) return false;
  if (meta.spaceDeployed) return false;
  if (!meta.saltwaterDeployed) return false;
  if (!meta.regionsUnlocked.includes("space")) return false;
  meta.spaceDeployed = true;
  return true;
}
