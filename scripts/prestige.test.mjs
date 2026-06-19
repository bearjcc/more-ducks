#!/usr/bin/env node
import { createGame } from "../src/game/economy.js";
import { defaultMeta } from "../src/game/meta.js";
import { PRODUCERS } from "../src/data/producers.js";
import { createMods, applyUpgrades } from "../src/game/upgrades.js";
import {
  CITATION_MULT_STEP,
  PRESTIGE_MIN_ERA,
  _prestigeSelfCheck,
  canPrestige,
  citationsEarnedThisRun,
  citationsMult,
  performPrestige,
  resetEngineEconomy,
  resetMetaEconomy,
} from "../src/game/prestige.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

console.log("\n(a) canPrestige gates on era and ending");
{
  const meta = defaultMeta();
  assert(canPrestige(meta) === false, "era 0 cannot prestige");
  meta.era = PRESTIGE_MIN_ERA - 1;
  assert(canPrestige(meta) === false, "below Quack Boom cannot prestige");
  meta.era = PRESTIGE_MIN_ERA;
  assert(canPrestige(meta) === true, "Quack Boom can prestige");
  meta.flags.ended = true;
  assert(canPrestige(meta) === false, "ended run cannot prestige");
}

console.log("\n(b) citationsMult stacks with banked citations");
{
  const meta = defaultMeta();
  assert(citationsMult(meta) === 1, "zero citations → 1×");
  meta.citations = 3;
  assert(citationsMult(meta) === 1 + 3 * CITATION_MULT_STEP, "3 citations → +30%");
}

console.log("\n(c) performPrestige resets economy and keeps collection");
{
  const engine = createGame();
  const meta = defaultMeta();
  const mods = createMods();
  meta.era = PRESTIGE_MIN_ERA;
  meta.answersTotal = 20_000;
  meta.dexUnlocked = ["mallard"];
  meta.quackmarksOwned = ["bench1"];
  meta.upgradesOwned = ["bighands"];
  meta.questionsAnswered = 500;
  meta.totalDucksEver = 5000;
  engine.currency("coins").incrementBy(999);
  engine.currency("research").incrementBy(12);
  engine.currency("hype").incrementBy(33);
  engine.resource("ducks").incrementBy(50);
  const prod = engine.producer(PRODUCERS[0].id);
  if (prod) prod.incrementBy(2);
  applyUpgrades(engine, meta, mods);

  const earned = citationsEarnedThisRun(meta);
  const result = performPrestige(engine, meta, mods);
  assert(result.ok === true, "prestige succeeds");
  assert(result.citationsEarned === earned, "reports citations earned");
  assert(result.firstPonder === true, "first prestige unlocks pondering");
  assert(meta.ponderingUnlocked === true, "ponderingUnlocked set");
  assert(meta.prestigeCount === 1, "prestigeCount incremented");
  assert(meta.citations === earned, "citations banked");
  assert(engine.currency("coins").value === 0, "coins reset");
  assert(engine.currency("research").value === 0, "research reset");
  assert(engine.currency("hype").value === 0, "hype reset");
  assert(engine.resource("ducks").count === 1, "ducks reset to 1");
  assert(prod && prod.count === 0, "producers reset");
  assert(meta.upgradesOwned.length === 0, "upgrades cleared");
  assert(meta.era === 0, "era reset");
  assert(meta.answersTotal === 0, "answersTotal reset");
  assert(meta.coherence === 0, "coherence reset");
  assert(meta.totalDucksEver === 1, "run ducks reset");
  assert(meta.dexUnlocked.length === 1, "duckdex kept");
  assert(meta.quackmarksOwned.length === 1, "quackmarks kept");
  assert(meta.questionsAnswered === 500, "lifetime taps kept");
}

console.log("\n(d) second prestige stacks citations without re-unlocking ponder");
{
  const engine = createGame();
  const meta = defaultMeta();
  const mods = createMods();
  meta.era = PRESTIGE_MIN_ERA;
  meta.answersTotal = 1000;
  meta.prestigeCount = 1;
  meta.citations = 4;
  meta.ponderingUnlocked = true;
  performPrestige(engine, meta, mods);
  assert(meta.prestigeCount === 2, "second prestige increments count");
  assert(meta.citations === 4 + citationsEarnedThisRun({ answersTotal: 1000 }), "citations stack");
  assert(meta.ponderingUnlocked === true, "pondering stays unlocked");
}

console.log("\n(e) reset helpers isolate economy slice");
{
  const engine = createGame();
  const meta = defaultMeta();
  engine.currency("coins").incrementBy(50);
  resetEngineEconomy(engine);
  assert(engine.currency("coins").value === 0, "resetEngineEconomy clears coins");
  meta.upgradesOwned = ["x"];
  meta.era = 4;
  resetMetaEconomy(meta);
  assert(meta.upgradesOwned.length === 0 && meta.era === 0, "resetMetaEconomy clears run meta");
}

console.log("\n(f) self-check");
try {
  _prestigeSelfCheck();
  assert(true, "prestige self-check passes");
} catch (e) {
  assert(false, `prestige self-check: ${e.message}`);
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
