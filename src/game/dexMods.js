// @ts-check

import { DUCKS } from "../data/ducks.js";

/** @typedef {{ kind: "coinUpkeep", mult: number }
 *   | { kind: "hypeDecay", mult: number }
 *   | { kind: "coherenceLift", add: number }
 *   | { kind: "questionIntake", add: number }
 *   | { kind: "produceMult", mult: number }
 *   | { kind: "scoreInflate", mult: number }} Demand */

/** @typedef {{ coinUpkeep: number, hypeDecayMult: number, coherenceAdd: number, questionIntake: number, produceMult: number, scoreInflate: number }} DexMods */

const DUCK_BY_ID = Object.fromEntries(DUCKS.map((d) => [d.id, d]));

/** @returns {DexMods} */
export function defaultDexMods() {
  return {
    coinUpkeep: 1,
    hypeDecayMult: 1,
    coherenceAdd: 0,
    questionIntake: 0,
    produceMult: 1,
    scoreInflate: 1,
  };
}

/**
 * Stack catalogued-duck demands. Collection is the excuse engine: cute ducks
 * impose plausible new costs on the two-sided market (economy.md §8).
 * @param {import("./meta.js").Meta} meta
 * @returns {DexMods}
 */
export function dexMods(meta) {
  const out = defaultDexMods();
  for (const id of meta.dexUnlocked) {
    const d = DUCK_BY_ID[id];
    if (!d?.demand) continue;
    switch (d.demand.kind) {
      case "coinUpkeep": out.coinUpkeep *= d.demand.mult; break;
      case "hypeDecay": out.hypeDecayMult *= d.demand.mult; break;
      case "coherenceLift": out.coherenceAdd += d.demand.add; break;
      case "questionIntake": out.questionIntake += d.demand.add; break;
      case "produceMult": out.produceMult *= d.demand.mult; break;
      case "scoreInflate": out.scoreInflate *= d.demand.mult; break;
    }
  }
  return out;
}

/**
 * @param {import("./meta.js").Meta} meta
 * @param {DexMods} dex
 * @returns {number} Coherence in [0, 1] after Duckdex lifts.
 */
export function effectiveCoherence(meta, dex) {
  return Math.min(1, meta.coherence + dex.coherenceAdd);
}

/**
 * @param {import("../data/ducks.js").DuckDef} duck
 * @returns {string}
 */
export function demandLabel(duck) {
  return duck.demandBlurb || "";
}
