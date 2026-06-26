// @ts-check
import { actTierForAct } from "../game/progression.js";
/**
 * @param {number} act
 */
export function applyActTier(act) {
  document.body.dataset.actTier = actTierForAct(act);
}
