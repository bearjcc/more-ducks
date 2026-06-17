#!/usr/bin/env node
import { createGame, bulkCost, buyProducer, maxAffordable, ducksPerSecond } from "../src/game/economy.js";
import { PRODUCERS } from "../src/data/producers.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

const DUCKLING = /** @type {import("../src/data/producers.js").ProducerDef} */ (PRODUCERS.find((p) => p.id === "duckling"));

console.log("\n(a) bulkCost");
{
  const engine = createGame();
  assert(bulkCost(engine, "duckling", 1) === DUCKLING.baseCost, "first unit costs baseCost");
  const secondCost = Math.round(DUCKLING.baseCost * DUCKLING.costCoefficient);
  assert(bulkCost(engine, "duckling", 2) === DUCKLING.baseCost + secondCost, "two units = baseCost + baseCost×coeff");
  assert(!isFinite(bulkCost(engine, "unknown", 1)), "unknown producer returns Infinity");
  assert(!isFinite(bulkCost(engine, "duckling", 0)), "qty=0 returns Infinity");
}

console.log("\n(b) buyProducer");
{
  const engine = createGame();
  engine.currency("breadcrumbs").incrementBy(500);
  const bought = buyProducer(engine, "duckling", 1);
  assert(bought === 1, "returns qty bought");
  assert(engine.producer("duckling").count === 1, "increments producer count");
  assert(engine.currency("breadcrumbs").value === 500 - DUCKLING.baseCost, "deducts cost from breadcrumbs");
  assert(buyProducer(engine, "duckling", 1_000_000) === 0, "returns 0 when not enough crumbs");
  assert(engine.producer("duckling").count === 1, "count unchanged after failed purchase");
}

console.log("\n(c) maxAffordable");
{
  const engine = createGame();
  assert(maxAffordable(engine, "duckling", 5) === 0, "returns 0 when can't afford first unit");
  assert(maxAffordable(engine, "duckling", DUCKLING.baseCost) === 1, "returns 1 when budget is exactly first-unit cost");
  const budget = 10_000;
  const n = maxAffordable(engine, "duckling", budget);
  assert(n > 1, "returns >1 with larger budget");
  assert(bulkCost(engine, "duckling", n) <= budget, "bulk cost of result fits in budget");
  assert(bulkCost(engine, "duckling", n + 1) > budget, "one more would exceed budget");
}

console.log("\n(d) ducksPerSecond");
{
  const engine = createGame();
  assert(ducksPerSecond(engine) === 0, "zero dps with no producers");
  engine.currency("breadcrumbs").incrementBy(500);
  buyProducer(engine, "duckling", 1);
  const expectedDps = DUCKLING.productionAmount / (DUCKLING.productionTime / 1000);
  assert(ducksPerSecond(engine) === expectedDps, "one duckling gives correct dps");
  buyProducer(engine, "duckling", 1);
  assert(ducksPerSecond(engine) === expectedDps * 2, "two ducklings give double dps");
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
