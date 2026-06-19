import { defaultMeta } from "../src/game/meta.js";
import { createGame } from "../src/game/economy.js";
import {
  unlockRegion,
  rentRegion,
  floodAustralia,
  totalRentPerDay,
  tickRegions,
  applyPendingRent,
} from "../src/game/regions.js";
import { GAME_DAY_SEC } from "../src/data/regions.js";

const engine = createGame();
const meta = defaultMeta();
meta.era = 4;
engine.currency("coins").incrementBy(100_000_000);

console.assert(unlockRegion(engine, meta, "europe"), "unlock europe");
console.assert(floodAustralia(engine, meta) === false, "australia not unlocked yet");
console.assert(unlockRegion(engine, meta, "australia"), "unlock australia");
engine.currency("coins").incrementBy(60_000_000);
console.assert(floodAustralia(engine, meta), "flood australia");
console.assert(rentRegion(engine, meta, "europe"), "rent europe");
console.assert(totalRentPerDay(meta) > 0, "rent total");

tickRegions(meta, GAME_DAY_SEC);
console.assert(meta.pendingRent > 0, "rent accrues per game-day");
applyPendingRent(engine, meta);
console.assert(meta.pendingRent === 0, "rent applied");

console.log("regions.test.mjs OK");
