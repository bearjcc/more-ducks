// @ts-check
import { PRODUCERS } from "../data/producers.js";
import { UPGRADES } from "../data/upgrades.js";
import { HYPE_CAMPAIGNS } from "../data/hype.js";
import { REGIONS } from "../data/regions.js";
import { HYPE_FACTOR } from "./market.js";
import { maxMarketingLevel, campaignHypeGain } from "./hype.js";
import { maxLevelFor } from "./upgrades.js";
import { ENDINGS } from "../data/endings.js";
import { formatNumber } from "./format.js";
import { rentCoinsPerGameDayLabel } from "./regions.js";

/**
 * @param {number} mult
 */
function fmtMult(mult) {
  if (!Number.isFinite(mult) || mult === 1) return "×1";
  return `×${formatNumber(mult, 2)}`;
}

/**
 * @param {number} targetMult
 * @param {number} level
 * @param {number} maxLevel
 */
export function stackedMultAtLevel(targetMult, level, maxLevel) {
  if (level <= 0) return 1;
  if (maxLevel <= 0) return 1;
  const perLevel = targetMult ** (1 / maxLevel);
  return perLevel ** Math.min(level, maxLevel);
}

/**
 * @param {number} before
 * @param {number} after
 */
function nextStepPct(before, after) {
  if (before <= 0) return 0;
  return Math.round((after / before - 1) * 100);
}

const BASE_HOLD_MS = 450;
const MIN_HOLD_MS = 120;

/**
 * @param {number} targetMult
 * @param {number} level
 * @param {number} cap
 */
function holdIntervalMs(targetMult, level, cap) {
  const m = stackedMultAtLevel(targetMult, level, cap);
  return Math.max(MIN_HOLD_MS, Math.floor(BASE_HOLD_MS * m));
}

/**
 * @param {number} pct
 */
