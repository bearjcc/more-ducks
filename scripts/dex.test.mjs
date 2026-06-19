#!/usr/bin/env node
import { DUCKS } from "../src/data/ducks.js";
import { dexMods, defaultDexMods, effectiveCoherence } from "../src/game/dexMods.js";
import { defaultMeta } from "../src/game/meta.js";
import { createGame } from "../src/game/economy.js";
import { BASE_DEMAND, demand } from "../src/game/market.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

console.log("\n(a) Every duck has a demand");
{
  const missing = DUCKS.filter((d) => !d.demand || !d.demandBlurb);
  assert(missing.length === 0, `all ${DUCKS.length} breeds define demand + blurb`);
}

console.log("\n(b) Demands stack");
{
  const meta = defaultMeta();
  assert(JSON.stringify(dexMods(meta)) === JSON.stringify(defaultDexMods()), "empty dex is neutral");
  meta.dexUnlocked = ["mallard", "rubber"];
  const m = dexMods(meta);
  assert(m.coinUpkeep > 1 && m.scoreInflate > 1, "catalogued ducks stack coin + score costs");
}

console.log("\n(c) Full dex is materially costly");
{
  const meta = defaultMeta();
  meta.dexUnlocked = DUCKS.map((d) => d.id);
  const m = dexMods(meta);
  assert(m.coinUpkeep > 1.85, "full collection materially raises coin upkeep");
  assert(m.scoreInflate > 1.4, "full collection inflates Intelligence noticeably");
  assert(m.coinUpkeep > 1.1, "full collection raises coin upkeep");
  assert(m.questionIntake > 0.2, "full collection adds question intake");
}

console.log("\n(d) Market resource demands wire through");
{
  const meta = defaultMeta();
  meta.dexUnlocked = ["decoy", "aligned", "overfit", "datadrake"];
  const m = dexMods(meta);
  const engine = createGame();
  assert(demand(meta, engine, m) === BASE_DEMAND + m.questionIntake, "questionIntake raises demand");
  assert(m.hypeDecayMult > 1, "aligned duck accelerates hype decay");
  assert(m.researchUpkeep > 1, "overfit duck taxes research");
  meta.coherence = 0.5;
  assert(effectiveCoherence(meta, m) > 0.5, "datadrake lifts effective coherence");
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
