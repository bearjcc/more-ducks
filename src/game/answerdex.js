// @ts-check
import { BASIC_ANSWERS, isCollectibleAnswer } from "../data/quacks.js";

/** Collectible answers in the Answerdex (profession emoji + rares). */
export const ANSWERDEX_TOTAL = BASIC_ANSWERS.filter(([t]) => isCollectibleAnswer(t)).length;

/**
 * @param {import("./meta.js").Meta} meta
 * @param {string} baseAnswer
 * @returns {boolean} true if newly discovered
 */
export function recordAnswerdex(meta, baseAnswer) {
  if (!baseAnswer || !isCollectibleAnswer(baseAnswer)) return false;
  if (meta.answerdexSeen.includes(baseAnswer)) return false;
  meta.answerdexSeen.push(baseAnswer);
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
 * @param {string} baseAnswer
 * @returns {boolean}
 */
export function isCatalogAnswer(baseAnswer) {
  return BASIC_ANSWERS.some(([text]) => text === baseAnswer);
}

/** @deprecated use isCatalogAnswer */
export const isCatalogQuack = isCatalogAnswer;
