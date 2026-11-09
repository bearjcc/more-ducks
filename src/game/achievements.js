// @ts-check
/** Lightweight milestone toasts beyond the Duckdex. */

import { DUCKS } from "../data/ducks.js";
import { ACTS } from "../data/eras.js";
import { isRareAnswer } from "../data/quacks.js";
import { dexComplete } from "./dex.js";

/**
 * @typedef {{ id: string, title: string, body: string, test: (ctx: Ctx) => boolean }} Milestone
 * @typedef {{ engine: any, meta: import("./meta.js").Meta }} Ctx
 */

/** @param {any} engine @returns {boolean} */
function hasAnyProducer(engine) {
  for (const key in engine.producers) {
    if (engine.producers[key].count > 0) return true;
  }
  return false;
}

/** @type {Milestone[]} */
export const MILESTONES = [
  { id: "first_feed", title: "Hand-Fed", body: "You fed the duck yourself. The bond is real.", test: (c) => c.meta.manualFeeds >= 1 },
  { id: "first_producer", title: "Delegation", body: "You bought your first duck-maker. The pond approves.", test: (c) => hasAnyProducer(c.engine) },
  { id: "hundred_ducks", title: "Triple Digits", body: "One hundred ducks. The pond feels smaller.", test: (c) => c.meta.totalDucksEver >= 100 },
  { id: "answer_collector", title: "Answer Curator", body: "Five distinct answers logged in the Answerdex.", test: (c) => c.meta.answerdexSeen.length >= 5 },
  { id: "first_duckdex", title: "Catalogued", body: "First breed in the Duckdex. The collection begins.", test: (c) => c.meta.dexUnlocked.length >= 1 },
  { id: "era1", title: ACTS[1].name, body: `${ACTS[1].name} — extra ducks, extra ledgers.`, test: (c) => c.meta.era >= 1 },
  { id: "auto_feeder", title: "Automated Care", body: "Auto Feeder installed. Hunger is someone else's job.", test: (c) => c.meta.autoFeederOwned },
  { id: "million_ducks", title: "Seven Figures", body: "A million ducks. Still cute. Mostly.", test: (c) => c.meta.totalDucksEver >= 1_000_000 },
  { id: "half_dex", title: "Half the Flock", body: "Half the breeds catalogued. The rest are waiting.", test: (c) => c.meta.dexUnlocked.length >= Math.ceil(DUCKS.length / 2) },
  { id: "rare_answer", title: "Cosmic Quack", body: "A rare answer surfaced. The pond shivered.", test: (c) => c.meta.answerdexSeen.some(isRareAnswer) },
  { id: "era3", title: ACTS[3].name, body: `${ACTS[3].name} — demand outruns supply in the profitable direction.`, test: (c) => c.meta.era >= 3 },
  { id: "singularity", title: "Volunteered", body: "You own a Quack Singularity. Australia sends its regards.", test: (c) => (c.engine.producer("singularity")?.count ?? 0) > 0 },
  { id: "full_dex", title: "Complete Collection", body: "Every breed catalogued. The Duckdex is full.", test: (c) => dexComplete(c.meta) },
  { id: "australia", title: "Continental Shift", body: "Australia is ponds now. Cartography updated.", test: (c) => c.meta.australiaFlooded },
  { id: "billion_ducks", title: "Ten Figures", body: "A billion ducks. The pond is a concept now.", test: (c) => c.meta.totalDucksEver >= 1_000_000_000 },
  { id: "ending", title: "The End?", body: "You reached an ending. The ducks continue anyway.", test: (c) => !!c.meta.endingId || !!c.meta.flags?.ended },
];

/** ponytail: fixed catalog size — content.test.mjs asserts length === 16 */
export const ACHIEVEMENT_COUNT = MILESTONES.length;

/**
 * @param {Ctx} ctx
 * @param {(spec: { title: string, body: string }) => void} show
 */
export function checkAchievements(ctx, show) {
  if (!Array.isArray(ctx.meta.achievements)) ctx.meta.achievements = [];
  for (const m of MILESTONES) {
    if (ctx.meta.achievements.includes(m.id)) continue;
    if (m.test(ctx)) {
      ctx.meta.achievements.push(m.id);
      show({ title: m.title, body: m.body });
    }
  }
}
