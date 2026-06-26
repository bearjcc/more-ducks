// aislop-ignore-file ai-slop/console-leftover -- CLI report tool; console output is the product.
// Balance simulator for More Ducks! — NOT shipped, NOT imported by the game.
// Intentionally one file: it owns a single block of mutable sim state (ducks, coins,
// hype, owned maps) touched by every function below. Splitting would scatter that state
// across modules for no readability gain. Cohesive + self-contained beats artificial seams.
// Mirrors main.js market loop (demand/supply/hype/efficiency/coherence) with a
// rational-player buying policy, then reports wall-clock time to each act and
// finale-ready. Target: ~6–8 h for a medium-engagement player (economy.md §1).
//
//   node scripts/sim.mjs
//   ERASCALE=1.2 node scripts/sim.mjs   # stretch act thresholds
//
import { PRODUCERS } from "../src/data/producers.js";
import { UPGRADES } from "../src/data/upgrades.js";
import { bulkScaledCost } from "../src/game/scaledCost.js";
import { HYPE_CAMPAIGNS } from "../src/data/hype.js";
import {
  campaignNextCost,
  campaignHypeGain,
  maxMarketingLevel,
} from "../src/game/hype.js";
import { ACTS } from "../src/data/eras.js";
import { DUCKS } from "../src/data/ducks.js";
import {
  ANSWERS_PER_DUCK_PER_SEC,
  BASE_DEMAND,
  BUZZ_PER_DUCK,
  BUZZ_EXPONENT,
  COIN_PER_ANSWER,
  COHERENCE_ANSWERS_THRESHOLD,
  HYPE_DECAY_PER_SEC,
  HYPE_FACTOR,
  coherenceValueMult,
  servedPerSecond,
} from "../src/game/market.js";
import { actForStats } from "../src/game/progression.js";
import { dexMods, effectiveCoherence } from "../src/game/dexMods.js";

const TARGET_HOURS_MIN = 2;
const TARGET_HOURS_MAX = 3;

// Multiply every act duck threshold (answers thresholds stay fixed).
const ACT_DUCK_SCALE = Number(process.env.ERASCALE ?? 1);

// ---- player model ------------------------------------------------------
// Medium engagement: active taps early, then mostly idle with rational buys.
const CLICK_RATE = 6;
const CLICK_SECONDS = 180;

function fmt(n) {
  if (n < 1000) return n.toFixed(n < 10 ? 1 : 0);
  const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx"];
  let u = 0;
  while (n >= 1000 && u < units.length - 1) { n /= 1000; u++; }
  return n.toFixed(2) + units[u];
}
function dhms(sec) {
  const d = Math.floor(sec / 86400); sec -= d * 86400;
  const h = Math.floor(sec / 3600); sec -= h * 3600;
  const m = Math.floor(sec / 60); sec -= m * 60;
  const parts = [];
  if (d) parts.push(d + "d");
  if (h || d) parts.push(h + "h");
  parts.push(m + "m");
  return parts.join(" ");
}

// ---- state -------------------------------------------------------------
const owned = Object.fromEntries(PRODUCERS.map((p) => [p.id, 0]));
/** @type {Record<string, number>} */
const upLevels = {};
/** @type {Record<string, number>} */
const marketingLevels = {};
/** @type {{ upgradeLevels: Record<string, number>, marketingLevels: Record<string, number>, dexUnlocked: string[], coherence: number }} */
const meta = { upgradeLevels: upLevels, marketingLevels, dexUnlocked: [], coherence: 0 };

let ducks = 1;
let lifetimeDucks = 1;
let pondCount = 0; // capacity.js: each pond +DUCKS_PER_POND to the supply cap
let answersTotal = 0;
let coins = 0;
let hype = 0;
let era = 0;
let t = 0;

function actThreshold(a) {
  return { ducks: a.duckThreshold * ACT_DUCK_SCALE, answers: a.answersThreshold };
}

