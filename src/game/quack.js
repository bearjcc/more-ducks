// @ts-check
import { QUACKS, TIERS } from "../data/quacks.js";
import { BASIC_QUESTIONS, META_QUESTIONS } from "../data/questions.js";
import { DUCK_THOUGHTS, DUCK_FACTS } from "../data/thoughts.js";
import { ERAS } from "../data/eras.js";

const TOTAL_WEIGHT = QUACKS.reduce((s, [, w]) => s + w, 0);

/**
 * Meta questions ("Can bread solve this?", "Am I the villain?") are a late-game
 * voice: they stay out of the Auto pool until era 4 (The Hall of Mirrors —
 * synthetic question mills, "the questions are mostly ducks"), then ramp toward
 * a 50% share by the final era. Below the gate the chance is exactly 0 — no
 * early linear leak (HANDOFF.md §1.2).
 */
export const META_GATE_DUCKS = ERAS[4].duckThreshold;
export const META_FULL_DUCKS = ERAS[ERAS.length - 1].duckThreshold;
const META_MAX_CHANCE = 0.5;

/** Hitchhiker easter egg — not in the random question pool. */
export const FINAL_QUESTION =
  "What is the Ultimate Question of Life, the Universe, and Everything?";

/**
 * Reserved finale punchline. Emitted ONLY via an explicit finale path (the
 * Ultimate Question beat / singularity soft line) — never from tierWrap, never
 * from a random quack, never as a verbosity tier wrap. See HANDOFF.md §1.3.
 */
export const FINAL_ANSWER = "Additional ducks may improve confidence.";
const RECENT_WINDOW = 5;

/** @type {string|null} */
let lastQuack = null;
/** @type {string[]} */
let recentQuestions = [];
/** @type {string[]} */
let recentFluentAnswers = [];
/** @type {string|null} */
let lastThought = null;

/**
 * Score + coherence pick a verbosity tier (longer, more confident, never correct).
 * @param {number} score
 * @param {number} coherence
 * @returns {(q: string) => string}
 */
function tierWrap(score, coherence) {
  const effectiveScore = score + coherence * 1_000_000;
  let wrap = TIERS[0].wrap;
  for (const t of TIERS) {
    if (effectiveScore >= t.min) wrap = t.wrap;
  }
  return wrap;
}

/**
 * @param {string[]} pool
 * @param {() => number} rng
 * @param {string[]} recent
 * @returns {string}
 */
function pickFromPool(pool, rng, recent) {
  if (pool.length === 0) return "What should I ask?";
  const blocked = new Set(recent);
  let candidates = pool.filter((q) => !blocked.has(q));
  // ponytail: only happens if pool ≤ RECENT_WINDOW; both pools are much larger
  if (candidates.length === 0) candidates = pool;
  const q = candidates[Math.floor(rng() * candidates.length)];
  recent.push(q);
  if (recent.length > RECENT_WINDOW) recent.shift();
  return q;
}

/**
 * Weighted quack draw from the nonsense table (no consecutive repeat).
 * @param {() => number} rng
 * @returns {string}
 */
function pickRawQuack(rng) {
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const roll = rng() * TOTAL_WEIGHT;
    let acc = 0;
    for (const [text, weight] of QUACKS) {
      acc += weight;
      if (roll <= acc && text !== lastQuack) {
        lastQuack = text;
        return text;
      }
    }
  }
  for (const [text] of QUACKS) {
    if (text !== lastQuack) {
      lastQuack = text;
      return text;
    }
  }
  lastQuack = "quack";
  return "quack";
}

/**
 * Meta-question probability: 0% until the era-4 gate, then ramps to 50% by the
 * final era and holds there. No early leak below the gate (HANDOFF.md §1.2).
 * @param {number} totalDucksEver
 * @returns {number}
 */
export function metaQuestionChance(totalDucksEver) {
  if (totalDucksEver < META_GATE_DUCKS) return 0;
  const span = META_FULL_DUCKS - META_GATE_DUCKS;
  if (span <= 0) return META_MAX_CHANCE;
  const t = Math.min(1, (totalDucksEver - META_GATE_DUCKS) / span);
  return META_MAX_CHANCE * t;
}

/**
 * Fluent answer draw: BASIC/META pools delivered with authority (economy.md §4).
 * @param {number} totalDucksEver
 * @param {number} coherence
 * @param {() => number} rng
 * @returns {string}
 */
