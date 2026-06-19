// @ts-check
/** Answers after which the duck wants a free manual feed (no auto-feeder). */
export const FEED_GATE_THRESHOLD = 10;

/** Coins/sec per answer/sec when auto-feeder is on (electricity allegory). */
export const FEED_OPEX_PER_ANSWER_PER_SEC = 0.04;

/**
 * @param {import("./meta.js").Meta} meta
 * @returns {boolean}
 */
export function hasAutoFeeder(meta) {
  return meta.autoFeederOwned || meta.upgradesOwned.includes("autofeeder");
}

/**
 * @param {import("./meta.js").Meta} meta
 * @returns {boolean}
 */
export function needsFeed(meta) {
  if (hasAutoFeeder(meta)) return false;
  return meta.answersSinceFeed >= FEED_GATE_THRESHOLD;
}

/**
 * @param {import("./meta.js").Meta} meta
 */
export function feedDuck(meta) {
  meta.answersSinceFeed = 0;
}

/**
 * @param {import("./meta.js").Meta} meta
 */
export function recordAnswerForFeed(meta) {
  meta.answersSinceFeed += 1;
}

/**
 * @param {number} answersPerSec
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function feedOpexPerSec(answersPerSec, meta) {
  if (!hasAutoFeeder(meta)) return 0;
  return FEED_OPEX_PER_ANSWER_PER_SEC * Math.max(0, answersPerSec);
}
