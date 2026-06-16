// @ts-check
/** Lightweight milestone toasts beyond the Duckdex. */

/**
 * @typedef {{ id: string, title: string, body: string, test: (ctx: Ctx) => boolean }} Milestone
 * @typedef {{ engine: any, meta: import("./meta.js").Meta }} Ctx
 */

/** @type {Milestone[]} */
const MILESTONES = [
  { id: "first_producer", title: "Delegation", body: "You bought your first duck-maker. The pond approves.", test: (c) => hasAnyProducer(c.engine) },
  { id: "million_ducks", title: "Seven Figures", body: "A million ducks. Still cute. Mostly.", test: (c) => c.meta.totalDucksEver >= 1_000_000 },
  { id: "era3", title: "Recursive Situation", body: "Duck Intelligence unlocked. The blueprints are… optimistic.", test: (c) => c.meta.era >= 3 },
  { id: "singularity", title: "Volunteered", body: "You own a Quack Singularity. Australia sends its regards.", test: (c) => (c.engine.producer("singularity")?.count ?? 0) > 0 },
  { id: "billion_ducks", title: "Ten Figures", body: "A billion ducks. The pond is a concept now.", test: (c) => c.meta.totalDucksEver >= 1_000_000_000 },
];

/** @param {any} engine @returns {boolean} */
function hasAnyProducer(engine) {
  for (const key in engine.producers) {
    if (engine.producers[key].count > 0) return true;
  }
  return false;
}

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
