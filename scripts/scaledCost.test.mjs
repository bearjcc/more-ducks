import { bulkScaledCost } from "../src/game/scaledCost.js";

const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};

assert(bulkScaledCost(12, 1.15, 0, 1) === 12, "first unit is base cost");
assert(bulkScaledCost(12, 1.15, 0, 2) === 12 + Math.round(12 * 1.15), "bulk sums scaled steps");
assert(bulkScaledCost(25, 1.15, 3, 1) === Math.round(25 * 1.15 ** 3), "owned index shifts cost");

console.log("scaledCost.test.mjs: all passed");
