#!/usr/bin/env node
import {
  allPurchasableCopy,
  flavourIsWordsOnly,
  upgradeEffectLine,
  producerEffectLine,
} from "../src/game/cardCopy.js";
import { UPGRADES } from "../src/data/upgrades.js";
import { PRODUCERS } from "../src/data/producers.js";
import { rentCoinsPerGameDayLabel } from "../src/game/regions.js";
import { REGIONS } from "../src/data/regions.js";
import { regionEffectLine } from "../src/game/cardCopy.js";

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

console.log("\n(c) Level upgrades show next+now at Lv 0");
{
  const crumb = UPGRADES.find((u) => u.id === "promptcache");
  const line = upgradeEffectLine(/** @type {any} */ (crumb), 0);
  assert(line.includes("Next:"), "crumb recall has Next");
  assert(line.includes("now"), "crumb recall shows current");
  assert(!line.includes("Lv 25"), "crumb recall not end-state only");
}

console.log("\n(d) Producer rate uses K suffix and each");
{
  const pond = PRODUCERS.find((p) => p.id === "datapond");
  const line = producerEffectLine(/** @type {any} */ (pond));
  assert(line.includes("each"), "producer says each");
  assert(line.includes("K"), "datapond rate uses formatNumber K");
}

console.log("\n(e) Quick Quack shows hold interval ms at Lv 0");
{
  const qq = UPGRADES.find((u) => u.id === "quickquack");
  const line = upgradeEffectLine(/** @type {any} */ (qq), 0);
  assert(line.includes("450") && line.includes("ms"), "quick quack quantifies ms");
  assert(!line.includes("faster"), "no vague faster");
}

console.log("\n(f) Australia flood states benefit and cost");
{
  const aus = REGIONS.find((r) => r.id === "australia");
  const effect = regionEffectLine(aus);
  assert(effect.includes("50M") || effect.includes("50"), "flood cost visible");
  assert(effect.toLowerCase().includes("unlock"), "flood unlock benefit");
}

console.log("\n(g) Rent label matches region effect");
{
  const asia = REGIONS.find((r) => r.id === "asia");
  const label = rentCoinsPerGameDayLabel(asia.rentPerDay);
  const effect = regionEffectLine(asia);
  assert(effect.includes(label), `asia effect includes ${label}`);
  assert(label.includes("1.2K"), "asia rent formats as 1.2K not 1K");
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
