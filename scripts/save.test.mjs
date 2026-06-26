#!/usr/bin/env node

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
  engine.currency("hype").incrementBy(7);
  meta.era = 2;
  meta.dexUnlocked = ["mallard", "rubber"];
  meta.upgradeLevels = { steadybeak: 1, scalinglaws: 1 };
  meta.coherence = 0.3;
  meta.answersTotal = 99;
  meta.demand = 1.5;
  meta.ponderingUnlocked = true;
  meta.achievements = ["first_producer"];

  const json = exportSaveText(engine, meta);

  const engine2 = createGame();
  const meta2 = defaultMeta();
  const result = importSaveText(engine2, meta2, json);

  assert(result.ok === true, "import succeeds");
  assert(JSON.parse(json).version === 6, "fresh export is version 6");
  assert(typeof result.savedAt === "number", "savedAt is present");
  assert(meta2.era === 2, "era preserved");
  assert(JSON.stringify(meta2.dexUnlocked) === JSON.stringify(["mallard", "rubber"]), "dexUnlocked preserved");
  assert(meta2.upgradeLevels.steadybeak === 1, "upgradeLevels preserved");
  assert(engine2.currency("coins").value === 500, "coins preserved");
  assert(engine2.currency("hype").value === 7, "hype preserved");
  assert(meta2.coherence === 0.3, "coherence preserved");
  assert(meta2.answersTotal === 99, "answersTotal preserved");
  assert(meta2.demand === 1.5, "demand preserved");
  assert(meta2.ponderingUnlocked === true, "ponderingUnlocked preserved");
  assert(meta2.achievements.includes("first_producer"), "achievements preserved");
  assert(engine2.currency("research") == null, "no research currency");
}

console.log("\n(b) scalinglaws in save unlocks pondering on load");
{
  const engine = createGame();
  const meta = defaultMeta();
  meta.upgradeLevels = { scalinglaws: 1 };
  meta.ponderingUnlocked = false;
  const json = exportSaveText(engine, meta);
  const engine2 = createGame();
  const meta2 = defaultMeta();
  importSaveText(engine2, meta2, json);
  assert(meta2.ponderingUnlocked === true, "scalinglaws sets ponderingUnlocked");
}

console.log("\n(c) invalid input is rejected");
{
  const engine = createGame();
  const meta = defaultMeta();

  const r1 = importSaveText(engine, meta, "not json {{{");
  assert(r1.ok === false && typeof r1.error === "string", "invalid JSON returns error string");

  const r2 = importSaveText(engine, meta, JSON.stringify({
    version: 4, meta: defaultMeta(), currencies: {}, resources: {}, producers: {},
  }));
  assert(r2.ok === false, "old version is rejected");

  const r3 = importSaveText(engine, meta, JSON.stringify({ version: 6 }));
  assert(r3.ok === false, "save missing required fields is rejected");
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
