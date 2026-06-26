#!/usr/bin/env node
// Framework-free self-check for the quack engine.
// Run: node scripts/quack.test.mjs

import { BASIC_ANSWERS, TIERS, isCollectibleAnswer } from "../src/data/quacks.js";
import { recordAnswerdex } from "../src/game/answerdex.js";
import { defaultMeta } from "../src/game/meta.js";
import { QUESTIONS, BASIC_QUESTIONS, META_QUESTIONS } from "../src/data/questions.js";
import { pickAnswer, pickQuestion, askDuck, metaQuestionChance, resetQuackState, pickThought, thoughtFactChance, THOUGHT_FACT_CHANCE_MAX, FINAL_QUESTION, FINAL_ANSWER, META_GATE_DUCKS, META_FULL_DUCKS } from "../src/game/quack.js";
import { DUCK_THOUGHTS, DUCK_FACTS } from "../src/data/thoughts.js";
import {
  ponderDepth,
  ponderEffectiveCoherence,
  ponderCoinBonus,
  PONDER_MAX_DEPTH_HOLD_MS,
} from "../src/game/market.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

// ── Seeded RNG (LCG) ────────────────────────────────────────────────────────
function makeLcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ── (a) No consecutive repeat across N draws ─────────────────────────────────
console.log("\n(a) No consecutive repeat");
{
  resetQuackState();
  // Reset the module-level lastQuack by drawing many times with different seeds.
  const rng = makeLcg(42);
  const N = 200;
  let prev = "";
  let consecutiveRepeat = false;
  for (let i = 0; i < N; i++) {
    const result = pickAnswer(0, 0, 0, rng);
    if (result === prev && i > 0) { consecutiveRepeat = true; break; }
    prev = result;
  }
  assert(!consecutiveRepeat, `No base quack repeated back-to-back over ${N} draws`);
}

// ── (b) Tier text lengthens as score crosses thresholds ─────────────────────
console.log("\n(b) Tier verbosity increases with score");
{
  resetQuackState();
  const rng = makeLcg(7);
  // Draw one result per tier threshold to compare lengths.
  const scores = [0, 100];
  let prevLen = -1;
  let monotone = true;
  for (const score of scores) {
    resetQuackState();
    const rng2 = makeLcg(99);
    const text = pickAnswer(score, 0, 0, rng2);
    if (text.length < prevLen) { monotone = false; }
    prevLen = text.length;
  }
  assert(monotone, "Answer length is non-decreasing across tier thresholds");

  // Spot-check: score 0 is bare quack; score ≥ 100 repeats it (no prefix).
  const rng3 = makeLcg(99);
  const lowText = pickAnswer(0, 0, 0, rng3);
  const rng4 = makeLcg(99);
  const highText = pickAnswer(100, 0, 0, rng4);
  const parts = highText.split(" ");
  assert(parts.length >= 2 && parts[0] === parts[1], "Score ≥ 100 repeats the base quack");
  assert(!lowText.includes("After"), "Score 0 has no prefix");
  assert(!highText.includes("After careful consideration"), "No corporate-style prefix at any tier");
}

// ── (c) Every BASIC_ANSWERS entry is reachable ───────────────────────────────
console.log("\n(c) Every BASIC_ANSWERS entry is reachable");
{
  resetQuackState();
  const reached = new Set();
  // Seed a deterministic run long enough to hit all entries.
  // Total weight ≈ 10,600; each draw is independent so we need many draws.
  // 100,000 draws should hit everything except the 0.1-weight easter egg
  // (expected draws to hit it: ~106,000).  We check all entries with weight ≥ 1.
  const rng = makeLcg(1337);
  const DRAWS = 150_000;
  for (let i = 0; i < DRAWS; i++) {
    const text = pickAnswer(0, 0, 0, rng);
    reached.add(text);
  }

  const highWeight = BASIC_ANSWERS.filter(([, w]) => w >= 1);
  let allReached = true;
  for (const [text] of highWeight) {
    if (!reached.has(text)) {
      allReached = false;
      console.error(`    not reached: "${text}"`);
    }
  }
  assert(allReached, `All ${highWeight.length} entries with weight ≥ 1 were drawn in ${DRAWS} tries`);

  // Easter egg has weight 0.1 — just verify it is in the table.
  const hasEgg = BASIC_ANSWERS.some(([t]) => t === "You're absolutely right!");
  assert(hasEgg, "Easter egg entry exists in BASIC_ANSWERS table");
}

