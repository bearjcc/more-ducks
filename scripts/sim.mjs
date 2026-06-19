// Balance simulator for More Ducks! — NOT shipped, NOT imported by the game.
// Mirrors main.js market loop (demand/supply/hype/efficiency/coherence) with a
// rational-player buying policy, then reports wall-clock time to each act and
// finale-ready. Target: ~6–8 h for a medium-engagement player (economy.md §1).
//
//   node scripts/sim.mjs
//   ERASCALE=1.2 node scripts/sim.mjs   # stretch act thresholds
//
import { PRODUCERS } from "../src/data/producers.js";
import { UPGRADES } from "../src/data/upgrades.js";
import { RESEARCH_UPGRADES } from "../src/data/research.js";
import { HYPE_CAMPAIGNS } from "../src/data/hype.js";
import { ACTS } from "../src/data/eras.js";
import { DUCKS } from "../src/data/ducks.js";
import {
  ANSWERS_PER_DUCK_PER_SEC,
  BASE_DEMAND,
  COIN_PER_ANSWER,
  COHERENCE_RESEARCH_THRESHOLD,
  HYPE_DECAY_PER_SEC,
  HYPE_FACTOR,
  RESEARCH_PER_ANSWER,
  coherenceValueMult,
  servedPerSecond,
} from "../src/game/market.js";
import { actForStats } from "../src/game/progression.js";
import { dexMods, effectiveCoherence } from "../src/game/dexMods.js";

const TARGET_HOURS_MIN = 6;
const TARGET_HOURS_MAX = 8;

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
const upOwned = new Set();
/** @type {{ upgradesOwned: string[], dexUnlocked: string[], coherence: number }} */
const meta = { upgradesOwned: [], dexUnlocked: [], coherence: 0 };

let ducks = 1;
let lifetimeDucks = 1;
let answersTotal = 0;
let coins = 0;
let research = 0;
let hype = 0;
let researchSpent = 0;
let era = 0;
let t = 0;

function actThreshold(a) {
  return { ducks: a.duckThreshold * ACT_DUCK_SCALE, answers: a.answersThreshold };
}

