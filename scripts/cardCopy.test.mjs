#!/usr/bin/env node
import {
  allPurchasableCopy,
  flavourIsWordsOnly,
  upgradeEffectLine,
} from "../src/game/cardCopy.js";
import { UPGRADES } from "../src/data/upgrades.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

console.log("\n(a) Purchasable copy coverage");
{
  const rows = allPurchasableCopy();
  assert(rows.length >= 40, `catalog has ${rows.length} purchasable rows`);
  for (const row of rows) {
    assert(row.effectLine.trim().length > 0, `${row.id} has effect line`);
    assert(flavourIsWordsOnly(row.flavour), `${row.id} flavour has no digits/math`);
  }
}

console.log("\n(b) Critical Mass effect mentions pondering");
{
  const def = UPGRADES.find((u) => u.id === "scalinglaws");
  assert(def, "scalinglaws exists");
  const line = upgradeEffectLine(/** @type {any} */ (def));
  assert(line.includes("ponder"), "scalinglaws effect mentions ponder");
  assert(line.includes("×3") || line.includes("×"), "scalinglaws effect mentions mult");
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