const DEFAULT_MAX_LEVEL = 25;

function maxUpLevel(u) {
  if (u.purchaseMode === "once") return 1;
  if (u.purchaseMode === "quantity") return Infinity;
  return u.maxLevel ?? DEFAULT_MAX_LEVEL;
}

function stackedMult(targetMult, level, maxLevel) {
  if (level <= 0) return 1;
  return targetMult ** (level / maxLevel);
}

function upgradeLevel(id) {
  return upLevels[id] ?? 0;
}

function upgradeNextCost(u, level) {
  if (u.purchaseMode === "once") return level >= 1 ? Infinity : u.baseCost;
  return bulkScaledCost(u.baseCost, u.costCoefficient ?? 1.15, level, 1);
}

function recomputeMods() {
  let clickAdd = 0, clickMult = 1, crumbMult = 1, globalMult = 1, efficiencyMult = 1, pondCapacityBonus = 0;
  /** @type {Record<string, number>} */
  const perProducer = {};
  for (const u of UPGRADES) {
    const level = upgradeLevel(u.id);
    if (level <= 0) continue;
    const cap = maxUpLevel(u);
    const e = u.effect;
    switch (e.kind) {
      case "clickAdd": clickAdd += e.amount * level; break;
      case "clickMult": clickMult *= stackedMult(e.mult, level, cap === Infinity ? DEFAULT_MAX_LEVEL : cap); break;
      case "crumbMult": crumbMult *= stackedMult(e.mult, level, cap === Infinity ? DEFAULT_MAX_LEVEL : cap); break;
      case "globalMult": globalMult *= stackedMult(e.mult, level, cap === Infinity ? DEFAULT_MAX_LEVEL : cap); break;
      case "producerMult": {
        const m = stackedMult(e.mult, level, cap === Infinity ? DEFAULT_MAX_LEVEL : cap);
        perProducer[e.target] = (perProducer[e.target] || 1) * m;
        break;
      }
      case "efficiencyMult": efficiencyMult *= stackedMult(e.mult, level, cap === Infinity ? DEFAULT_MAX_LEVEL : cap); break;
      case "pondCapacity": pondCapacityBonus += e.amount * level; break;
    }
  }
  const dex = dexMods(meta);
  return {
    clickPower: (1 + clickAdd) * clickMult,
    crumbMult,
    globalMult: globalMult * dex.produceMult,
    efficiencyMult,
    pondCapacityBonus,
    perProducer,
    dex,
  };
}

function prodAmount(p, mods) {
  return p.productionAmount * mods.globalMult * (mods.perProducer[p.id] || 1);
}

function dps(mods) {
  let d = 0;
  for (const p of PRODUCERS) {
    if (owned[p.id] <= 0) continue;
    d += (owned[p.id] * prodAmount(p, mods)) / (p.productionTime / 1000);
  }
  return d;
}

function coherence(mods) {
  meta.coherence = Math.min(1, answersTotal / COHERENCE_ANSWERS_THRESHOLD);
  return effectiveCoherence(meta, mods.dex);
}

function marketDemand(mods) {
  const liveDucks = Math.min(ducks, pondCapacity(mods));
  const buzz = BUZZ_PER_DUCK * Math.pow(Math.max(0, liveDucks), BUZZ_EXPONENT);
  return BASE_DEMAND + buzz + mods.dex.questionIntake + HYPE_FACTOR * hype;
}

// capacity.js: supply is gated by pond capacity, NOT raw duck output. Ducks are
// clamped to this cap every tick; lifetime production (acts/dex) is uncapped.
const BASE_POND_CAPACITY = 12;
const DUCKS_PER_POND = 50;
const FLOCK_HEADROOM = 1.15; // cap tracks the flock (capacity.js) — flock drives supply
function pondCapacity(mods) {
  const pondRoom = BASE_POND_CAPACITY + (1 + pondCount) * DUCKS_PER_POND + (mods.pondCapacityBonus || 0);
  const flockRoom = Math.ceil(lifetimeDucks * FLOCK_HEADROOM);
  return Math.max(pondRoom, flockRoom);
}
function pondCost() {
  return Math.floor(5000 * Math.pow(2.2, pondCount));
}