// ── (d) TIERS are ordered by threshold ──────────────────────────────────────
console.log("\n(d) TIERS sanity");
{
  let ordered = true;
  for (let i = 1; i < TIERS.length; i++) {
    if (TIERS[i].min <= TIERS[i - 1].min) { ordered = false; break; }
  }
  assert(ordered, "TIERS are ordered by ascending threshold");
  assert(TIERS[0].min === 0, "First tier threshold is 0 (always matches)");
}

// ── (e) Questions pool sanity ───────────────────────────────────────────────
console.log("\n(e) Questions pool");
{
  assert(BASIC_QUESTIONS.length > 0, "BASIC_QUESTIONS is non-empty");
  assert(META_QUESTIONS.length > 0, "META_QUESTIONS is non-empty");
  const basicSet = new Set(BASIC_QUESTIONS);
  const overlap = META_QUESTIONS.filter((q) => basicSet.has(q));
  assert(overlap.length === 0, "BASIC and META pools do not overlap");
  assert(QUESTIONS.length >= 40, `At least 40 questions (got ${QUESTIONS.length})`);
  let allShort = true;
  for (const q of QUESTIONS) {
    const words = q.trim().split(/\s+/).length;
    if (words > 10) {
      allShort = false;
      console.error(`    too long (${words} words): "${q}"`);
    }
  }
  assert(allShort, "Every question has ≤ 10 words");
}

// ── (f) No repeat within last 5 questions ───────────────────────────────────
console.log("\n(f) No repeat within last 5 questions");
{
  resetQuackState();
  const rng = makeLcg(314);
  const N = 200;
  /** @type {string[]} */
  const recent = [];
  let windowRepeat = false;
  for (let i = 0; i < N; i++) {
    const result = pickQuestion(2_000_000_000, rng, true);
    if (recent.includes(result)) {
      windowRepeat = true;
      break;
    }
    recent.push(result);
    if (recent.length > 5) recent.shift();
  }
  assert(!windowRepeat, `No question repeated within the last 5 over ${N} draws`);
}

// ── (h) Meta question chance curve ──────────────────────────────────────────
console.log("\n(h) Meta question chance");
{
  assert(metaQuestionChance(0, false) === 0, "0% meta chance when tabs locked");
  assert(metaQuestionChance(META_FULL_DUCKS, false) === 0, "0% meta chance when tabs locked at max ducks");
  assert(metaQuestionChance(0, true) === 0, "0% meta chance at game start even when allowed");
  assert(metaQuestionChance(META_GATE_DUCKS - 1, true) === 0, "0% meta chance just below the era-4 gate");
  assert(metaQuestionChance(META_GATE_DUCKS, true) === 0, "0% meta chance at the gate (ramp starts here)");
  assert(metaQuestionChance(META_FULL_DUCKS, true) === 0.5, "50% meta chance by the final era");
  assert(metaQuestionChance(META_FULL_DUCKS * 2, true) === 0.5, "Meta chance capped at 50%");
  const mid = metaQuestionChance((META_GATE_DUCKS + META_FULL_DUCKS) / 2, true);
  assert(mid > 0 && mid < 0.5, `Meta chance ramps between the gate and final era (got ${mid})`);
}

// ── (i) Early game uses basic pool only ─────────────────────────────────────
console.log("\n(i) Early game basic pool only");
{
  resetQuackState();
  const rng = makeLcg(2718);
  const metaSet = new Set(META_QUESTIONS);
  let leakedMeta = false;
  for (let i = 0; i < 500; i++) {
    const q = pickQuestion(0, rng, false);
    if (metaSet.has(q)) {
      leakedMeta = true;
      console.error(`    meta at start: "${q}"`);
      break;
    }
  }
  assert(!leakedMeta, "tabs locked never draws from META_QUESTIONS");

  resetQuackState();
  const rngGate = makeLcg(2718);
  let leakedBelowGate = false;
  for (let i = 0; i < 500; i++) {
    const q = pickQuestion(META_FULL_DUCKS, rngGate, false);
    if (metaSet.has(q)) {
      leakedBelowGate = true;
      console.error(`    meta when tabs locked: "${q}"`);
      break;
    }
  }
  assert(!leakedBelowGate, "tabs locked never draws META_QUESTIONS even at max ducks");
}

// ── (g) askDuck returns question + tiered answer ────────────────────────────
console.log("\n(g) askDuck exchange");
{
  resetQuackState();
  const rng = makeLcg(99);
  const { question, answer } = askDuck(10_000, 0, 0, rng, false);
  assert(typeof question === "string" && question.length > 0, "askDuck returns a question");
  assert(typeof answer === "string" && answer.length > 0, "askDuck returns an answer");
  assert(BASIC_QUESTIONS.includes(question), "Question comes from BASIC_QUESTIONS when meta locked");
  assert(!answer.includes("After careful consideration"), "askDuck answer never gets a prefix wrap");
  assert(!QUESTIONS.includes(answer), "answer is never a vanity question string");
}