function recomputeMods() {
  let clickAdd = 0, clickMult = 1, crumbMult = 1, globalMult = 1, efficiencyMult = 1;
  /** @type {Record<string, number>} */
  const perProducer = {};
  for (const u of [...UPGRADES, ...RESEARCH_UPGRADES]) {
    if (!upOwned.has(u.id)) continue;
    const e = u.effect;
    switch (e.kind) {
      case "clickAdd": clickAdd += e.amount; break;
      case "clickMult": clickMult *= e.mult; break;
      case "crumbMult": crumbMult *= e.mult; break;
      case "globalMult": globalMult *= e.mult; break;
      case "producerMult": perProducer[e.target] = (perProducer[e.target] || 1) * e.mult; break;
      case "efficiencyMult": efficiencyMult *= e.mult; break;
    }
  }
  const dex = dexMods(meta);
  return {
    clickPower: (1 + clickAdd) * clickMult,
    crumbMult,
    globalMult: globalMult * dex.produceMult,
    efficiencyMult,
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
  const earned = research + researchSpent;
  meta.coherence = Math.min(1, earned / COHERENCE_RESEARCH_THRESHOLD);
  return effectiveCoherence(meta, mods.dex);
}

function marketDemand(mods) {
  return BASE_DEMAND + mods.dex.questionIntake + HYPE_FACTOR * hype;
}

function marketSupply(mods) {
  return ducks * ANSWERS_PER_DUCK_PER_SEC * mods.efficiencyMult;
}

function coinGainPerServed(served, mods) {
  const c = coherence(mods);
  return served * COIN_PER_ANSWER * coherenceValueMult(c) * mods.crumbMult / mods.dex.coinUpkeep;
}

function researchGainPerServed(served, mods) {
  return served * RESEARCH_PER_ANSWER / mods.dex.researchUpkeep;
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
    case "upgrade": return upOwned.has(u.id);
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
  meta.upgradesOwned = [...upOwned];
}

function advanceEra() {
  era = actForStats({ totalDucksEver: lifetimeDucks, answersTotal });
}

// ---- buying policy -----------------------------------------------------
function buyResearchUpgrades() {
  let bought = true;
  while (bought) {
    bought = false;
    for (const u of RESEARCH_UPGRADES) {
      if (upOwned.has(u.id) || u.era > era) continue;
      if (research >= u.cost) {
        research -= u.cost;
        researchSpent += u.cost;
        upOwned.add(u.id);
        bought = true;
      }
    }
  }
}

function buyCoinUpgrades() {
  const dexUpgradeIds = new Set(
    DUCKS.filter((d) => d.unlock.type === "upgrade").map((d) => d.unlock.id),
  );
  const order = [...UPGRADES].sort((a, b) => {
    const aDex = dexUpgradeIds.has(a.id) ? 0 : 1;
    const bDex = dexUpgradeIds.has(b.id) ? 0 : 1;
    return aDex - bDex || a.cost - b.cost;
  });
  let bought = true;
  while (bought) {
    bought = false;
    for (const u of order) {
      if (upOwned.has(u.id) || u.era > era) continue;
      if (coins >= u.cost) {
        coins -= u.cost;
        upOwned.add(u.id);
        bought = true;
      }
    }
  }
}

/** Keep demand near supply so stranded capacity monetizes (medium-engagement player). */
function buyHypeCampaigns(mods) {
  const supply = marketSupply(mods);
  const intake = mods.dex.questionIntake;
  const targetDemand = Math.min(supply, Math.max(BASE_DEMAND + intake, supply * 0.88));
  const targetHype = Math.max(0, (targetDemand - BASE_DEMAND - intake) / HYPE_FACTOR);
  if (hype >= targetHype * 0.85) return;

  // ponytail: cap 3 launches/tick — enough to chase demand without instant max hype
  for (let i = 0; i < 3 && hype < targetHype * 0.85; i++) {
    let best = null;
    let bestRatio = 0;
    for (const c of HYPE_CAMPAIGNS) {
      if (c.era > era || coins < c.cost) continue;
      const ratio = c.hypeGain / c.cost;
      if (ratio > bestRatio) { bestRatio = ratio; best = c; }
    }
    if (!best) break;
    coins -= best.cost;
    hype += best.hypeGain;
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

function buyProducers(mods) {
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

function buyStuff(mods) {
  buyResearchUpgrades();
  buyCoinUpgrades();
  buyDexGateProducers();
  buyHypeCampaigns(mods);
  buyProducers(mods);
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
    const researchTap = RESEARCH_PER_ANSWER / mods.dex.researchUpkeep;
    coins += coinTap * taps;
    research += researchTap * taps;
    answersTotal += taps;
  }

  // Producer output → duck population (supply capacity).
  const duckGain = dps(mods) * DT;
  ducks += duckGain;
  lifetimeDucks += duckGain;

  checkDex();
  const mods2 = recomputeMods();
  decayHype(DT, mods2);

  const supply = marketSupply(mods2);
  const demand = marketDemand(mods2);
  const served = servedPerSecond(supply, demand) * DT;

  coins += coinGainPerServed(served, mods2);
  research += researchGainPerServed(served, mods2);
  answersTotal += served;

  advanceEra();
  if (actReached[era] === undefined) actReached[era] = t;

  buyStuff(mods2);

  // First capstone upgrade (vertical or horizontal ending).
  if (finaleAt === null && (upOwned.has("selfgoverning") || upOwned.has("oceanswarm"))) {
    finaleAt = t;
    break;
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
const allUpgrades = UPGRADES.every((u) => upOwned.has(u.id));
const allResearch = RESEARCH_UPGRADES.every((u) => upOwned.has(u.id));
console.log(`Capstone ending @ ${finaleAt === null ? "NOT within cap" : dhms(finaleAt)} (selfgoverning or oceanswarm)`);
if (finaleH !== null) {
  const status = inTarget ? "IN TARGET" : finaleH < TARGET_HOURS_MIN ? "TOO FAST" : "TOO SLOW";
  console.log(`Arc estimate: ${finaleH.toFixed(2)} h — ${status}`);
}
console.log(`100% completion: producers ${allProducers ? "all" : "partial"}, coin upgrades ${UPGRADES.filter((u) => upOwned.has(u.id)).length}/${UPGRADES.length}, research ${RESEARCH_UPGRADES.filter((u) => upOwned.has(u.id)).length}/${RESEARCH_UPGRADES.length}`);

const finalMods = recomputeMods();
console.log(`\nfinal: ducks=${fmt(ducks)}, lifetime=${fmt(lifetimeDucks)}, answers=${fmt(answersTotal)}`);
console.log(`market: supply=${fmt(marketSupply(finalMods))}/s, demand=${fmt(marketDemand(finalMods))}/s, hype=${fmt(hype)}`);
console.log(`coins=${fmt(coins)}, research=${fmt(research)}, coherence=${coherence(finalMods).toFixed(2)}`);
console.log(`owned producers: ${PRODUCERS.map((p) => p.id + "×" + owned[p.id]).join(", ")}`);
console.log(`dex: ${meta.dexUnlocked.length}/${DUCKS.length}`);
const lateDex = DUCKS.filter((d) => dexReached[d.id] !== undefined)
  .sort((a, b) => dexReached[b.id] - dexReached[a.id])
  .slice(0, 5);
if (lateDex.length) {
  console.log("last dex unlocks:");
  for (const d of lateDex) console.log(`  ${d.id.padEnd(12)} @ ${dhms(dexReached[d.id])}`);
}
