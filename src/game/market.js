// @ts-check
import { RESEARCH_UPGRADES } from "../data/research.js";

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
 * supply 1 → ~0.02 coins/s before crumbMult / Duckdex upkeep. See economy.md §3.
 */
export const COIN_PER_ANSWER = 0.02;

/**
 * Research earned per passively served answer (small trickle; pondering adds more in F2).
 *
 * At 1 A/s this is 0.008 research/s — first upgrade (~5) in ~10 min of passive play.
 */
export const RESEARCH_PER_ANSWER = 0.008;

/**
 * Lifetime research earned to reach coherence 1 (~10 min passive to first upgrade,
 * full curve mid Act 2). Balance in scripts/sim.mjs when the arc is wired.
 */
export const COHERENCE_RESEARCH_THRESHOLD = 50;

/**
 * Banked research plus research spent on upgrades (spending does not lower coherence).
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function researchEarnedLifetime(engine, meta) {
  const balance = engine.currency("research")?.value ?? 0;
  let spent = 0;
  for (const id of meta.upgradesOwned) {
    const u = RESEARCH_UPGRADES.find((x) => x.id === id);
    if (u) spent += u.cost;
  }
  return balance + spent;
}

/**
 * Narrative coherence in [0, 1] from lifetime research (economy.md §4).
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function computeCoherence(engine, meta) {
  return Math.min(1, researchEarnedLifetime(engine, meta) / COHERENCE_RESEARCH_THRESHOLD);
}

/**
 * Write `meta.coherence` from current research totals (call each tick / on earn).
 * @param {import("./meta.js").Meta} meta
 * @param {any} engine
 */
export function updateCoherence(meta, engine) {
  meta.coherence = computeCoherence(engine, meta);
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
 * Efficiency multiplier from research upgrades (supply ↑ per duck).
 * @param {import("./upgrades.js").Mods} mods
 * @returns {number}
 */
export function efficiencyMult(mods) {
  return mods?.efficiencyMult ?? 1;
}

/**
 * Research credited for `served` answers this tick.
 * @param {number} served  Answers resolved (count, not rate).
 * @returns {number}
 */
export function researchFromServed(served) {
  return served * RESEARCH_PER_ANSWER;
}

/** Max extra coherence blended into a pondered answer at full hold depth. */
export const PONDER_COHERENCE_BOOST_MAX = 0.25;

/** Flat research on any pondered tap (chain-of-thought costs compute). */
export const PONDER_RESEARCH_BASE = 0.04;

/** Extra research at full ponder depth (on top of PONDER_RESEARCH_BASE). */
export const PONDER_RESEARCH_PER_DEPTH = 0.06;

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
 * Research bonus for one manual ponder (before citations mult).
 * @param {number} depth
 * @returns {number}
 */
export function ponderResearchBonus(depth) {
  return PONDER_RESEARCH_BASE + depth * PONDER_RESEARCH_PER_DEPTH;
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
  const d = BASE_DEMAND + intake + HYPE_FACTOR * hype;
  meta.demand = d;
  return d;
}

/**
 * Apply per-tick Hype decay (mutates engine currency).
 * @param {any} engine
 * @param {number} dt  Elapsed seconds since last tick.
 * @param {import("./dexMods.js").DexMods} [dex]
 */
export function decayHype(engine, dt, dex = null) {
  if (dt <= 0) return;
  const hype = engine.currency("hype");
  if (!hype || hype.value <= 0) return;
  const rate = HYPE_DECAY_PER_SEC * (dex?.hypeDecayMult ?? 1);
  const drain = rate * dt;
  hype.incrementBy(-Math.min(hype.value, drain));
}
