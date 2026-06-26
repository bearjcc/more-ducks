// @ts-check

/**
 * Exponential bulk cost: sum of base × coeff^i for i in owned..owned+qty-1.
 * Mirrors continuum-engine Producer.calculateCost without touching vendored engine.
 * @param {number} baseCost
 * @param {number} coeff
 * @param {number} owned
 * @param {number} [qty]
 */
export function bulkScaledCost(baseCost, coeff, owned, qty = 1) {
  let total = 0;
  for (let i = 0; i < qty; i++) total += Math.round(baseCost * coeff ** (owned + i));
  return total;
}
