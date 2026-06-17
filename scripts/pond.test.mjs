#!/usr/bin/env node
import { POND_MAX, pondDrainPerSec, drainPond, pondFraction, checkPondBeats } from "../src/game/pond.js";
import { defaultMeta } from "../src/game/meta.js";
import ContinuumEngine from "../src/engine/engine.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

console.log("\n(a) Pond drains and clamps at zero");
{
  const meta = defaultMeta();
  meta.pondWater = 10;
  drainPond(meta, 25);
  assert(meta.pondWater === 0, "pondWater does not go below zero");
}

console.log("\n(b) Drain rises with flock size");
{
  const engine = new ContinuumEngine();
  engine.createResource({ key: "ducks", count: 1 });
  const low = pondDrainPerSec(engine);
  engine.resource("ducks").incrementBy(9_999);
  const high = pondDrainPerSec(engine);
  assert(high > low, "more ducks increases drain rate");
}

console.log("\n(c) pondFraction is 0–1");
{
  const meta = defaultMeta();
  assert(pondFraction(meta) === 1, "full pond is 1");
  meta.pondWater = POND_MAX / 2;
  assert(pondFraction(meta) === 0.5, "half pond is 0.5");
  meta.pondWater = 0;
  assert(pondFraction(meta) === 0, "empty pond is 0");
}

console.log("\n(d) Beats fire once");
{
  const meta = defaultMeta();
  meta.pondWater = POND_MAX * 0.2;
  let lowCount = 0;
  checkPondBeats(meta, () => { lowCount++; });
  checkPondBeats(meta, () => { lowCount++; });
  assert(lowCount === 1, "pondLow beat fires once");
  meta.pondWater = 0;
  let dryCount = 0;
  checkPondBeats(meta, () => { dryCount++; });
  checkPondBeats(meta, () => { dryCount++; });
  assert(dryCount === 1, "pondEmpty beat fires once");
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
