// @ts-check

import { totalUpgradePurchases } from "./levels.js";

/** Coins needed to reveal a purchase row (10% of cost). */
export const PURCHASE_REVEAL_RATIO = 0.1;

/** Steady Beak — gates Upgrades tab reveal threshold. */
export const STEADY_BEAK_COST = 25;

/**
 * @param {number} balance
 * @param {number} cost
 * @param {boolean} ownedOrVisible
 */
export function purchaseRevealed(balance, cost, ownedOrVisible) {
  return ownedOrVisible || balance >= cost * PURCHASE_REVEAL_RATIO;
}

/**
 * @param {import("./meta.js").Meta} meta
 */
export function upgradesTabUnlocked(meta) {
  return meta.questionsAnswered >= 3 && meta.manualFeeds >= 1;
}

/**
 * @param {import("./meta.js").Meta} meta
 */
export function flockTabUnlocked(meta) {
  return meta.questionsAnswered >= 3 && meta.manualFeeds >= 1;
}

/**
 * @param {import("./meta.js").Meta} meta
 * @param {number} [answersPerSec]
 */
export function dashboardTabUnlocked(meta, answersPerSec = 0) {
  return flockTabUnlocked(meta) || answersPerSec > 0;
}

/**
 * @param {import("./meta.js").Meta} meta
 * @param {number} coins
 */
export function hypeTabUnlocked(meta, coins) {
  void coins;
  if (!flockTabUnlocked(meta)) return false;
  return totalUpgradePurchases(meta) > 0;
}

/**
 * @param {import("./meta.js").Meta} meta
 */
export function regionsTabUnlocked(meta) {
  return meta.era >= 4;
}

/**
 * @param {import("./meta.js").Meta} meta
 */
export function collectionsTabUnlocked(meta) {
  if (meta.era >= 2) return true;
  return meta.answerdexSeen.length >= 3;
}

/**
 * Every dock tab visible — gates late-game meta questions in the Auto pool.
 * @param {import("./meta.js").Meta} meta
 * @param {number} coins
 * @param {any} engine
 * @param {number} [answersPerSec]
 */
export function allTabsUnlocked(meta, coins, engine, answersPerSec = 0) {
  return tabUnlocked("dashboard", meta, coins, engine, answersPerSec)
    && tabUnlocked("flock", meta, coins, engine, answersPerSec)
    && tabUnlocked("hype", meta, coins, engine, answersPerSec)
    && tabUnlocked("upgrades", meta, coins, engine, answersPerSec)
    && tabUnlocked("regions", meta, coins, engine, answersPerSec)
    && tabUnlocked("collections", meta, coins, engine, answersPerSec);
}

/**
 * @param {string} tab
 * @param {import("./meta.js").Meta} meta
 * @param {number} coins
 * @param {any} engine
 * @param {number} [answersPerSec]
 */
export function tabUnlocked(tab, meta, coins, engine, answersPerSec = 0) {
  switch (tab) {
    case "dashboard":
      return dashboardTabUnlocked(meta, answersPerSec);
    case "flock":
      return flockTabUnlocked(meta);
    case "hype":
      return hypeTabUnlocked(meta, coins);
    case "upgrades":
      return upgradesTabUnlocked(meta);
    case "regions":
      return regionsTabUnlocked(meta);
    case "collections":
      return collectionsTabUnlocked(meta);
    default:
      return false;
  }
}

/**
 * @param {import("./meta.js").Meta} meta
 * @param {number} coins
 * @param {any} engine
 * @param {number} [answersPerSec]
 */
export function anyTabUnlocked(meta, coins, engine, answersPerSec = 0) {
  return tabUnlocked("dashboard", meta, coins, engine, answersPerSec)
    || tabUnlocked("flock", meta, coins, engine, answersPerSec)
    || tabUnlocked("hype", meta, coins, engine, answersPerSec)
    || tabUnlocked("upgrades", meta, coins, engine, answersPerSec)
    || tabUnlocked("regions", meta, coins, engine, answersPerSec)
    || tabUnlocked("collections", meta, coins, engine, answersPerSec);
}