function marketSupply(mods) {
  const live = Math.min(ducks, pondCapacity(mods)); // clamped count, not raw output
  return live * ANSWERS_PER_DUCK_PER_SEC * mods.efficiencyMult;
}

function coinGainPerServed(served, mods) {
  const c = coherence(mods);
  return served * COIN_PER_ANSWER * coherenceValueMult(c) * mods.crumbMult / mods.dex.coinUpkeep;
}

function nextCost(p) {
  return Math.round(p.baseCost * Math.pow(p.costCoefficient, owned[p.id]));
}

function revealed(p) {
  return p.era <= era || owned[p.id] > 0;
}

function isDexUnlocked(d) {
  const u = d.unlock;
  switch (u.type) {
    case "era": return era >= u.value;
    case "ducks": return lifetimeDucks >= u.value;
    case "producer": return owned[u.id] >= u.count;
    case "upgrade": return upgradeLevel(u.id) >= 1;
    default: return false;
  }
}

function checkDex() {
  for (const d of DUCKS) {
    if (meta.dexUnlocked.includes(d.id)) continue;
    if (isDexUnlocked(d)) {
      meta.dexUnlocked.push(d.id);
      if (dexReached[d.id] === undefined) dexReached[d.id] = t;
    }
  }
  meta.upgradeLevels = { ...upLevels };
  meta.marketingLevels = { ...marketingLevels };
}

function advanceEra() {
  era = actForStats({ totalDucksEver: lifetimeDucks, answersTotal });
}

// ---- buying policy -----------------------------------------------------
function buyCoinUpgrades() {
  const dexUpgradeIds = new Set(
    DUCKS.filter((d) => d.unlock.type === "upgrade").map((d) => d.unlock.id),
  );
  const order = [...UPGRADES].sort((a, b) => {
    const aDex = dexUpgradeIds.has(a.id) ? 0 : 1;
    const bDex = dexUpgradeIds.has(b.id) ? 0 : 1;
    return aDex - bDex || a.baseCost - b.baseCost;
  });
  let bought = true;
  while (bought) {
    bought = false;
    for (const u of order) {
      const level = upgradeLevel(u.id);
      if (level >= maxUpLevel(u) || u.era > era) continue;
      const cost = upgradeNextCost(u, level);
      if (coins >= cost) {
        coins -= cost;
        upLevels[u.id] = level + 1;
        bought = true;
      }
    }
  }
}

/** Keep demand near supply so stranded capacity monetizes (medium-engagement player). */
function buyHypeCampaigns(mods) {
  const supply = marketSupply(mods);
  const intake = mods.dex.questionIntake;
  // Demand chases just above supply so the capped flock never strands answers;
  // buyPonds then raises the cap to meet demand — the two ratchet up together.
  const targetDemand = Math.max(BASE_DEMAND + intake, supply * 1.1);
  const targetHype = Math.max(0, (targetDemand - BASE_DEMAND - intake) / HYPE_FACTOR);
  if (hype >= targetHype * 0.85) return;

  // cap 3 launches/tick — enough to chase demand without instant max hype.
  // Realistic player: buy the biggest campaign you can afford (most hype per tap),
  // not the cheapest — otherwise demand never catches a runaway supply.
  for (let i = 0; i < 3 && hype < targetHype * 0.85; i++) {
    let best = null;
    let bestGain = 0;
    for (const c of HYPE_CAMPAIGNS) {
      if (c.era > era) continue;
      const lvl = marketingLevels[c.id] ?? 0;
      if (lvl >= maxMarketingLevel(c)) continue;
      const cost = campaignNextCost(c, lvl);
      if (coins < cost) continue;
      const gain = campaignHypeGain(c, lvl + 1);
      if (gain > bestGain) { bestGain = gain; best = c; }
    }
    if (!best) break;
    const lvl = marketingLevels[best.id] ?? 0;
    coins -= campaignNextCost(best, lvl);
    marketingLevels[best.id] = lvl + 1;
    hype += campaignHypeGain(best, lvl + 1);
  }
}

