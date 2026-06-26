// @ts-check
/** Number formatting helpers for display. */

/** K/M/B/T then aa–zz (idle-game suffix / tier notation). */
const HEAD_SUFFIXES = ["", "K", "M", "B", "T"];

/** @type {"suffix"|"scientific"} */
let notation = "suffix";

/** @param {unknown} mode */
function normalizeNotation(mode) {
  if (mode === "scientific") return "scientific";
  return "suffix";
}

/** @param {"suffix"|"scientific"|"word"|"compact"|string} mode */
export function setNotation(mode) {
  notation = normalizeNotation(mode);
}

/** @returns {"suffix"|"scientific"} */
export function getNotation() {
  return notation;
}

/**
 * Suffix for magnitude tier (floor(log10(n) / 3)).
 * ponytail: two-letter aa–zz only; beyond that formatNumber falls back to scientific.
 * @param {number} tier
 * @returns {string|null}
 */
export function suffixForTier(tier) {
  if (tier < HEAD_SUFFIXES.length) return HEAD_SUFFIXES[tier];
  const u = tier - HEAD_SUFFIXES.length;
  const hi = Math.floor(u / 26);
  const lo = u % 26;
  if (hi >= 26) return null;
  return String.fromCharCode(97 + hi) + String.fromCharCode(97 + lo);
}

/**
 * Format a number for display. Small values are shown plainly, larger ones use
 * the active notation mode. Designed to stay readable on a phone.
 * @param {number} n
 * @param {number} [decimals]
 * @returns {string}
 */
export function formatNumber(n, decimals = 2) {
  if (!isFinite(n)) return "∞";
  if (n < 0) return "-" + formatNumber(-n, decimals);
  if (n < 1000) {
    return Number.isInteger(n) ? String(n) : trimZeros(n.toFixed(decimals));
  }
  if (notation === "scientific") {
    const exp = Math.floor(Math.log10(n));
    const mantissa = trimZeros((n / Math.pow(10, exp)).toFixed(decimals));
    return `${mantissa}e${exp}`;
  }
  const tier = Math.floor(Math.log10(n) / 3);
  const suffix = suffixForTier(tier);
  if (!suffix) {
    const exp = Math.floor(Math.log10(n));
    const mantissa = trimZeros((n / Math.pow(10, exp)).toFixed(decimals));
    return `${mantissa}e${exp}`;
  }
  const scaled = n / Math.pow(1000, tier);
  return trimZeros(scaled.toFixed(decimals)) + suffix;
}

/**
 * @param {string} s
 * @returns {string}
 */
function trimZeros(s) {
  return s.indexOf(".") >= 0 ? s.replace(/\.?0+$/, "") : s;
}
