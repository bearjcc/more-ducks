// @ts-check
import { QUACKMARKS } from "../data/quackmarks.js";

/**
 * @param {import("./meta.js").Meta} meta
 * @param {import("../data/quackmarks.js").QuackmarkDef} def
 * @returns {boolean}
 */
export function quackmarkVisible(meta, def) {
  if (meta.quackmarksOwned.includes(def.id)) return true;
  if (def.era > meta.era) return false;
  if (def.needsDex && !meta.dexUnlocked.includes(def.needsDex)) return false;
  return true;
}

/**
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function quackmarkScoreMult(meta) {
  let mult = 1;
  for (const q of QUACKMARKS) {
    if (meta.quackmarksOwned.includes(q.id)) mult *= q.scoreMult;
  }
  return mult;
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @param {string} id
 * @returns {import("../data/quackmarks.js").QuackmarkDef|null}
 */
export function buyQuackmark(engine, meta, id) {
  if (meta.quackmarksOwned.includes(id)) return null;
  const q = QUACKMARKS.find((x) => x.id === id);
  if (!q || !quackmarkVisible(meta, q)) return null;

  const crumbs = engine.currency("breadcrumbs");
  if (crumbs.value < q.cost) return null;

  crumbs.incrementBy(-q.cost);
  meta.quackmarksOwned.push(id);
  return q;
}
