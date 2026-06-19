// @ts-check
import { ACTS } from "../data/eras.js";

/**
 * @typedef {object} ProgressStats
 * @property {number} [totalDucksEver]
 * @property {number} [answersTotal]
 */

/**
 * Highest act index reached for lifetime ducks and/or answers (OR gates).
 * @param {ProgressStats} stats
 * @returns {number}
 */
export function actForStats(stats) {
  const ducks = stats.totalDucksEver ?? 0;
  const answers = stats.answersTotal ?? 0;
  let act = 0;
  for (const a of ACTS) {
    if (ducks >= a.duckThreshold || answers >= a.answersThreshold) act = a.id;
  }
  return act;
}

/**
 * @param {number} totalDucksEver
 * @returns {number}
 */
export function eraForDucks(totalDucksEver) {
  return actForStats({ totalDucksEver });
}

/**
 * UI shell tier: chat-first early, pond dashboard mid, empire late.
 * @param {number} act
 * @returns {"chat"|"pond"|"empire"}
 */
export function actTierForAct(act) {
  if (act <= 1) return "chat";
  if (act <= 3) return "pond";
  return "empire";
}
