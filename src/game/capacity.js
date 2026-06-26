// @ts-check
/** Ducks per owned pond beyond the starter (a light early-game headroom booster). */
export const DUCKS_PER_POND = 50;

/** Starter pond capacity. */
export const BASE_POND_CAPACITY = 12;

/**
 * Habitat auto-expands to this fraction above the flock you've raised, so the
 * cap tracks your producers instead of walling them. The FLOCK is the supply
 * engine; ponds + upgrades add headroom on top (and matter most early, when the
 * flock is small). >1 so the cap never throttles the live flock.
 */
export const FLOCK_HEADROOM = 1.15;

/**
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function pondCapacity(meta) {
  const ponds = 1 + (meta.pondCount || 0);
  const bonus = meta.pondCapacityBonus || 0;
  const pondRoom = BASE_POND_CAPACITY + ponds * DUCKS_PER_POND + bonus;
  const flockRoom = Math.ceil((meta.totalDucksEver || 1) * FLOCK_HEADROOM);
  return Math.max(pondRoom, flockRoom);
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
