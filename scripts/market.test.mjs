#!/usr/bin/env node
import {
  ANSWERS_PER_DUCK_PER_SEC,
  BASE_DEMAND,
  BUZZ_PER_DUCK,
  BUZZ_EXPONENT,
  COIN_PER_ANSWER,
  COHERENCE_ANSWERS_THRESHOLD,
  HYPE_FACTOR,
  HYPE_DECAY_PER_SEC,
  coherenceValueMult,
  computeCoherence,
  demand,
  decayHype,
  efficiencyMult,
  servedPerSecond,
  supplyPerSecond,
  updateCoherence,
  ponderCoinBonus,
} from "../src/game/market.js";
import { createGame } from "../src/game/economy.js";
import { defaultMeta } from "../src/game/meta.js";
import { createMods, applyUpgrades } from "../src/game/upgrades.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

const buzzFor = (engine) => BUZZ_PER_DUCK * Math.pow(engine.resource("ducks").count, BUZZ_EXPONENT);

console.log("\n(a) demand with zero hype");
{
  const engine = createGame();
  const meta = defaultMeta();
  const d = demand(meta, engine);
  const base = BASE_DEMAND + buzzFor(engine);
  assert(d === base, "returns base + flock buzz when hype is 0");
  assert(meta.demand === base, "writes meta.demand");
}

console.log("\n(b) demand scales with hype");
{
  const engine = createGame();
  const meta = defaultMeta();
  engine.currency("hype").incrementBy(100);
  const d = demand(meta, engine);
  assert(d === BASE_DEMAND + buzzFor(engine) + HYPE_FACTOR * 100, "base + flock buzz + hypeFactor·hype");
  assert(meta.demand === d, "meta.demand matches return value");
}

console.log("\n(c) decayHype drains linearly");
{
  const engine = createGame();
  engine.currency("hype").incrementBy(10);
  decayHype(engine, 2);
  const expected = 10 - HYPE_DECAY_PER_SEC * 2;
  assert(engine.currency("hype").value === expected, "hype -= decayRate·dt");
}

console.log("\n(d) decayHype clamps at zero");
{
  const engine = createGame();
  engine.currency("hype").incrementBy(0.1);
  decayHype(engine, 10);
  assert(engine.currency("hype").value === 0, "hype does not go negative");
}

console.log("\n(e) decayHype ignores non-positive dt");
{
  const engine = createGame();
  engine.currency("hype").incrementBy(5);
  decayHype(engine, 0);
  decayHype(engine, -1);
  assert(engine.currency("hype").value === 5, "no change when dt <= 0");
}

console.log("\n(f) supplyPerSecond scales with duck count");
{
  const engine = createGame();
  const mods = createMods();
  assert(supplyPerSecond(engine, mods) === ANSWERS_PER_DUCK_PER_SEC, "one duck → 1 A/s");
  engine.resource("ducks").incrementBy(9);
  assert(supplyPerSecond(engine, mods) === 10 * ANSWERS_PER_DUCK_PER_SEC, "ten ducks scale linearly");
}

console.log("\n(g) servedPerSecond is min(supply, demand)");
{
  assert(servedPerSecond(5, 3) === 3, "demand-limited");
  assert(servedPerSecond(2, 8) === 2, "supply-limited");
  assert(servedPerSecond(4, 4) === 4, "balanced");
}

console.log("\n(h) early-game coin rate");
{
  const engine = createGame();
  const mods = createMods();
  const supply = supplyPerSecond(engine, mods);
  const meta = defaultMeta();
  const d = demand(meta, engine);
  const served = servedPerSecond(supply, d);
  assert(served === 1, "one duck is fully served (supply-limited)");
  assert(served * COIN_PER_ANSWER === COIN_PER_ANSWER, `${COIN_PER_ANSWER} coins/s at Act 1`);
}

console.log("\n(i) ponderCoinBonus scales with depth");
{
  assert(ponderCoinBonus(0) > 0, "any ponder grants base bonus");
  assert(ponderCoinBonus(1) > ponderCoinBonus(0), "deeper ponder → more bonus");
}

console.log("\n(j) efficiencyMult from efficiency upgrades");
{
  const engine = createGame();
  const meta = defaultMeta();
  const mods = createMods();
  assert(efficiencyMult(mods) === 1, "baseline efficiency is 1");
  meta.upgradeLevels = { promptcache: 25, quantweights: 25 };
  applyUpgrades(engine, meta, mods);
  const eff = efficiencyMult(mods);
  assert(Math.abs(eff - 1.875) < 1e-9, "efficiency upgrades stack multiplicatively");
  const supply = supplyPerSecond(engine, mods);
  assert(Math.abs(supply - ANSWERS_PER_DUCK_PER_SEC * 1.875) < 1e-9, "supply scales with efficiency");
}

console.log("\n(l) coherenceValueMult scales coin payout");
{
  assert(coherenceValueMult(0) === 1, "baseline mult is 1");
  assert(coherenceValueMult(0.5) === 1.5, "half coherence is +50% coins");
  assert(coherenceValueMult(1) === 2, "full coherence doubles coin value");
}

console.log("\n(m) computeCoherence from answersTotal");
{
  const meta = defaultMeta();
  assert(computeCoherence(meta) === 0, "zero answers → coherence 0");
  meta.answersTotal = COHERENCE_ANSWERS_THRESHOLD / 2;
  assert(computeCoherence(meta) === 0.5, "half threshold → 0.5");
  meta.answersTotal = COHERENCE_ANSWERS_THRESHOLD;
  assert(computeCoherence(meta) === 1, "at threshold → 1");
  meta.answersTotal = 100;
  assert(computeCoherence(meta) === 1, "coherence capped at 1");
}

console.log("\n(n) updateCoherence writes meta");
{
  const meta = defaultMeta();
  meta.answersTotal = 25;
  updateCoherence(meta);
  assert(meta.coherence === 25 / COHERENCE_ANSWERS_THRESHOLD, "updateCoherence writes meta");
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
