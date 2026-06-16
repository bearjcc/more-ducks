// @ts-check
import { ERAS } from "../data/eras.js";

/**
 * Highest era index reached for a given lifetime duck count.
 * @param {number} totalDucksEver
 * @returns {number}
 */
export function eraForDucks(totalDucksEver) {
  let era = 0;
  for (const e of ERAS) {
    if (totalDucksEver >= e.duckThreshold) era = e.id;
  }
  return era;
}
