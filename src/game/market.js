// @ts-check

/**
 * Baseline question arrival rate (Q/s) when Hype is zero.
 *
 * Keeps passive income alive at the start of Act 1 without manufacturing a
 * bubble — the player still funds early ducks by tapping. Once Hype campaigns
 * land (Milestone D), this floor is the quiet market; profit scales with
 * `min(supply, baseDemand + hypeFactor·hype)`. See docs/economy.md §3.
 */
export const BASE_DEMAND = 1;

/**
 * Questions per second added per unit of Hype currency.
 *
 * Hype is a spendable buff (campaigns, Duckdex demands). At this factor, +100
 * Hype adds +20 Q/s — enough to matter, not enough to skip supply investment.
 */
export const HYPE_FACTOR = 0.2;

/**
 * Organic demand per live duck — "more ducks → more buzz → more questions".
 *
 * The flock generates its own attention, so the coin economy never freezes
 * waiting on a coin→hype→demand bootstrap. Buzz has DIMINISHING RETURNS
 * (`flock^BUZZ_EXPONENT`): the market saturates, so an ever-larger share of the
 * flock becomes idle supply you must monetize by manufacturing extra demand
 * (hype campaigns, Duckdex intake) — the satirical "overbuilt, over-hyped" loop.
 * The sub-linear exponent also tames the flock→demand→coins→flock feedback so the
 * arc stays evenly paced instead of exploding. See docs/curve.md §8.
 */
export const BUZZ_PER_DUCK = 2;
export const BUZZ_EXPONENT = 0.6;

/**
 * Hype units drained per real-time second (linear decay toward zero).
 *
 * Campaigns must be sustained — satire of the perpetual hype cycle. At this
 * rate, a 100-Hype burst fades in ~9 minutes; retune in scripts/sim.mjs when
 * the two-sided loop is wired (B2+).
 */
export const HYPE_DECAY_PER_SEC = 0.12;

/**
 * Answers each duck can serve per second at efficiency 1.
 *
 * Supply scales with flock size; demand starts at BASE_DEMAND, so early passive
 * income is capped by min(supply, demand) — not by duck count alone.
 */
export const ANSWERS_PER_DUCK_PER_SEC = 1;

/**
 * Coins earned per answered question (passive market resolution).
 *
 * Tuned to replace CRUMB_PER_DUCK_PER_SEC foraging at Act 1: one duck, demand 1,
 * supply 1 → ~0.029 coins/s before coinMult / Duckdex upkeep. See economy.md §3.
 */
export const COIN_PER_ANSWER = 0.132;

/**
 * Lifetime answers to reach coherence 1. Balance in scripts/sim.mjs when the arc is wired.
 */
export const COHERENCE_ANSWERS_THRESHOLD = 50;

/**
 * Narrative coherence in [0, 1] from lifetime answers served.
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function computeCoherence(meta) {
  return Math.min(1, (meta.answersTotal ?? 0) / COHERENCE_ANSWERS_THRESHOLD);
}

/**
 * Write `meta.coherence` from current answer totals (call each tick / on earn).
 * @param {import("./meta.js").Meta} meta
 */
export function updateCoherence(meta) {
  meta.coherence = computeCoherence(meta);
}

/**
 * Coin payout multiplier — fluent answers sell for more (economy.md §4).
 * @param {number} coherence  In [0, 1].
 * @returns {number}
 */
export function coherenceValueMult(coherence) {
  return 1 + coherence;
}

/**
 * Efficiency multiplier from efficiency upgrades (supply ↑ per duck).
 * @param {import("./upgrades.js").Mods} mods
 * @returns {number}
 */
export function efficiencyMult(mods) {
  return mods?.efficiencyMult ?? 1;
}

/** Max extra coherence blended into a pondered answer at full hold depth. */
export const PONDER_COHERENCE_BOOST_MAX = 0.25;

/** Extra coin fraction on a pondered tap (pondering costs bread). */
export const PONDER_COIN_BONUS_BASE = 0.04;

/** Extra coin fraction at full ponder depth (on top of PONDER_COIN_BONUS_BASE). */
export const PONDER_COIN_BONUS_PER_DEPTH = 0.06;

/** Hold shorter than this counts as a quick tap (depth 0, still streams one thought). */
export const PONDER_MIN_HOLD_MS = 100;

/** Hold at or beyond this reaches full ponder depth (1). */
export const PONDER_MAX_DEPTH_HOLD_MS = 3500;

/**
 * Normalised ponder depth from hold duration (0–1).
 * @param {number} holdMs
 * @returns {number}
 */
export function ponderDepth(holdMs) {
  if (holdMs < PONDER_MIN_HOLD_MS) return 0;
  return Math.min(1, (holdMs - PONDER_MIN_HOLD_MS) / (PONDER_MAX_DEPTH_HOLD_MS - PONDER_MIN_HOLD_MS));
}

/**
 * Coherence used for answer draw and coin mult after a ponder.
 * @param {number} coherence  Base meta coherence in [0, 1].
 * @param {number} depth  Ponder depth in [0, 1].
 * @returns {number}
 */
export function ponderEffectiveCoherence(coherence, depth) {
  return Math.min(1, coherence + depth * PONDER_COHERENCE_BOOST_MAX);
}

/**
 * Coin payout bonus fraction for one manual ponder (multiplied into coin gain).
 * @param {number} depth
 * @returns {number}
 */
export function ponderCoinBonus(depth) {
  return PONDER_COIN_BONUS_BASE + depth * PONDER_COIN_BONUS_PER_DEPTH;
}

/**
 * Answer supply rate (A/s): duck population × per-duck rate × efficiency.
 * @param {any} engine
 * @param {import("./upgrades.js").Mods} mods
 * @returns {number}
 */
export function supplyPerSecond(engine, mods) {
  const ducks = engine.resource("ducks")?.count ?? 0;
  return ducks * ANSWERS_PER_DUCK_PER_SEC * efficiencyMult(mods);
}

/**
 * Questions actually answered per second (supply/demand gate).
 * @param {number} supply  A/s
 * @param {number} demand  Q/s
 * @returns {number}
 */
export function servedPerSecond(supply, demand) {
  return Math.min(supply, demand);
}

/**
 * Market demand: questions wanting answers per second.
 * @param {import("./meta.js").Meta} meta
 * @param {any} engine
 * @param {import("./dexMods.js").DexMods} [dex]
 * @returns {number}
 */
export function demand(meta, engine, dex = null) {
  const hype = engine.currency("hype")?.value ?? 0;
  const intake = dex?.questionIntake ?? 0;
  const ducks = engine.resource("ducks")?.count ?? 0;
  const buzz = BUZZ_PER_DUCK * Math.pow(Math.max(0, ducks), BUZZ_EXPONENT);
  const d = BASE_DEMAND + buzz + intake + HYPE_FACTOR * hype;
  meta.demand = d;
  return d;
}

/**
 * Apply per-tick Hype decay (mutates engine currency).
 * @param {any} engine
 * @param {number} dt  Elapsed seconds since last tick.
 * @param {import("./dexMods.js").DexMods} [dex]
 * @param {number} [decayPerSec] Base decay rate before dex mult (default HYPE_DECAY_PER_SEC).
 */
export function decayHype(engine, dt, dex = null, decayPerSec = HYPE_DECAY_PER_SEC) {
  if (dt <= 0) return;
  const hype = engine.currency("hype");
  if (!hype || hype.value <= 0) return;
  const rate = decayPerSec * (dex?.hypeDecayMult ?? 1);
  const drain = rate * dt;
  hype.incrementBy(-Math.min(hype.value, drain));
}
