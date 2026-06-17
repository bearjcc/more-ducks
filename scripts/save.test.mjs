#!/usr/bin/env node

// Mock localStorage before any save functions are called (save.js only
// accesses it inside function bodies, not at module evaluation time).
const _ls = {};
globalThis.localStorage = {
  getItem: (k) => Object.prototype.hasOwnProperty.call(_ls, k) ? _ls[k] : null,
  setItem: (k, v) => { _ls[k] = String(v); },
  removeItem: (k) => { delete _ls[k]; },
};

import { exportSaveText, importSaveText } from "../src/game/save.js";
import { createGame } from "../src/game/economy.js";
import { defaultMeta } from "../src/game/meta.js";
import { POND_MAX } from "../src/game/pond.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

console.log("\n(a) export + import round-trip");
{
  const engine = createGame();
  const meta = defaultMeta();
  engine.currency("breadcrumbs").incrementBy(500);
  meta.era = 2;
  meta.dexUnlocked = ["mallard", "rubber"];
  meta.upgradesOwned = ["bighands"];

  const json = exportSaveText(engine, meta);

  const engine2 = createGame();
  const meta2 = defaultMeta();
  const result = importSaveText(engine2, meta2, json);

  assert(result.ok === true, "import succeeds");
  assert(typeof result.savedAt === "number", "savedAt is present");
  assert(meta2.era === 2, "era preserved");
  assert(JSON.stringify(meta2.dexUnlocked) === JSON.stringify(["mallard", "rubber"]), "dexUnlocked preserved");
  assert(meta2.upgradesOwned.includes("bighands"), "upgradesOwned preserved");
  assert(engine2.currency("breadcrumbs").value === 500, "breadcrumbs preserved");
}

console.log("\n(b) old save missing optional keys gets safe defaults");
{
  const engine = createGame();
  const meta = defaultMeta();
  const raw = JSON.stringify({
    version: 1,
    savedAt: Date.now(),
    meta: {
      clickPower: 1,
      era: 0,
      dexUnlocked: [],
      upgradesOwned: [],
      flags: {},
      totalDucksEver: 1,
      // deliberately omits: achievements, questionsAnswered, pondWater, quackmarksOwned, settings
    },
    currencies: {},
    resources: {},
    producers: {},
  });
  const result = importSaveText(engine, meta, raw);
  assert(result.ok === true, "old save loads without error");
  assert(Array.isArray(meta.achievements), "achievements defaults to []");
  assert(meta.questionsAnswered === 0, "questionsAnswered defaults to 0");
  assert(meta.pondWater === POND_MAX, "pondWater defaults to POND_MAX");
  assert(Array.isArray(meta.quackmarksOwned), "quackmarksOwned defaults to []");
}

console.log("\n(c) invalid input is rejected");
{
  const engine = createGame();
  const meta = defaultMeta();

  const r1 = importSaveText(engine, meta, "not json {{{");
  assert(r1.ok === false && typeof r1.error === "string", "invalid JSON returns error string");

  const r2 = importSaveText(engine, meta, JSON.stringify({
    version: 99, meta: {}, currencies: {}, resources: {}, producers: {},
  }));
  assert(r2.ok === false, "wrong version is rejected");

  const r3 = importSaveText(engine, meta, JSON.stringify({ version: 1 }));
  assert(r3.ok === false, "save missing required fields is rejected");
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