function pickFluentAnswer(totalDucksEver, coherence, rng) {
  const duckProgress = metaQuestionChance(totalDucksEver);
  const metaChance = duckProgress * (1 - coherence) + 0.5 * coherence;
  const pool = rng() < metaChance ? META_QUESTIONS : BASIC_QUESTIONS;
  return pickFromPool(pool, rng, recentFluentAnswers);
}

/**
 * Weighted quack draw; coherence blends toward fluent question-pool text.
 * @param {number} score
 * @param {number} [coherence]
 * @param {number} [totalDucksEver]
 * @param {() => number} [rng]
 * @returns {string}
 */
export function pickQuack(score, coherence = 0, totalDucksEver = 0, rng = Math.random) {
  const c = Math.min(1, Math.max(0, coherence));
  const base = rng() < c
    ? pickFluentAnswer(totalDucksEver, c, rng)
    : pickRawQuack(rng);
  return tierWrap(score, c)(base);
}

/**
 * Pick basic or meta question by progress; no repeat within the last five.
 * @param {number} totalDucksEver
 * @param {() => number} [rng]
 * @returns {string}
 */
export function pickQuestion(totalDucksEver, rng = Math.random) {
  const chance = metaQuestionChance(totalDucksEver);
  const pool = rng() < chance ? META_QUESTIONS : BASIC_QUESTIONS;
  return pickFromPool(pool, rng, recentQuestions);
}

/**
 * Draw base answer text before verbosity tier (for Answerdex + resolveQuestion).
 * @param {number} totalDucksEver
 * @param {number} coherence
 * @param {() => number} rng
 * @returns {string}
 */
function pickBaseAnswer(totalDucksEver, coherence, rng) {
  const c = Math.min(1, Math.max(0, coherence));
  return rng() < c
    ? pickFluentAnswer(totalDucksEver, c, rng)
    : pickRawQuack(rng);
}

/**
 * Single pipeline for manual, auto, and passive asks.
 * @param {{ text?: string, score: number, totalDucksEver: number, coherence?: number, rng?: () => number }} opts
 * @returns {{ question: string, answer: string, baseQuack: string }}
 */
export function resolveQuestion(opts) {
  const rng = opts.rng ?? Math.random;
  const coherence = opts.coherence ?? 0;
  const question = opts.text?.trim()
    ? opts.text.trim().slice(0, 500)
    : pickQuestion(opts.totalDucksEver, rng);
  const baseQuack = pickBaseAnswer(opts.totalDucksEver, coherence, rng);
  const answer = tierWrap(opts.score, coherence)(baseQuack);
  return { question, answer, baseQuack };
}

/**
 * Pick a vanity question and a tiered quack answer.
 * @param {number} score
 * @param {number} totalDucksEver
 * @param {number} [coherence]
 * @param {() => number} [rng]
 * @returns {{ question: string, answer: string }}
 */
export function askDuck(score, totalDucksEver, coherence = 0, rng = Math.random) {
  const r = resolveQuestion({ score, totalDucksEver, coherence, rng });
  return { question: r.question, answer: r.answer };
}

/** Max share of ponder thoughts drawn from DUCK_FACTS at full coherence. */
export const THOUGHT_FACT_CHANCE_MAX = 0.5;

/**
 * Chance a ponder thought is a real duck fact (0% at start, 50% at coherence 1).
 * @param {number} coherence
 * @returns {number}
 */
export function thoughtFactChance(coherence) {
  const c = Math.min(1, Math.max(0, coherence));
  return THOUGHT_FACT_CHANCE_MAX * c;
}

/**
 * One interior-monologue line for Pondering Mode (no consecutive repeat).
 * Research/coherence raises the odds of DUCK_FACTS over generic DUCK_THOUGHTS.
 * @param {number} [coherence]
 * @param {() => number} [rng]
 * @returns {string}
 */
export function pickThought(coherence = 0, rng = Math.random) {
  const pool = rng() < thoughtFactChance(coherence) ? DUCK_FACTS : DUCK_THOUGHTS;
  if (pool.length === 0) return "…";
  const maxAttempts = 8;
  for (let i = 0; i < maxAttempts; i++) {
    const thought = pool[Math.floor(rng() * pool.length)];
    if (thought !== lastThought) {
      lastThought = thought;
      return thought;
    }
  }
  const fallback = pool.find((t) => t !== lastThought) ?? pool[0];
  lastThought = fallback;
  return fallback;
}

/** Reset repeat guards (tests). */
export function resetQuackState() {
  lastQuack = null;
  lastThought = null;
  recentQuestions = [];
  recentFluentAnswers = [];
}