// ── (j) Answers stay in the basic table (never question pools) ───────────────
console.log("\n(j) Answers never draw from question pools");
{
  resetQuackState();
  const questionSet = new Set(QUESTIONS);
  const answerSet = new Set(BASIC_ANSWERS.map(([t]) => t));

  const rngZero = () => 0;
  const lowCoherence = pickAnswer(0, 0, 0, rngZero);
  assert(answerSet.has(lowCoherence), "coherence 0 draws from BASIC_ANSWERS table");

  resetQuackState();
  const highCoherence = pickAnswer(0, 1, META_FULL_DUCKS, rngZero);
  assert(answerSet.has(highCoherence), "coherence 1 still draws from BASIC_ANSWERS table");
  assert(!questionSet.has(highCoherence), "coherence 1 never emits a vanity question as answer");

  resetQuackState();
  const rng = makeLcg(4242);
  let leaked = false;
  const N = 500;
  for (let i = 0; i < N; i++) {
    const a = pickAnswer(0, 0.8, META_FULL_DUCKS, rng);
    if (questionSet.has(a)) leaked = true;
  }
  assert(!leaked, `high coherence never leaks questions into answers (${N} draws)`);
}

// ── (k) Coherence does not change answer voice ───────────────────────────────
console.log("\n(k) Coherence does not change answer pool");
{
  resetQuackState();
  const rng = makeLcg(42);
  const low = pickAnswer(0, 0, 0, rng);
  resetQuackState();
  const rng2 = makeLcg(42);
  const high = pickAnswer(0, 1, 0, rng2);
  assert(low === high, "same rng seed → same basic answer regardless of coherence");
  assert(!high.includes("After careful consideration"), "coherence never adds a prefix wrap");
  assert(!high.includes("Comprehensive analysis"), "answers never emit the corporate line");
}

// ── (l) Ultimate Question easter egg ─────────────────────────────────────────
console.log("\n(l) Ultimate Question easter egg");
{
  assert(!QUESTIONS.includes(FINAL_QUESTION), "Ultimate Question is not in the random pool");
  assert(FINAL_ANSWER === "Additional ducks may improve confidence.", "easter egg answer unchanged");
}

// ── (m) Pondering thoughts ───────────────────────────────────────────────────
console.log("\n(m) Pondering thoughts");
{
  resetQuackState();
  const thoughtSet = new Set([...DUCK_THOUGHTS, ...DUCK_FACTS]);
  const genericSet = new Set(DUCK_THOUGHTS);
  const factSet = new Set(DUCK_FACTS);
  const rng = makeLcg(555);
  let prev = "";
  let consecutive = false;
  let badPool = false;
  let leakedFact = false;
  for (let i = 0; i < 100; i++) {
    const t = pickThought(0, rng);
    if (!thoughtSet.has(t)) badPool = true;
    if (!genericSet.has(t)) leakedFact = true;
    if (t === prev) consecutive = true;
    prev = t;
  }
  assert(!badPool, "pickThought draws from thought pools");
  assert(!leakedFact, "coherence 0 never draws duck facts");
  assert(!consecutive, "No consecutive thought repeat over 100 draws");

  resetQuackState();
  const factRng = () => 0;
  const fact = pickThought(1, factRng);
  assert(factSet.has(fact), "coherence 1 + low roll draws from DUCK_FACTS");
}

// ── (o) Thought fact chance scales with coherence ───────────────────────────
console.log("\n(o) Thought fact chance");
{
  assert(thoughtFactChance(0) === 0, "0% fact chance at coherence 0");
  assert(thoughtFactChance(1) === THOUGHT_FACT_CHANCE_MAX, "max fact chance at coherence 1");
  assert(thoughtFactChance(2) === THOUGHT_FACT_CHANCE_MAX, "fact chance capped at max");
  assert(thoughtFactChance(0.5) === THOUGHT_FACT_CHANCE_MAX / 2, "fact chance scales linearly");

  resetQuackState();
  const factSet = new Set(DUCK_FACTS);
  const rngLow = makeLcg(777);
  let factCountLow = 0;
  const N = 400;
  for (let i = 0; i < N; i++) {
    if (factSet.has(pickThought(0.2, rngLow))) factCountLow++;
  }

  resetQuackState();
  const rngHigh = makeLcg(777);
  let factCountHigh = 0;
  for (let i = 0; i < N; i++) {
    if (factSet.has(pickThought(0.9, rngHigh))) factCountHigh++;
  }
  assert(factCountHigh > factCountLow, `higher coherence → more facts (${factCountHigh} vs ${factCountLow})`);
  assert(factCountHigh > N * 0.3, `coherence 0.9 skews facts (~${factCountHigh}/${N})`);
}

