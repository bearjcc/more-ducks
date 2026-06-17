// @ts-check
import { DUCKS } from "../data/ducks.js";

/** @typedef {{ kind: "pondMult", mult: number }
 *   | { kind: "crumbUpkeep", mult: number }
 *   | { kind: "produceMult", mult: number }
 *   | { kind: "scoreInflate", mult: number }} Demand */

/** @typedef {{ pondMult: number, crumbUpkeep: number, produceMult: number, scoreInflate: number }} DexMods */

const DUCK_BY_ID = Object.fromEntries(DUCKS.map((d) => [d.id, d]));

/** @returns {DexMods} */
export function defaultDexMods() {
  return { pondMult: 1, crumbUpkeep: 1, produceMult: 1, scoreInflate: 1 };
}

/**
 * Stack catalogued-duck demands. Collection is the excuse engine: cute ducks
 * impose plausible new costs.
 * @param {import("./meta.js").Meta} meta
 * @returns {DexMods}
 */
export function dexMods(meta) {
  const out = defaultDexMods();
  for (const id of meta.dexUnlocked) {
    const d = DUCK_BY_ID[id];
    if (!d?.demand) continue;
    switch (d.demand.kind) {
      case "pondMult": out.pondMult *= d.demand.mult; break;
      case "crumbUpkeep": out.crumbUpkeep *= d.demand.mult; break;
      case "produceMult": out.produceMult *= d.demand.mult; break;
      case "scoreInflate": out.scoreInflate *= d.demand.mult; break;
    }
  }
  return out;
}

/**
 * @param {import("../data/ducks.js").DuckDef} duck
 * @returns {string}
 */
export function demandLabel(duck) {
  return duck.demandBlurb || "";
}
