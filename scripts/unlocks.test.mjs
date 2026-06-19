import {

  purchaseRevealed,

  flockTabUnlocked,

  dashboardTabUnlocked,

  upgradesTabUnlocked,

  hypeTabUnlocked,

  researchTabUnlocked,

  marksSectionUnlocked,

  moreTabUnlocked,

  tabUnlocked,

  PURCHASE_REVEAL_RATIO,

  STEADY_BEAK_COST,

} from "../src/game/unlocks.js";

import { defaultMeta } from "../src/game/meta.js";



const assert = (ok, msg) => {

  if (!ok) throw new Error(msg);

};



assert(purchaseRevealed(8, 80, false), "10% reveals at 8 coins for 80 cost");

assert(!purchaseRevealed(7, 80, false), "below 10% stays hidden");

assert(purchaseRevealed(0, 80, true), "owned always visible");



const meta = defaultMeta();

meta.questionsAnswered = 2;

meta.manualFeeds = 1;

assert(!flockTabUnlocked(meta), "flock needs 3 questions");

meta.questionsAnswered = 3;

assert(flockTabUnlocked(meta), "flock unlocks at 3 questions + feed");



meta.questionsAnswered = 2;

meta.manualFeeds = 0;

assert(!dashboardTabUnlocked(meta), "dashboard needs 3 questions, flock, or answers/sec");

meta.questionsAnswered = 3;

assert(dashboardTabUnlocked(meta), "dashboard at 3 questions");

assert(dashboardTabUnlocked(meta, 0.5), "dashboard when answers/sec > 0");

meta.questionsAnswered = 2;

meta.manualFeeds = 1;

assert(!dashboardTabUnlocked(meta), "dashboard not at 2 questions without answers/sec");

meta.questionsAnswered = 3;

assert(dashboardTabUnlocked(meta), "dashboard when flock unlocks");



const engine = { producers: { duckling: { count: 0 } } };

assert(!upgradesTabUnlocked(meta, 0, engine), "upgrades locked without flock");

assert(

  upgradesTabUnlocked(meta, STEADY_BEAK_COST * PURCHASE_REVEAL_RATIO, engine),

  "upgrades at 10% steady beak"

);

engine.producers.duckling.count = 1;

assert(upgradesTabUnlocked(meta, 0, engine), "upgrades when producer owned");



meta.era = 0;

meta.questionsAnswered = 2;

assert(!hypeTabUnlocked(meta, 0), "hype locked without flock");

meta.questionsAnswered = 3;

assert(hypeTabUnlocked(meta, 0), "hype when flock + first campaign visible");

meta.questionsAnswered = 2;

meta.manualFeeds = 0;

meta.era = 1;

assert(hypeTabUnlocked(meta, 0), "hype at era 1 without flock");

meta.era = 0;

meta.questionsAnswered = 3;

meta.manualFeeds = 1;

assert(!researchTabUnlocked(meta, 0), "research locked with no research");

assert(researchTabUnlocked(meta, 0.5), "research at 10% of promptcache");

assert(researchTabUnlocked(meta, 5), "research when first upgrade visible");



meta.era = 0;

assert(!marksSectionUnlocked(meta), "marks section locked early");

meta.era = 1;

assert(marksSectionUnlocked(meta), "marks section at era 1");



meta.era = 0;

meta.answerdexSeen = ["a", "b"];

assert(!moreTabUnlocked(meta), "more needs 3 quacks or era 2");

meta.answerdexSeen = ["a", "b", "c"];

assert(moreTabUnlocked(meta), "more at 3 quacks");



assert(tabUnlocked("flock", meta, 0, engine), "tabUnlocked flock");

assert(tabUnlocked("dashboard", meta, 0, engine), "tabUnlocked dashboard");

meta.questionsAnswered = 0;

assert(!tabUnlocked("dashboard", meta, 0, engine), "tabUnlocked dashboard false early");

meta.questionsAnswered = 3;

assert(tabUnlocked("hype", meta, 0, engine), "tabUnlocked hype");

assert(tabUnlocked("research", meta, 0, engine, 0, 0.5), "tabUnlocked research");



console.log("unlocks.test.mjs: all passed");

