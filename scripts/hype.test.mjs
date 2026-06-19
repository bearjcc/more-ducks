#!/usr/bin/env node
import { createGame } from "../src/game/economy.js";
import { defaultMeta } from "../src/game/meta.js";
import { buyHypeCampaign, campaignVisible } from "../src/game/hype.js";
import { decayHype, HYPE_DECAY_PER_SEC } from "../src/game/market.js";
import { HYPE_CAMPAIGNS } from "../src/data/hype.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

console.log("\n(a) campaignVisible respects era gate");
{
  const meta = defaultMeta();
  meta.era = 0;
  assert(campaignVisible(meta, HYPE_CAMPAIGNS[0]), "era-0 campaign visible at start");
  assert(!campaignVisible(meta, HYPE_CAMPAIGNS[1]), "era-1 campaign hidden at era 0");
  meta.era = 2;
  assert(campaignVisible(meta, HYPE_CAMPAIGNS[2]), "era-2 campaign visible at era 2");
}

console.log("\n(b) buyHypeCampaign deducts coins and grants hype");
{
  const engine = createGame();
  const meta = defaultMeta();
  const def = HYPE_CAMPAIGNS[0];
  engine.currency("coins").incrementBy(def.cost);
  const beforeCoins = engine.currency("coins").value;
  const result = buyHypeCampaign(engine, meta, def.id);
  assert(result?.id === def.id, "returns campaign def on success");
  assert(engine.currency("coins").value === beforeCoins - def.cost, "coins deducted");
  assert(engine.currency("hype").value === def.hypeGain, "hype granted");
}

console.log("\n(c) buyHypeCampaign stacks hype on repeat purchase");
{
  const engine = createGame();
  const meta = defaultMeta();
  const def = HYPE_CAMPAIGNS[0];
  engine.currency("coins").incrementBy(def.cost * 2);
  buyHypeCampaign(engine, meta, def.id);
  buyHypeCampaign(engine, meta, def.id);
  assert(engine.currency("hype").value === def.hypeGain * 2, "hype stacks");
}

console.log("\n(d) buyHypeCampaign rejects insufficient coins");
{
  const engine = createGame();
  const meta = defaultMeta();
  const def = HYPE_CAMPAIGNS[0];
  assert(buyHypeCampaign(engine, meta, def.id) === null, "fails with no coins");
  assert(engine.currency("hype").value === 0, "no hype granted");
}

console.log("\n(e) buyHypeCampaign rejects hidden campaigns");
{
  const engine = createGame();
  const meta = defaultMeta();
  meta.era = 0;
  engine.currency("coins").incrementBy(1_000_000);
  const hidden = HYPE_CAMPAIGNS.find((c) => c.era > 0);
  assert(hidden, "fixture has gated campaign");
  assert(buyHypeCampaign(engine, meta, hidden.id) === null, "era-gated campaign blocked");
}

console.log("\n(f) purchased hype decays over time");
{
  const engine = createGame();
  const meta = defaultMeta();
  const def = HYPE_CAMPAIGNS[0];
  engine.currency("coins").incrementBy(def.cost);
  buyHypeCampaign(engine, meta, def.id);
  const afterBuy = engine.currency("hype").value;
  decayHype(engine, 2);
  assert(
    engine.currency("hype").value === afterBuy - HYPE_DECAY_PER_SEC * 2,
    "campaign hype drains at HYPE_DECAY_PER_SEC",
  );
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
