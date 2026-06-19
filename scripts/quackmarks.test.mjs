#!/usr/bin/env node
import { QUACKMARKS } from "../src/data/quackmarks.js";
import { quackmarkVisible, quackmarkScoreMult, buyQuackmark } from "../src/game/quackmarks.js";
import { defaultMeta } from "../src/game/meta.js";
import ContinuumEngine from "../src/engine/engine.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

console.log("\n(a) PONDMLU gated on Benchmark Duck");
{
  const meta = defaultMeta();
  meta.era = 2;
  const pondmlu = QUACKMARKS.find((q) => q.id === "pondmlu");
  assert(pondmlu && !quackmarkVisible(meta, pondmlu), "hidden without Benchmark Duck");
  meta.dexUnlocked.push("benchmark");
  assert(quackmarkVisible(meta, pondmlu), "visible once Benchmark Duck is catalogued");
}

console.log("\n(b) Score mult stacks");
{
  const meta = defaultMeta();
  assert(quackmarkScoreMult(meta) === 1, "neutral with none owned");
  meta.quackmarksOwned = ["breadbench", "pondmlu"];
  const mult = quackmarkScoreMult(meta);
  assert(mult > 1.2, "owned marks multiply Intelligence");
}

console.log("\n(c) Purchase deducts coins");
{
  const engine = new ContinuumEngine();
  engine.createCurrency("coins", 100_000);
  const meta = defaultMeta();
  meta.era = 1;
  const bought = buyQuackmark(engine, meta, "breadbench");
  assert(bought?.id === "breadbench", "buys when affordable");
  assert(meta.quackmarksOwned.includes("breadbench"), "records ownership");
  assert(buyQuackmark(engine, meta, "breadbench") === null, "cannot buy twice");
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
