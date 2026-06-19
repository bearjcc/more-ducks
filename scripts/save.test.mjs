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
  engine.currency("coins").incrementBy(500);
  engine.currency("research").incrementBy(42);
  engine.currency("hype").incrementBy(7);
  meta.era = 2;
  meta.dexUnlocked = ["mallard", "rubber"];
  meta.upgradesOwned = ["bighands"];
  meta.coherence = 3;
  meta.answersTotal = 99;
  meta.demand = 1.5;
  meta.ponderingUnlocked = true;
  meta.citations = 2;
  meta.prestigeCount = 1;

  const json = exportSaveText(engine, meta);

  const engine2 = createGame();
  const meta2 = defaultMeta();
  const result = importSaveText(engine2, meta2, json);

  assert(result.ok === true, "import succeeds");
  assert(JSON.parse(json).version === 4, "fresh export is version 4");
  assert(typeof result.savedAt === "number", "savedAt is present");
  assert(meta2.era === 2, "era preserved");
  assert(JSON.stringify(meta2.dexUnlocked) === JSON.stringify(["mallard", "rubber"]), "dexUnlocked preserved");
  assert(meta2.upgradesOwned.includes("bighands"), "upgradesOwned preserved");
  assert(engine2.currency("coins").value === 500, "coins preserved");
  assert(engine2.currency("research").value === 42, "research preserved");
  assert(engine2.currency("hype").value === 7, "hype preserved");
  assert(meta2.coherence === 3, "coherence preserved");
  assert(meta2.answersTotal === 99, "answersTotal preserved");
  assert(meta2.demand === 1.5, "demand preserved");
  assert(meta2.ponderingUnlocked === true, "ponderingUnlocked preserved");
  assert(meta2.citations === 2, "citations preserved");
  assert(meta2.prestigeCount === 1, "prestigeCount preserved");
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
      // deliberately omits: achievements, questionsAnswered, quackmarksOwned, settings
    },
    currencies: {},
    resources: {},
    producers: {},
  });
  const result = importSaveText(engine, meta, raw);
  assert(result.ok === true, "old save loads without error");
  assert(Array.isArray(meta.achievements), "achievements defaults to []");
  assert(meta.questionsAnswered === 0, "questionsAnswered defaults to 0");
  assert(typeof meta.spaceDeployed === "boolean", "spaceDeployed defaults");
  assert(Array.isArray(meta.quackmarksOwned), "quackmarksOwned defaults to []");
  assert(meta.coherence === 0, "coherence defaults to 0");
  assert(meta.answersTotal === 0, "answersTotal defaults to 0");
  assert(meta.demand === 0, "demand defaults to 0");
  assert(meta.ponderingUnlocked === false, "ponderingUnlocked defaults to false");
  assert(meta.citations === 0, "citations defaults to 0");
  assert(meta.prestigeCount === 0, "prestigeCount defaults to 0");
  assert(engine.currency("research").value === 0, "research defaults to 0 on old save");
  assert(engine.currency("hype").value === 0, "hype defaults to 0 on old save");
}

console.log("\n(c) pre-A1 save migrates breadcrumbs to coins");
{
  const engine = createGame();
  const meta = defaultMeta();
  const raw = JSON.stringify({
    version: 1,
    savedAt: Date.now(),
    meta: defaultMeta(),
    currencies: { breadcrumbs: { type: "breadcrumbs", value: 1234 } },
    resources: {},
    producers: {},
  });
  const result = importSaveText(engine, meta, raw);
  assert(result.ok === true, "legacy save loads");
  assert(engine.currency("coins").value === 1234, "breadcrumbs value migrated to coins");
}

console.log("\n(d) pre-refactor v1 save migrates end-to-end");
{
  const v1Fixture = {
    version: 1,
    savedAt: 1_700_000_000_000,
    meta: {
      clickPower: 2,
      era: 1,
      dexUnlocked: ["mallard"],
      upgradesOwned: ["bighands"],
      flags: { sawIntro: true },
      totalDucksEver: 87,
    },
    currencies: { breadcrumbs: { type: "breadcrumbs", value: 9999 } },
    resources: {},
    producers: {},
  };
  const raw = JSON.stringify(v1Fixture);

  const engine = createGame();
  const meta = defaultMeta();
  const result = importSaveText(engine, meta, raw);

  assert(result.ok === true, "v1 fixture loads");
  assert(result.savedAt === v1Fixture.savedAt, "savedAt preserved");
  assert(engine.currency("coins").value === 9999, "breadcrumbs migrated to coins");
  assert(engine.currency("research").value === 0, "research defaults on v1 save");
  assert(engine.currency("hype").value === 0, "hype defaults on v1 save");
  assert(meta.era === 1, "era preserved");
  assert(meta.coherence === 0, "coherence defaulted");
  assert(meta.answersTotal === 0, "answersTotal defaulted");
  assert(meta.demand === 0, "demand defaulted");
  assert(meta.ponderingUnlocked === false, "ponderingUnlocked defaulted");
  assert(meta.citations === 0, "citations defaulted");
  assert(meta.prestigeCount === 0, "prestigeCount defaulted");
  assert(Array.isArray(meta.achievements), "achievements defaulted");
  assert(meta.questionsAnswered === 0, "questionsAnswered defaulted");
  assert(meta.spaceDeployed === false, "spaceDeployed defaulted");
  assert(Array.isArray(meta.quackmarksOwned), "quackmarksOwned defaulted");

  const exported = JSON.parse(exportSaveText(engine, meta));
  assert(exported.version === 4, "re-export writes version 4");
  assert(exported.currencies.coins?.value === 9999, "exported coins value");
  assert(exported.currencies.breadcrumbs == null, "exported save has no breadcrumbs");
  assert(exported.currencies.research?.value === 0, "exported research present");
  assert(exported.currencies.hype?.value === 0, "exported hype present");
  assert(exported.meta.coherence === 0, "exported meta includes defaulted coherence");
  assert(exported.meta.prestigeCount === 0, "exported meta includes defaulted prestigeCount");
}

console.log("\n(e) invalid input is rejected");
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