/** Prioritize producer counts that gate Duckdex entries (finale needs full dex). */
function buyDexGateProducers() {
  for (const d of DUCKS) {
    if (meta.dexUnlocked.includes(d.id) || d.unlock.type !== "producer") continue;
    const p = PRODUCERS.find((x) => x.id === d.unlock.id);
    if (!p || !revealed(p)) continue;
    while (owned[p.id] < d.unlock.count && coins >= nextCost(p)) {
      coins -= nextCost(p);
      owned[p.id] += 1;
    }
  }
}

function buyProducers() {
  let bought = true;
  while (bought) {
    bought = false;
    let best = null;
    let bestRatio = 0;
    const mods = recomputeMods();
    for (const p of PRODUCERS) {
      if (!revealed(p)) continue;
      const cost = nextCost(p);
      if (cost > coins) continue;
      const marginal = prodAmount(p, mods) / (p.productionTime / 1000);
      const ratio = marginal / cost;
      if (ratio > bestRatio) { bestRatio = ratio; best = p; }
    }
    if (best) {
      coins -= nextCost(best);
      owned[best.id] += 1;
      bought = true;
    }
  }
}

/** Raise the supply cap while supply is the binding constraint on coin income. */
function buyPonds(mods) {
  // Only worth it when the flock has filled the current cap AND supply < demand
  // (otherwise extra capacity sells nothing). Mirrors a player buying ponds to
  // monetize demand they can't currently serve.
  let bought = true;
  while (bought) {
    bought = false;
    const atCap = ducks >= pondCapacity(mods) - 1e-6;
    if (atCap && marketSupply(mods) < marketDemand(mods) * 0.98 && coins >= pondCost()) {
      coins -= pondCost();
      pondCount++;
      bought = true;
    }
  }
}

function buyStuff(mods) {
  buyCoinUpgrades();
  buyDexGateProducers();
  buyHypeCampaigns(mods);
  buyPonds(mods);
  buyProducers();
}

function decayHype(dt, mods) {
  if (hype <= 0 || dt <= 0) return;
  const rate = HYPE_DECAY_PER_SEC * mods.dex.hypeDecayMult;
  hype = Math.max(0, hype - rate * dt);
}

// ---- run ---------------------------------------------------------------
const DT = 1;
const CAP = 60 * 86400;
const actReached = {};
const dexReached = {};
let finaleAt = null;

while (t < CAP) {
  const mods = recomputeMods();

  // Manual taps bypass the demand gate (main.js creditManualAnswer).
  if (t < CLICK_SECONDS) {
    const taps = CLICK_RATE * DT;
    const c = coherence(mods);
    const coinTap = COIN_PER_ANSWER * coherenceValueMult(c) * mods.crumbMult / mods.dex.coinUpkeep;
    coins += coinTap * taps;
    answersTotal += taps;
  }

  // Producer output → duck population. Lifetime (acts/dex) counts full output;
  // the live count is clamped to pond capacity (main.js clampDucksToCapacity).
  const duckGain = dps(mods) * DT;
  ducks += duckGain;
  lifetimeDucks += duckGain;
  ducks = Math.min(ducks, pondCapacity(mods));

  checkDex();
  const mods2 = recomputeMods();
  decayHype(DT, mods2);

  const supply = marketSupply(mods2);
  const demand = marketDemand(mods2);
  const served = servedPerSecond(supply, demand) * DT;

  coins += coinGainPerServed(served, mods2);
  answersTotal += served;

  advanceEra();
  if (actReached[era] === undefined) actReached[era] = t;

  buyStuff(mods2);

  // First capstone upgrade (vertical or horizontal ending).
  if (finaleAt === null && (upgradeLevel("selfgoverning") >= 1 || upgradeLevel("oceanswarm") >= 1)) {
    finaleAt = t;
    break;
  }
  if (process.env.TRACE && t % (Number(process.env.TRACE) || 3600) === 0) {
    const m = recomputeMods();
    console.error(`t=${(t / 3600).toFixed(0)}h  lifeDucks=${fmt(lifetimeDucks)}  answers=${fmt(answersTotal)}  coins=${fmt(coins)}  supply=${fmt(marketSupply(m))}  demand=${fmt(marketDemand(m))}  era=${era}`);
  }
  t += DT;
}

