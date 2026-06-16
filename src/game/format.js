// @ts-check
/** Number formatting helpers for display. */

const WORD_UNITS = [
  "", "thousand", "million", "billion", "trillion", "quadrillion",
  "quintillion", "sextillion", "septillion", "octillion", "nonillion",
  "decillion", "undecillion", "duodecillion",
];

const COMPACT_UNITS = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

/** @type {"word"|"compact"|"scientific"} */
let notation = "word";

/** @param {"word"|"compact"|"scientific"} mode */
export function setNotation(mode) {
  notation = mode;
}

/** @returns {"word"|"compact"|"scientific"} */
export function getNotation() {
  return notation;
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
  if (notation === "compact") {
    let u = 0;
    let v = n;
    while (v >= 1000 && u < COMPACT_UNITS.length - 1) {
      v /= 1000;
      u++;
    }
    return trimZeros(v.toFixed(decimals)) + COMPACT_UNITS[u];
  }
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier < WORD_UNITS.length) {
    const scaled = n / Math.pow(1000, tier);
    return trimZeros(scaled.toFixed(decimals)) + " " + WORD_UNITS[tier];
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