function fmtDecayPct(pct) {
  if (pct <= 0) return "0%";
  if (pct < 1) return `${formatNumber(pct, 1)}%`;
  return `${Math.round(pct)}%`;
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
 * @param {number} [level]
 * @returns {string}
 */
export function upgradeEffectLine(def, level = 0) {
  const e = def.effect;
  const cap = capFor(def);
  switch (e.kind) {
    case "holdRepeat":
      return "Hold Auto to repeat questions";
    case "holdRepeatSpeed": {
      const nowMs = holdIntervalMs(e.mult, level, cap);
      const nextMs = holdIntervalMs(e.mult, level + 1, cap);
      return level >= cap
        ? `Auto hold every ${formatNumber(nowMs, 0)}ms · max`
        : `Next: Auto hold every ${formatNumber(nextMs, 0)}ms (now ${formatNumber(nowMs, 0)}ms)`;
    }
    case "efficiencyMult": {
      const now = stackedMultAtLevel(e.mult, level, cap);
      const nxt = stackedMultAtLevel(e.mult, level + 1, cap);
      const pct = nextStepPct(now, nxt);
      return `Next: +${pct}% supply efficiency · now ${fmtMult(now)}`;
    }
    case "autoFeeder":
      return "Auto-feed (feed/sec scales with answers/sec)";
    case "coinMult": {
      const now = stackedMultAtLevel(e.mult, level, cap);
      const nxt = stackedMultAtLevel(e.mult, level + 1, cap);
      const pct = nextStepPct(now, nxt);
      return def.purchaseMode === "level"
        ? `Next: +${pct}% coin earnings · now ${fmtMult(now)}`
        : `Coin earnings ${fmtMult(e.mult)}`;
    }
    case "globalMult": {
      const now = stackedMultAtLevel(e.mult, level, cap);
      const nxt = stackedMultAtLevel(e.mult, level + 1, cap);
      const pct = nextStepPct(now, nxt);
      const base = def.purchaseMode === "level"
        ? `Next: +${pct}% all duck-makers · now ${fmtMult(now)}`
        : `All duck-makers ${fmtMult(e.mult)}`;
      if (def.id === "scalinglaws") {
        return `${base}. Unlocks: hold 🦆 to ponder (while fed)`;
      }
      return base;
    }
    case "producerMult": {
      const name = PRODUCERS.find((p) => p.id === e.target)?.name ?? e.target;
      const now = stackedMultAtLevel(e.mult, level, cap);
      const nxt = stackedMultAtLevel(e.mult, level + 1, cap);
      const pct = nextStepPct(now, nxt);
      return `Next: +${pct}% ${name} output · now ${fmtMult(now)}`;
    }
    case "clickMult": {
      const now = stackedMultAtLevel(e.mult, level, cap);
      const nxt = stackedMultAtLevel(e.mult, level + 1, cap);
      const pct = nextStepPct(now, nxt);
      return `Next: +${pct}% manual tap power · now ${fmtMult(now)}`;
    }
    case "pondCapacity":
      return level > 0
        ? `+${e.amount} pond cap each · owned ×${formatNumber(level, 0)}`
        : `+${e.amount} pond cap each`;
    case "capstone": {
      const title = ENDINGS[e.ending]?.title ?? e.ending;
      return `Capstone ending: ${title}`;
    }
    default:
      return "See stats";
  }
}

/**
 * @param {number} ducksPerSecPerUnit
 * @returns {string}
 */
export function producerRateLine(ducksPerSecPerUnit) {
  return `${formatNumber(ducksPerSecPerUnit, 2)} ducks/sec each`;
}

/**
 * @param {import("../data/producers.js").ProducerDef} def
 * @param {number} [ducksPerSecPerUnit]
 * @returns {string}
 */
export function producerEffectLine(def, ducksPerSecPerUnit) {
  const perUnit = ducksPerSecPerUnit ?? (def.productionAmount * 1000) / def.productionTime;
  return producerRateLine(perUnit);
}

/**
 * @param {import("../data/hype.js").HypeCampaignDef} def
 * @param {number} [level]
 * @returns {string}
 */
export function hypeEffectLine(def, level = 0) {
  const cap = maxMarketingLevel(def);
  const nextGain = campaignHypeGain(def, level + 1);
  const demand = nextGain * HYPE_FACTOR;
  if (def.id === "socialmedia") {
    const decayRaw = 100 * (0.04 * Math.min(level + 1, cap) / cap);
    const decayCut = fmtDecayPct(decayRaw);
    return level >= cap
      ? `Hype decay −${decayCut} · max Lv ${cap}`
      : `Next: +${formatNumber(nextGain, 0)} hype · −${decayCut} hype decay at Lv ${level + 1}`;
  }
  if (def.purchaseMode === "level") {
    const totalHype = campaignHypeGain(def, level + 1);
    return level >= cap
      ? `+${formatNumber(campaignHypeGain(def, cap), 0)} hype/Lv stack · max`
      : `Next: +${formatNumber(totalHype, 0)} hype (+${formatNumber(totalHype * HYPE_FACTOR, 1)} demand/sec peak)`;
  }
  return `+${formatNumber(nextGain, 0)} hype (+${formatNumber(demand, 1)} demand/sec peak)`;
}

/**
 * @param {import("../data/regions.js").RegionDef} def
 * @param {{ rented?: boolean, unlocked?: boolean, flooded?: boolean }} [state]
 * @returns {string}
 */
export function regionEffectLine(def, state = {}) {
  if (def.orbital) return "Deploy orbital ducks (space ending)";
  if (def.saltwater) return "Deploy saltwater ducks (no pond cap)";
  if (def.floodCost) {
    if (!state.unlocked) {
      return `Unlock ${formatNumber(def.unlockCost, 0)} · flood ${formatNumber(def.floodCost, 0)} once to rent`;
    }
    if (!state.flooded) {
      return `Flood ${formatNumber(def.floodCost, 0)} once · enables basin rent`;
    }
    if (def.rentPerDay > 0) {
      return `Basin flooded · rent ${rentCoinsPerGameDayLabel(def.rentPerDay)} when active`;
    }
    return "Basin flooded · rent available";
  }
  if (def.rentPerDay > 0) {
    return `Rent ${rentCoinsPerGameDayLabel(def.rentPerDay)} when active`;
  }
  if (def.unlockCost > 0 && !state.unlocked) return "Unlock region access";
  if (def.unlockCost > 0) return "Region unlocked";
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
  const flavourBlock = flavour
    ? `<button type="button" class="card__flavour-wrap" aria-expanded="false">` +
      `<span class="card__flavour">${flavour}</span>` +
      `<span class="card__flavour-chevron" aria-hidden="true"></span></button>`
    : "";
  return `<p class="card__effect">${effect}</p>${flavourBlock}`;
}

/**
 * @returns {{ id: string, flavour: string, effectLine: string }[]}
 */
export function allPurchasableCopy() {
  /** @type {{ id: string, flavour: string, effectLine: string }[]} */
  const out = [];
  for (const u of UPGRADES) {
    out.push({ id: `upgrade:${u.id}`, flavour: u.flavour, effectLine: upgradeEffectLine(u, 0) });
  }
  for (const p of PRODUCERS) {
    out.push({ id: `producer:${p.id}`, flavour: p.flavour, effectLine: producerEffectLine(p) });
  }
  for (const h of HYPE_CAMPAIGNS) {
    out.push({ id: `hype:${h.id}`, flavour: h.flavour, effectLine: hypeEffectLine(h, 0) });
  }
  for (const r of REGIONS) {
    if (r.id === "home") continue;
    out.push({ id: `region:${r.id}`, flavour: r.flavour, effectLine: regionEffectLine(r) });
  }
  return out;
}