// ---- report ------------------------------------------------------------
const finaleH = finaleAt === null ? null : finaleAt / 3600;
const inTarget = finaleH !== null && finaleH >= TARGET_HOURS_MIN && finaleH <= TARGET_HOURS_MAX;

console.log("=== More Ducks! balance simulation ===");
console.log(`target arc: ${TARGET_HOURS_MIN}–${TARGET_HOURS_MAX} h (medium engagement, economy.md §1)`);
console.log(`policy: ${CLICK_RATE} taps/s for first ${CLICK_SECONDS}s, then idle; greedy buyer + dex-gate producers + hype (~88% supply match, max 3 campaigns/tick)\n`);

for (const a of ACTS) {
  const th = actThreshold(a);
  const at = actReached[a.id];
  const gate = `ducks≥${fmt(th.ducks)} OR answers≥${fmt(th.answers)}`;
  console.log(`Act ${a.id} ${a.name.padEnd(22)} ${gate.padEnd(32)}  @ ${at === undefined ? "—" : dhms(at)}`);
}

console.log();
const allProducers = PRODUCERS.every((p) => owned[p.id] > 0);
const upOwnedCount = UPGRADES.filter((u) => upgradeLevel(u.id) > 0).length;
console.log(`100% completion: producers ${allProducers ? "all" : "partial"}, upgrades ${upOwnedCount}/${UPGRADES.length}`);
console.log(`Capstone ending @ ${finaleAt === null ? "NOT within cap" : dhms(finaleAt)} (selfgoverning or oceanswarm)`);
if (finaleH !== null) {
  const status = inTarget ? "IN TARGET" : finaleH < TARGET_HOURS_MIN ? "TOO FAST" : "TOO SLOW";
  console.log(`Arc estimate: ${finaleH.toFixed(2)} h — ${status}`);
}

const finalMods = recomputeMods();
console.log(`\nfinal: ducks=${fmt(ducks)}, lifetime=${fmt(lifetimeDucks)}, answers=${fmt(answersTotal)}`);
console.log(`market: supply=${fmt(marketSupply(finalMods))}/s, demand=${fmt(marketDemand(finalMods))}/s, hype=${fmt(hype)}`);
console.log(`ponds=${pondCount} (cap=${fmt(pondCapacity(finalMods))} ducks), live ducks=${fmt(Math.min(ducks, pondCapacity(finalMods)))}`);
console.log(`coins=${fmt(coins)}, coherence=${coherence(finalMods).toFixed(2)}`);
console.log(`owned producers: ${PRODUCERS.map((p) => p.id + "×" + owned[p.id]).join(", ")}`);
console.log(`dex: ${meta.dexUnlocked.length}/${DUCKS.length}`);
const lateDex = DUCKS.filter((d) => dexReached[d.id] !== undefined)
  .sort((a, b) => dexReached[b.id] - dexReached[a.id])
  .slice(0, 5);
if (lateDex.length) {
  console.log("last dex unlocks:");
  for (const d of lateDex) console.log(`  ${d.id.padEnd(12)} @ ${dhms(dexReached[d.id])}`);
}
