// @ts-check
import ContinuumEngine from "../engine/engine.js";
import { PRODUCERS } from "../data/producers.js";

/**
 * Breadcrumbs each existing duck forages per second (the idle flywheel).
 *
 * Kept deliberately small. Foraged crumbs scale with the *current* flock, which
 * grows roughly exponentially, so the passive crumb supply is the integral of an
 * exponential — left unchecked it outruns the `coeff^N` producer cost curve and
 * the whole five-era arc collapses into ~15 minutes. At this rate the flywheel
 * is a gentle tailwind: the early game is funded by active tapping (a flat
 * 1 crumb/tap, handled in main.js), and full completion lands around ~3 hours,
 * giving the narrative room to breathe. See scripts/sim.mjs for the model.
 */
export const CRUMB_PER_DUCK_PER_SEC = 0.002;

/**
 * Build the game engine with its currencies, the headline resource, and the
 * full producer roster.
 *
 * Design notes:
 * - `ducks` is the headline resource we maximize.
 * - `breadcrumbs` is the spend currency (compute / funding), foraged passively
 *   by the existing ducks — handled in the main loop, not by the engine, since
 *   engine producers can only output resources/producers, not currency.
 * - Purchasing is manual (the engine has no buy method), letting us control
 *   currency deduction and reveal logic ourselves.
 *
 * @returns {InstanceType<typeof ContinuumEngine>}
 */
export function createGame() {
  const engine = new ContinuumEngine();

  engine.createCurrency("breadcrumbs", 0);
  engine.createResource({ key: "ducks", count: 1 });

  for (const p of PRODUCERS) {
    engine.createProducer({
      key: p.id,
      baseCost: { currency: "breadcrumbs", amount: p.baseCost },
      costCoefficient: p.costCoefficient,
      count: 0,
      outputs: {
        resources: {
          ducks: { productionTime: p.productionTime, productionAmount: p.productionAmount },
        },
      },
    });
  }

  return engine;
}

/**
 * Total breadcrumb cost to buy `qty` units of a producer (read-only).
 * @param {any} engine
 * @param {string} id
 * @param {number} qty
 * @returns {number}
 */
export function bulkCost(engine, id, qty) {
  const prod = engine.producer(id);
  if (!prod || qty <= 0) return Infinity;
  const cost = prod.calculateCost(qty);
  return cost ? cost.price : Infinity;
}

/**
 * How many units of a producer the player can afford right now.
 * @param {any} engine
 * @param {string} id
 * @param {number} currencyValue
 * @returns {number}
 */
export function maxAffordable(engine, id, currencyValue) {
  if (bulkCost(engine, id, 1) > currencyValue) return 0;
  let lo = 1;
  let hi = 2;
  while (bulkCost(engine, id, hi) <= currencyValue && hi < 1_000_000) hi *= 2;
  hi = Math.min(hi, 1_000_000);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (bulkCost(engine, id, mid) <= currencyValue) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Attempt to buy units of a producer.
 * @param {any} engine
 * @param {string} id
 * @param {number} [qty]
 * @returns {number} units bought (0 if purchase failed)
 */
export function buyProducer(engine, id, qty = 1) {
  const prod = engine.producer(id);
  if (!prod || qty <= 0) return 0;

  const cost = bulkCost(engine, id, qty);
  const crumbs = engine.currency("breadcrumbs");
  if (!isFinite(cost) || crumbs.value < cost) return 0;

  const wasZero = prod.count === 0;
  crumbs.incrementBy(-cost);
  prod.incrementBy(qty);
  if (wasZero) prod.resetTimers();
  return qty;
}

/**
 * Total ducks produced per second across all owned producers (for display).
 * @param {any} engine
 * @returns {number}
 */
export function ducksPerSecond(engine) {
  let dps = 0;
  for (const p of PRODUCERS) {
    const prod = engine.producer(p.id);
    if (prod && prod.count > 0) {
      // Read the live output amount so upgrade multipliers are reflected.
      const amount = prod.outputs.resources.ducks.productionAmount;
      dps += (prod.count * amount) / (p.productionTime / 1000);
    }
  }
  return dps;
}
