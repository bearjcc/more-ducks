// ponytail: assert-based checks for feed gate + opex
import { defaultMeta } from "../src/game/meta.js";
import {
  FEED_GATE_THRESHOLD,
  needsFeed,
  feedDuck,
  recordAnswerForFeed,
  feedOpexPerSec,
  hasAutoFeeder,
} from "../src/game/feed.js";

const meta = defaultMeta();

console.log("feed gate");
for (let i = 0; i < FEED_GATE_THRESHOLD - 1; i++) recordAnswerForFeed(meta);
console.assert(!needsFeed(meta), "below threshold");
recordAnswerForFeed(meta);
console.assert(needsFeed(meta), "at threshold needs feed");
feedDuck(meta);
console.assert(!needsFeed(meta), "after feed");

meta.autoFeederOwned = true;
console.assert(!needsFeed(meta), "auto feeder skips gate");
console.assert(hasAutoFeeder(meta), "auto feeder flag");

const opex = feedOpexPerSec(10, meta);
console.assert(opex > 0, "opex scales with throughput");
console.assert(feedOpexPerSec(10, defaultMeta()) === 0, "no opex without feeder");

console.log("feed.test.mjs OK");
