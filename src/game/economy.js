// @ts-check
import ContinuumEngine from "../engine/engine.js";
import { PRODUCERS } from "../data/producers.js";

/** Breadcrumbs each existing duck forages per second (the flywheel). */
export const CRUMB_PER_DUCK_PER_SEC = 0.2;

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
 * Attempt to buy one unit of a producer.
 * @param {any} engine
 * @param {string} id
 * @returns {boolean} true if the purchase succeeded
 */
export function buyProducer(engine, id) {
  const prod = engine.producer(id);
  if (!prod) return false;

  const cost = prod.calculateCost(1).price;
  const crumbs = engine.currency("breadcrumbs");
  if (!isFinite(cost) || crumbs.value < cost) return false;

  // A producer's output timer is seeded at construction. When the first unit is
  // bought we reset it so it doesn't instantly dump a batch for all the elapsed
  // idle time. Only on the first unit, to preserve partial progress afterwards.
  const wasZero = prod.count === 0;
  crumbs.incrementBy(-cost);
  prod.incrementBy(1);
  if (wasZero) prod.resetTimers();
  return true;
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
      dps += (prod.count * p.productionAmount) / (p.productionTime / 1000);
    }
  }
  return dps;
}
