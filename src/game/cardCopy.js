// @ts-check
import { PRODUCERS } from "../data/producers.js";
import { UPGRADES } from "../data/upgrades.js";
import { HYPE_CAMPAIGNS } from "../data/hype.js";
import { REGIONS } from "../data/regions.js";
import { HYPE_FACTOR } from "./market.js";
import { maxMarketingLevel } from "./hype.js";
import { maxLevelFor } from "./upgrades.js";
import { ENDINGS } from "../data/endings.js";

/**
 * @param {number} n
 */
function fmtNum(n) {
  if (!Number.isFinite(n)) return "?";
  const abs = Math.abs(n);
  if (abs >= 1000) {
    if (abs >= 1e9) return `${+(n / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${+(n / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${+(n / 1e3).toFixed(2)}K`;
  }
  if (abs >= 10) return `${Math.round(n)}`;
  if (abs >= 1) return `${+n.toFixed(2)}`;
  return `${+n.toFixed(3)}`;
}

/**
 * @param {number} mult
 */
function fmtMult(mult) {
  return `×${fmtNum(mult)}`;
}

/**
 * @param {import("../data/upgrades.js").UpgradeDef} def
 */
function capFor(def) {
  const cap = maxLevelFor(def);
  return cap === Infinity ? 25 : cap;
}

/**
 * @param {import("../data/upgrades.js").UpgradeDef} def
 * @returns {string}
 */
export function upgradeEffectLine(def) {
  const e = def.effect;
  const cap = capFor(def);
  switch (e.kind) {
    case "holdRepeat":
      return "Hold Auto to repeat questions";
    case "holdRepeatSpeed":
      return `Auto hold interval ${fmtMult(e.mult)} at Lv ${cap}`;
    case "efficiencyMult":
      return def.purchaseMode === "level"
        ? `Supply efficiency ${fmtMult(e.mult)} at Lv ${cap}`
        : `Supply efficiency ${fmtMult(e.mult)}`;
    case "autoFeeder":
      return "Auto-feed (feed/sec scales with answers/sec)";
    case "coinMult":
      return def.purchaseMode === "level"
        ? `Coin earnings ${fmtMult(e.mult)} at Lv ${cap}`
        : `Coin earnings ${fmtMult(e.mult)}`;
    case "globalMult": {
      const base = def.purchaseMode === "level"
        ? `All duck-makers ${fmtMult(e.mult)} at Lv ${cap}`
        : `All duck-makers ${fmtMult(e.mult)}`;
      if (def.id === "scalinglaws") {
        return `${base}. Unlocks: hold 🦆 to ponder (while fed)`;
      }
      return base;
    }
    case "producerMult": {
      const name = PRODUCERS.find((p) => p.id === e.target)?.name ?? e.target;
      return `${name} output ${fmtMult(e.mult)} at Lv ${cap}`;
    }
    case "clickMult":
      return `Manual tap power ${fmtMult(e.mult)} at Lv ${cap}`;
    case "pondCapacity":
      return `+${e.amount} pond cap per purchase`;
    case "capstone": {
      const title = ENDINGS[e.ending]?.title ?? e.ending;
      return `Capstone ending: ${title}`;
    }
    default:
      return "See stats";
  }
}

/**
 * @param {import("../data/producers.js").ProducerDef} def
 * @returns {string}
 */
export function producerEffectLine(def) {
  const perUnit = (def.productionAmount * 1000) / def.productionTime;
  return `${fmtNum(perUnit)} ducks/sec per unit`;
}

/**
 * @param {import("../data/hype.js").HypeCampaignDef} def
 * @returns {string}
 */
export function hypeEffectLine(def) {
  const hype = def.hypeGain;
  const demand = hype * HYPE_FACTOR;
  if (def.id === "socialmedia") {
    const max = maxMarketingLevel(def);
    return `+${fmtNum(hype)}×Lv hype; −4% hype decay at Lv ${max}`;
  }
  if (def.purchaseMode === "level") {
    const max = maxMarketingLevel(def);
    const peakHype = hype * max;
    const peakDemand = peakHype * HYPE_FACTOR;
    return `Up to +${fmtNum(peakHype)} hype/Lv stack; +${fmtNum(peakDemand)} demand/sec peak at Lv ${max}`;
  }
  return `+${fmtNum(hype)} hype; +${fmtNum(demand)} demand/sec while hype lasts`;
}

/**
 * @param {import("../data/regions.js").RegionDef} def
 * @returns {string}
 */
export function regionEffectLine(def) {
  if (def.orbital) return "Deploy orbital ducks (space ending)";
  if (def.saltwater) return "Deploy saltwater ducks (no pond)";
  if (def.floodCost) return "Flood basin (one-time); no rent after";
  if (def.rentPerDay > 0) {
    return `Rent ${fmtNum(def.rentPerDay)} coins/game-day when active`;
  }
  if (def.unlockCost > 0) return "Unlock region access";
  return "Home pond (owned)";
}

/** ASCII digits or math symbols — flavour text must not include these (emoji ok). */
export const FLAVOUR_MATH_RE = /[0-9×÷+=%]/;

/**
 * @param {string} flavour
 */
export function flavourIsWordsOnly(flavour) {
  return !FLAVOUR_MATH_RE.test(flavour);
}

/**
 * @param {string} effect
 * @param {string} flavour
 */
export function cardCopyMarkup(effect, flavour) {
  const flavourBlock = flavour ? `<p class="card__flavour">${flavour}</p>` : "";
  return `<p class="card__effect">${effect}</p>${flavourBlock}`;
}

/**
 * @returns {{ id: string, flavour: string, effectLine: string }[]}
 */
export function allPurchasableCopy() {
  /** @type {{ id: string, flavour: string, effectLine: string }[]} */
  const out = [];
  for (const u of UPGRADES) {
    out.push({ id: `upgrade:${u.id}`, flavour: u.flavour, effectLine: upgradeEffectLine(u) });
  }
  for (const p of PRODUCERS) {
    out.push({ id: `producer:${p.id}`, flavour: p.flavour, effectLine: producerEffectLine(p) });
  }
  for (const h of HYPE_CAMPAIGNS) {
    out.push({ id: `hype:${h.id}`, flavour: h.flavour, effectLine: hypeEffectLine(h) });
  }
  for (const r of REGIONS) {
    if (r.id === "home") continue;
    out.push({ id: `region:${r.id}`, flavour: r.flavour, effectLine: regionEffectLine(r) });
  }
  return out;
}
