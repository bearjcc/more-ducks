// @ts-check
import { QUACKS, TIERS } from "../data/quacks.js";

const TOTAL_WEIGHT = QUACKS.reduce((s, [, w]) => s + w, 0);

/** @type {string|null} */
let lastQuack = null;

/**
 * @param {number} score
 * @returns {(q: string) => string}
 */
function tierWrap(score) {
  let wrap = TIERS[0].wrap;
  for (const t of TIERS) {
    if (score >= t.min) wrap = t.wrap;
  }
  return wrap;
}

/**
 * Weighted quack draw, no consecutive repeat, then verbosity tier by score.
 * @param {number} score
 * @param {() => number} [rng]
 * @returns {string}
 */
export function pickQuack(score, rng = Math.random) {
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const roll = rng() * TOTAL_WEIGHT;
    let acc = 0;
    for (const [text, weight] of QUACKS) {
      acc += weight;
      if (roll <= acc && text !== lastQuack) {
        lastQuack = text;
        return tierWrap(score)(text);
      }
    }
  }
  for (const [text] of QUACKS) {
    if (text !== lastQuack) {
      lastQuack = text;
      return tierWrap(score)(text);
    }
  }
  lastQuack = "quack";
  return tierWrap(score)("quack");
}

/** Reset repeat guard (tests). */
export function resetQuackState() {
  lastQuack = null;
}
