import {
  purchaseRevealed,
  flockTabUnlocked,
  flockProducersUnlocked,
  dashboardTabUnlocked,
  upgradesTabUnlocked,
  hypeTabUnlocked,
  regionsTabUnlocked,
  collectionsTabUnlocked,
  tabUnlocked,
  STEADY_BEAK_COST,
} from "../src/game/unlocks.js";
import { defaultMeta } from "../src/game/meta.js";

const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};

assert(purchaseRevealed(2.5, 25, false), "10% reveals at 2.5 coins for 25 cost");
assert(!purchaseRevealed(2, 25, false), "below 10% stays hidden");
assert(purchaseRevealed(0, 25, true), "owned always visible");
assert(STEADY_BEAK_COST === 25, "steady beak cost is 25");

const meta = defaultMeta();
assert(!flockTabUnlocked(meta), "flock locked before 3 questions + feed");

meta.questionsAnswered = 3;
meta.manualFeeds = 1;
assert(flockTabUnlocked(meta), "flock at 3 questions + manual feed");

meta.manualFeeds = 0;
assert(!flockTabUnlocked(meta), "flock locked without manual feed");

meta.manualFeeds = 1;
meta.questionsAnswered = 2;
assert(!flockTabUnlocked(meta), "flock locked before 3 questions");

meta.questionsAnswered = 3;
meta.manualFeeds = 1;
assert(upgradesTabUnlocked(meta), "upgrades at 3 questions + feed");

meta.questionsAnswered = 2;
assert(!upgradesTabUnlocked(meta), "upgrades locked before 3 questions");

meta.questionsAnswered = 3;
meta.manualFeeds = 0;
assert(!upgradesTabUnlocked(meta), "upgrades locked without feed");

meta.manualFeeds = 1;
assert(dashboardTabUnlocked(meta), "dashboard when flock unlocks");
meta.questionsAnswered = 2;
assert(!dashboardTabUnlocked(meta), "dashboard locked without flock");
assert(!dashboardTabUnlocked(meta, 0.5), "dashboard not from passive answers/sec alone");

const engine = { producers: { duckling: { count: 0 } } };
meta.questionsAnswered = 3;
meta.manualFeeds = 1;
meta.upgradeLevels = {};
assert(!hypeTabUnlocked(meta, 0), "hype locked without upgrade purchase");

meta.upgradeLevels.steadybeak = 1;
assert(hypeTabUnlocked(meta, 0), "hype after first upgrade with flock");

meta.manualFeeds = 1;
assert(!flockProducersUnlocked(meta), "producers locked before Auto Feeder");
meta.upgradeLevels.autofeeder = 1;
meta.autoFeederOwned = true;
assert(flockProducersUnlocked(meta), "producers after Auto Feeder");

meta.upgradeLevels = {};
meta.autoFeederOwned = false;
assert(!flockProducersUnlocked(meta), "producers locked without autofeeder");

meta.upgradeLevels = { steadybeak: 1 };
meta.questionsAnswered = 2;
assert(!hypeTabUnlocked(meta, 0), "hype locked without flock");

meta.questionsAnswered = 3;
meta.manualFeeds = 1;
assert(hypeTabUnlocked(meta, 0), "hype with flock + upgrade purchase");

meta.era = 3;
assert(!regionsTabUnlocked(meta), "regions locked before era 4");

meta.era = 4;
assert(regionsTabUnlocked(meta), "regions at era 4");

meta.era = 0;
meta.answerdexSeen = ["a", "b"];
assert(!collectionsTabUnlocked(meta), "collections needs 3 answers or era 2");

meta.answerdexSeen = ["a", "b", "c"];
assert(collectionsTabUnlocked(meta), "collections at 3 answers");

meta.era = 2;
meta.answerdexSeen = [];
assert(collectionsTabUnlocked(meta), "collections at era 2");

meta.questionsAnswered = 3;
meta.manualFeeds = 1;
assert(tabUnlocked("flock", meta, 0, engine), "tabUnlocked flock");
assert(tabUnlocked("dashboard", meta, 0, engine), "tabUnlocked dashboard");

meta.questionsAnswered = 0;
meta.manualFeeds = 0;
meta.upgradeLevels = {};
assert(!tabUnlocked("dashboard", meta, 0, engine), "tabUnlocked dashboard false early");

meta.questionsAnswered = 3;
meta.manualFeeds = 1;
meta.upgradeLevels.steadybeak = 1;
assert(tabUnlocked("hype", meta, 0, engine), "tabUnlocked hype");
assert(!tabUnlocked("regions", meta, 0, engine), "tabUnlocked regions false at era 0");
meta.era = 4;
assert(tabUnlocked("regions", meta, 0, engine), "tabUnlocked regions at era 4");
assert(tabUnlocked("collections", meta, 0, engine), "tabUnlocked collections");

console.log("unlocks.test.mjs: all passed");
