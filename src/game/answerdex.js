// @ts-check
import { QUACKS } from "../data/quacks.js";

/** All discoverable base quack strings (table entries). */
export const ANSWERDEX_TOTAL = QUACKS.length;

/**
 * @param {import("./meta.js").Meta} meta
 * @param {string} baseQuack
 * @returns {boolean} true if newly discovered
 */
export function recordAnswerdex(meta, baseQuack) {
  if (!baseQuack || meta.answerdexSeen.includes(baseQuack)) return false;
  meta.answerdexSeen.push(baseQuack);
  return true;
}

/**
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function answerdexCount(meta) {
  return meta.answerdexSeen.length;
}

/**
 * @param {string} baseQuack
 * @returns {boolean}
 */
export function isCatalogQuack(baseQuack) {
  return QUACKS.some(([text]) => text === baseQuack);
}
