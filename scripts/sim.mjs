// Balance simulator for More Ducks! — NOT shipped, NOT imported by the game.
// Mirrors economy.js / upgrades.js / main.js with a rational-player buying
// policy, then reports wall-clock time to each era and to finale-ready.
//
//   node scripts/sim.mjs
//
import { PRODUCERS } from "../src/data/producers.js";
import { UPGRADES } from "../src/data/upgrades.js";
import { ERAS } from "../src/data/eras.js";
import { DUCKS } from "../src/data/ducks.js";

const CRUMB_PER_DUCK_PER_SEC = Number(process.env.CRUMB ?? 0.002);
// Multiply every era threshold (lets us stretch the narrative spacing).
const ERA_SCALE = Number(process.env.ERASCALE ?? 1);

// ---- player model ------------------------------------------------------
// An engaged player taps fast at the very start, then lets idle take over.
const CLICK_RATE = 6;        // taps/sec while actively clicking
const CLICK_SECONDS = 180;   // stop tapping after 3 minutes of play

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
let ducks = 1;
let lifetime = 1; // matches createGame()'s starting duck
let crumbs = 0;
let era = 0;
let t = 0; // seconds

function clickPower() {
  let add = 0, mult = 1;
  for (const u of UPGRADES) {
    if (!upOwned.has(u.id)) continue;
    if (u.effect.kind === "clickAdd") add += u.effect.amount;
    if (u.effect.kind === "clickMult") mult *= u.effect.mult;
  }
  return (1 + add) * mult;
}
function crumbMult() {
  let m = 1;
  for (const u of UPGRADES) if (upOwned.has(u.id) && u.effect.kind === "crumbMult") m *= u.effect.mult;
  return m;
}
function prodAmount(p) {
  let global = 1, per = 1;
  for (const u of UPGRADES) {
    if (!upOwned.has(u.id)) continue;
    if (u.effect.kind === "globalMult") global *= u.effect.mult;
    if (u.effect.kind === "producerMult" && u.effect.target === p.id) per *= u.effect.mult;
  }
  return p.productionAmount * global * per;
}
function dps() {
  let d = 0;
  for (const p of PRODUCERS) if (owned[p.id] > 0) d += (owned[p.id] * prodAmount(p)) / (p.productionTime / 1000);
  return d;
}
function nextCost(p) {
  return Math.round(p.baseCost * Math.pow(p.costCoefficient, owned[p.id]));
}
function eraThreshold(x) { return x.duckThreshold * ERA_SCALE; }
function eraForLifetime(l) {
  let e = 0;
  for (const x of ERAS) if (l >= eraThreshold(x)) e = x.id;
  return e;
}
function revealed(p) { return p.era <= era || owned[p.id] > 0; }

// ---- buying policy -----------------------------------------------------
// 1. Any affordable upgrade is a permanent multiplier — always take it.
// 2. Otherwise buy the producer with the best marginal ducks/sec per crumb,
//    so spend tracks the best available flywheel at every tier.
function buyStuff() {
  let bought = true;
  while (bought) {
    bought = false;

    for (const u of UPGRADES) {
      if (upOwned.has(u.id) || u.era > era) continue;
      if (crumbs >= u.cost) { crumbs -= u.cost; upOwned.add(u.id); bought = true; }
    }

    let best = null, bestRatio = 0;
    for (const p of PRODUCERS) {
      if (!revealed(p)) continue;
      const cost = nextCost(p);
      if (cost > crumbs) continue;
      const marginal = prodAmount(p) / (p.productionTime / 1000);
      const ratio = marginal / cost;
      if (ratio > bestRatio) { bestRatio = ratio; best = p; }
    }
    if (best) { crumbs -= nextCost(best); owned[best.id] += 1; bought = true; }
  }
}

function dexCount() {
  let n = 0;
  for (const d of DUCKS) {
    let ok = false;
    const u = d.unlock;
    if (u.type === "era") ok = era >= u.value;
    else if (u.type === "ducks") ok = lifetime >= u.value;
    else if (u.type === "producer") ok = owned[u.id] >= u.count;
    else if (u.type === "upgrade") ok = upOwned.has(u.id);
    if (ok) n++;
  }
  return n;
}

// ---- run ---------------------------------------------------------------
const DT = 1; // seconds per step
const CAP = 60 * 86400; // 60 simulated days hard stop
const eraReached = {};
let finaleAt = null;

while (t < CAP) {
  // clicks
  if (t < CLICK_SECONDS) {
    const taps = CLICK_RATE * DT;
    ducks += clickPower() * taps;
    lifetime += clickPower() * taps;
    crumbs += clickPower() * crumbMult() * taps;
  }
  // idle production
  const d = dps() * DT;
  ducks += d; lifetime += d;
  // crumbs foraged by the existing flock
  crumbs += ducks * CRUMB_PER_DUCK_PER_SEC * crumbMult() * DT;

  era = eraForLifetime(lifetime);
  if (eraReached[era] === undefined) eraReached[era] = t;

  buyStuff();

  // Shipped finale: era 4 + full Duckdex (see main.js updateFinaleCta).
  if (finaleAt === null && era >= 4 && dexCount() >= DUCKS.length) {
    finaleAt = t;
    break;
  }
  t += DT;
}

// ---- report ------------------------------------------------------------
console.log("=== More Ducks! balance simulation ===");
console.log(`policy: ${CLICK_RATE} taps/s for first ${CLICK_SECONDS}s, then idle; greedy optimal buyer\n`);
for (const e of ERAS) {
  const at = eraReached[e.id];
  console.log(`Era ${e.id} ${e.name.padEnd(18)} threshold ${fmt(eraThreshold(e)).padStart(8)}  reached @ ${at === undefined ? "—" : dhms(at)}`);
}
console.log();
const allProducers = PRODUCERS.every((p) => owned[p.id] > 0);
const allUpgrades = UPGRADES.every((u) => upOwned.has(u.id));
console.log(`Finale ready @ ${finaleAt === null ? "NOT within cap" : dhms(finaleAt)} (era 4 + full Duckdex)`);
console.log(`100% completion: producers ${allProducers ? "all" : "partial"}, upgrades ${upOwned.size}/${UPGRADES.length}`);
console.log(`\nfinal: lifetime=${fmt(lifetime)} ducks, dps=${fmt(dps())}/s, crumbs=${fmt(crumbs)}`);
console.log(`owned producers: ${PRODUCERS.map((p) => p.id + "×" + owned[p.id]).join(", ")}`);
console.log(`upgrades: ${upOwned.size}/${UPGRADES.length}, dex: ${dexCount()}/${DUCKS.length}`);
