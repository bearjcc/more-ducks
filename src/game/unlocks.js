// @ts-check

import { QUACKMARKS } from "../data/quackmarks.js";

import { HYPE_CAMPAIGNS } from "../data/hype.js";

import { RESEARCH_UPGRADES } from "../data/research.js";

import { quackmarkVisible } from "./quackmarks.js";

import { campaignVisible } from "./hype.js";



/** Coins needed to reveal a purchase row (10% of cost). */

export const PURCHASE_REVEAL_RATIO = 0.1;



/** Steady Beak — gates Upgrades tab reveal threshold. */

export const STEADY_BEAK_COST = 80;



/**

 * @param {number} balance

 * @param {number} cost

 * @param {boolean} owned

 */

export function purchaseRevealed(balance, cost, owned) {

  return owned || balance >= cost * PURCHASE_REVEAL_RATIO;

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

  return flockTabUnlocked(meta) || meta.questionsAnswered >= 3 || answersPerSec > 0;

}



/**

 * @param {import("./meta.js").Meta} meta

 * @param {number} coins

 * @param {any} engine

 */

export function upgradesTabUnlocked(meta, coins, engine) {

  if (!flockTabUnlocked(meta)) return false;

  const anyProducer = Object.values(engine.producers).some((p) => p.count > 0);

  return anyProducer || coins >= STEADY_BEAK_COST * PURCHASE_REVEAL_RATIO;

}



/**

 * @param {import("./meta.js").Meta} meta

 * @param {number} coins

 */

export function hypeTabUnlocked(meta, coins) {

  if (meta.era >= 1) return true;

  if (!flockTabUnlocked(meta)) return false;

  const cheapest = HYPE_CAMPAIGNS[0];

  if (campaignVisible(meta, cheapest)) return true;

  return coins >= cheapest.cost * PURCHASE_REVEAL_RATIO;

}



/**

 * @param {import("./meta.js").Meta} meta

 * @param {number} research

 */

export function researchTabUnlocked(meta, research = 0) {

  if (!flockTabUnlocked(meta)) return false;

  return RESEARCH_UPGRADES.some((def) => {

    const owned = meta.upgradesOwned.includes(def.id);

    return (def.era <= meta.era || owned)

      && purchaseRevealed(research, def.cost, owned);

  });

}



/**

 * @param {import("./meta.js").Meta} meta

 */

export function marksSectionUnlocked(meta) {

  if (meta.era >= 1) return true;

  return QUACKMARKS.some((q) => quackmarkVisible(meta, q));

}



/** @deprecated Use marksSectionUnlocked — marks merged into More tab. */

export const marksTabUnlocked = marksSectionUnlocked;



/**

 * @param {import("./meta.js").Meta} meta

 */

export function moreTabUnlocked(meta) {

  if (meta.era >= 2) return true;

  return meta.answerdexSeen.length >= 3;

}



/**

 * @param {string} tab

 * @param {import("./meta.js").Meta} meta

 * @param {number} coins

 * @param {any} engine

 * @param {number} [answersPerSec]

 * @param {number} [research]

 */

export function tabUnlocked(tab, meta, coins, engine, answersPerSec = 0, research = 0) {

  switch (tab) {

    case "dashboard":

      return dashboardTabUnlocked(meta, answersPerSec);

    case "flock":

      return flockTabUnlocked(meta);

    case "hype":

      return hypeTabUnlocked(meta, coins);

    case "upgrades":

      return upgradesTabUnlocked(meta, coins, engine);

    case "research":

      return researchTabUnlocked(meta, research);

    case "more":

      return moreTabUnlocked(meta);

    default:

      return false;

  }

}



/**

 * @param {import("./meta.js").Meta} meta

 * @param {number} coins

 * @param {any} engine

 * @param {number} [answersPerSec]

 * @param {number} [research]

 */

export function anyTabUnlocked(meta, coins, engine, answersPerSec = 0, research = 0) {

  return tabUnlocked("dashboard", meta, coins, engine, answersPerSec, research)

    || tabUnlocked("flock", meta, coins, engine, answersPerSec, research)

    || tabUnlocked("hype", meta, coins, engine, answersPerSec, research)

    || tabUnlocked("upgrades", meta, coins, engine, answersPerSec, research)

    || tabUnlocked("research", meta, coins, engine, answersPerSec, research)

    || tabUnlocked("more", meta, coins, engine, answersPerSec, research);

}

