// @ts-check
/** Number formatting helpers for display. */

const UNITS = [
  "", "thousand", "million", "billion", "trillion", "quadrillion",
  "quintillion", "sextillion", "septillion", "octillion", "nonillion",
  "decillion", "undecillion", "duodecillion",
];

/**
 * Format a number for display. Small values are shown plainly, larger ones use
 * short-scale names, and anything past the named tiers falls back to scientific
 * notation. Designed to stay readable on a phone.
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
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier < UNITS.length) {
    const scaled = n / Math.pow(1000, tier);
    return trimZeros(scaled.toFixed(decimals)) + " " + UNITS[tier];
  }
  const exp = Math.floor(Math.log10(n));
  const mantissa = trimZeros((n / Math.pow(10, exp)).toFixed(decimals));
  return `${mantissa}e${exp}`;
}

/**
 * @param {string} s
 * @returns {string}
 */
function trimZeros(s) {
  return s.indexOf(".") >= 0 ? s.replace(/\.?0+$/, "") : s;
}
