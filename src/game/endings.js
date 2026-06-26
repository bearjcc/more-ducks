// @ts-check
import { COMPETITOR_BIRDS, COMPETITOR_MS, ENDINGS, HORIZONTAL_CAPSTONE, VERTICAL_CAPSTONE } from "../data/endings.js";
import { hasRentedRegions } from "./regions.js";
import { upgradeLevel } from "./levels.js";

/**
 * @param {import("./meta.js").Meta} meta
 * @returns {boolean}
 */
export function hasCapstone(meta) {
  return upgradeLevel(meta, VERTICAL_CAPSTONE) >= 1
    || upgradeLevel(meta, HORIZONTAL_CAPSTONE) >= 1
    || meta.spaceDeployed;
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {string|null}
 */
export function checkEndings(engine, meta) {
  if (meta.endingId || meta.flags.ended) return meta.endingId || null;

  const coins = engine.currency("coins")?.value ?? 0;
  if (coins < 0 && hasRentedRegions(meta)) return "bankrupt";

  if (upgradeLevel(meta, VERTICAL_CAPSTONE) >= 1) return "singularity";
  if (upgradeLevel(meta, HORIZONTAL_CAPSTONE) >= 1) return "swarm";
  if (meta.spaceDeployed) return "space";

  const elapsed = Date.now() - (meta.gameStartMs || Date.now());
  if (elapsed >= COMPETITOR_MS && !hasCapstone(meta)) return "competitor";

  return null;
}

/**
 * @param {import("./meta.js").Meta} meta
 * @returns {string}
 */
export function competitorBirdName(meta) {
  if (meta.competitorBird) return meta.competitorBird;
  const bird = COMPETITOR_BIRDS[Math.floor(Math.random() * COMPETITOR_BIRDS.length)];
  meta.competitorBird = bird;
  return bird;
}

/**
 * @param {string} id
 * @returns {import("../data/endings.js").EndingDef|undefined}
 */
export { VERTICAL_CAPSTONE, HORIZONTAL_CAPSTONE, COMPETITOR_MS };

/**
 * @param {string} id
 * @returns {import("../data/endings.js").EndingDef|undefined}
 */
export function endingDef(id) {
  return ENDINGS[id];
}
