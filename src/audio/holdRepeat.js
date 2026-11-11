// @ts-check
/** Hold-repeat quack throttle: first tick full, repeats soft pip only. */

/** @type {boolean} */
let holding = false;

/** Throttle full quacks during hold (ms). */
export const HOLD_FULL_QUACK_MIN_MS = 1200;

/** @param {boolean} active */
export function setHoldRepeatActive(active) {
  holding = active;
}

/**
 * @param {number} [now]
 * @returns {"full"|"pip"|"skip"}
 */
export function quackKindForHoldTick(now = Date.now()) {
  if (!holding) return "full";
  if (now - lastFullMs >= HOLD_FULL_QUACK_MIN_MS) {
    lastFullMs = now;
    return "full";
  }
  return "pip";
}

/** @type {number} */
let lastFullMs = 0;

/** Call when a non-hold quack plays. */
export function markFullQuackPlayed(now = Date.now()) {
  lastFullMs = now;
}

/** Reset state (tests). */
export function resetHoldRepeatState() {
  holding = false;
  lastFullMs = 0;
}
