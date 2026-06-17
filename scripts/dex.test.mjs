#!/usr/bin/env node
import { DUCKS } from "../src/data/ducks.js";
import { dexMods, defaultDexMods } from "../src/game/dexMods.js";
import { defaultMeta } from "../src/game/meta.js";

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
  assert(m.pondMult > 1 && m.scoreInflate > 1, "catalogued ducks stack pond + score costs");
}

console.log("\n(c) Full dex is materially costly");
{
  const meta = defaultMeta();
  meta.dexUnlocked = DUCKS.map((d) => d.id);
  const m = dexMods(meta);
  assert(m.pondMult > 2, "full collection at least doubles pond drain");
  assert(m.scoreInflate > 1.4, "full collection inflates Intelligence noticeably");
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
