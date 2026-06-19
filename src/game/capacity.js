// @ts-check
/** Ducks per owned pond beyond the starter. */
export const DUCKS_PER_POND = 50;

/** Starter pond capacity. */
export const BASE_POND_CAPACITY = 12;

/**
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function pondCapacity(meta) {
  const ponds = 1 + (meta.pondCount || 0);
  const bonus = meta.pondCapacityBonus || 0;
  return BASE_POND_CAPACITY + ponds * DUCKS_PER_POND + bonus;
}

/**
 * @param {any} engine
 * @returns {number}
 */
export function duckCount(engine) {
  return engine.resource("ducks")?.count ?? 0;
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {boolean}
 */
export function atCapacity(engine, meta) {
  return duckCount(engine) >= pondCapacity(meta);
}

/** Cost in coins for the next pond purchase. */
export function nextPondCost(meta) {
  const n = meta.pondCount || 0;
  return Math.floor(5000 * Math.pow(2.2, n));
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {boolean}
 */
export function buyPond(engine, meta) {
  const cost = nextPondCost(meta);
  const coins = engine.currency("coins");
  if (!coins || coins.value < cost) return false;
  coins.incrementBy(-cost);
  meta.pondCount = (meta.pondCount || 0) + 1;
  return true;
}

/**
 * ponytail: clamp after producer ticks — breeding pairs can overshoot cap mid-batch.
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 */
export function clampDucksToCapacity(engine, meta) {
  const ducks = engine.resource("ducks");
  if (!ducks) return;
  const cap = pondCapacity(meta);
  if (ducks.count > cap) ducks.state.count = cap;
}