// ── (n) Ponder depth and bonuses ─────────────────────────────────────────────
console.log("\n(n) Ponder depth and bonuses");
{
  assert(ponderDepth(0) === 0, "zero hold → depth 0");
  assert(ponderDepth(50) === 0, "sub-min hold → depth 0");
  assert(ponderDepth(10_000) === 1, "long hold caps at depth 1");
  const mid = ponderDepth(1800);
  assert(mid > 0.4 && mid < 0.6, `mid hold depth in range (got ${mid})`);
  assert(ponderEffectiveCoherence(0.5, 1) === 0.75, "depth 1 adds max coherence boost");
  assert(ponderEffectiveCoherence(0.9, 1) === 1, "coherence capped at 1");
  assert(ponderCoinBonus(0) > 0, "any ponder grants base coin bonus");
  assert(ponderCoinBonus(1) > ponderCoinBonus(0), "deeper ponder → more coin bonus");
}

// ── (p) Ponder answer output (onPonderEnd path) ─────────────────────────────
console.log("\n(p) Ponder answer output");
{
  resetQuackState();
  const rng = () => 0;
  const baseCoherence = 0.75;
  const depth = ponderDepth(PONDER_MAX_DEPTH_HOLD_MS);
  const effCoherence = ponderEffectiveCoherence(baseCoherence, depth);
  const ponderAnswer = pickAnswer(0, effCoherence, 0, rng);
  assert(depth === 1, "full hold reaches max ponder depth");
  assert(effCoherence === 1, "full ponder maxes coherence at base 0.75");
  assert(typeof ponderAnswer === "string" && ponderAnswer.length > 0, "ponder produces an answer");
  assert(!ponderAnswer.includes("After careful consideration"), "ponder answer never gets a prefix wrap");
  assert(!ponderAnswer.includes("Comprehensive analysis"), "ponder answer never emits the corporate line");
  assert(ponderAnswer !== FINAL_ANSWER, "ponder answer is never the reserved finale punchline");
}

// ── (q) Reserved lines never leak from pickAnswer ────────────────────────────
console.log("\n(q) Reserved lines never leak");
{
  resetQuackState();
  const rng = makeLcg(8675309);
  const scores = [0, 100, 10_000, 1_000_000, 1e9, 1e12];
  const coherences = [0, 0.25, 0.5, 0.75, 1];
  const duckCounts = [0, META_GATE_DUCKS, META_FULL_DUCKS, META_FULL_DUCKS * 10];
  let leak = null;
  outer:
  for (const s of scores) {
    for (const c of coherences) {
      for (const d of duckCounts) {
        for (let i = 0; i < 200; i++) {
          const a = pickAnswer(s, c, d, rng);
          if (
            a.includes("Comprehensive analysis")
            || a.includes(FINAL_ANSWER)
            || a.includes("After careful consideration")
          ) {
            leak = { s, c, d, a };
            break outer;
          }
        }
      }
    }
  }
  if (leak) console.error(`    leaked at score=${leak.s} coherence=${leak.c} ducks=${leak.d}: "${leak.a}"`);
  assert(!leak, "pickAnswer never emits prefix wraps, the corporate line, or finale punchline");

  // The TIERS table itself must not wrap with reserved or prefix voice.
  const tierProbe = TIERS.map((t) => t.wrap("X")).join(" | ");
  assert(!tierProbe.includes("After careful consideration"), "no TIER wraps with a prefix");
  assert(!tierProbe.includes("Comprehensive analysis"), "no TIER wraps with the corporate line");
  assert(!tierProbe.includes(FINAL_ANSWER), "no TIER wraps with the finale punchline");
}

// ── (r) Collectible answers only in Answerdex ────────────────────────────────
console.log("\n(r) Collectible answers");
{
  assert(!isCollectibleAnswer("quack"), "plain quack is not collectible");
  assert(!isCollectibleAnswer("Quack?"), "plain Quack? is not collectible");
  assert(!isCollectibleAnswer("🦆"), "solo duck emoji is not collectible");
  assert(isCollectibleAnswer("🦆👑"), "profession emoji is collectible");
  assert(isCollectibleAnswer("You're absolutely right!"), "easter egg is collectible");

  const meta = defaultMeta();
  assert(!recordAnswerdex(meta, "quack"), "common answer not recorded");
  assert(recordAnswerdex(meta, "🦆🔥"), "profession emoji recorded");
  assert(meta.answerdexSeen.length === 1, "only one collectible stored");
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
