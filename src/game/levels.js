// @ts-check

/**
 * @param {import("./meta.js").Meta} meta
 * @param {string} id
 * @returns {number}
 */
export function upgradeLevel(meta, id) {
  return meta.upgradeLevels[id] ?? 0;
}

/**
 * @param {import("./meta.js").Meta} meta
 * @param {string} id
 * @returns {number}
 */
export function marketingLevel(meta, id) {
  return meta.marketingLevels[id] ?? 0;
}

/**
 * Total upgrade purchases (sum of levels) for unlock gates / score.
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function totalUpgradePurchases(meta) {
  let n = 0;
  for (const k in meta.upgradeLevels) n += meta.upgradeLevels[k];
  return n;
}
