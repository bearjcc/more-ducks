#!/usr/bin/env node
// Framework-free self-check for the quack engine.
// Run: node scripts/quack.test.mjs

import { QUACKS, TIERS } from "../src/data/quacks.js";
import { pickQuack, resetQuackState } from "../src/game/quack.js";

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
    const result = pickQuack(0, rng);
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
  const scores = [0, 100, 10_000, 1_000_000];
  let prevLen = -1;
  let monotone = true;
  for (const score of scores) {
    // Use a fresh rng position for each draw so we get the same base quack.
    const rng2 = makeLcg(99);
    const text = pickQuack(score, rng2);
    if (text.length < prevLen) { monotone = false; }
    prevLen = text.length;
  }
  assert(monotone, "Answer length is non-decreasing across tier thresholds");

  // Spot-check: score 0 has no prefix; score ≥ 10_000 does.
  const rng3 = makeLcg(99);
  const lowText = pickQuack(0, rng3);
  const rng4 = makeLcg(99);
  const highText = pickQuack(10_000, rng4);
  assert(highText.startsWith("After careful consideration:"), "Score ≥ 10,000 uses tier-2 prefix");
  assert(!lowText.includes("After"), "Score 0 has no prefix");
}

// ── (c) Every QUACKS entry is reachable ────────────────────────────────────
console.log("\n(c) Every QUACKS entry is reachable");
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
    const text = pickQuack(0, rng);
    reached.add(text);
  }

  const highWeight = QUACKS.filter(([, w]) => w >= 1);
  let allReached = true;
  for (const [text] of highWeight) {
    if (!reached.has(text)) {
      allReached = false;
      console.error(`    not reached: "${text}"`);
    }
  }
  assert(allReached, `All ${highWeight.length} entries with weight ≥ 1 were drawn in ${DRAWS} tries`);

  // Easter egg has weight 0.1 — just verify it is in the table.
  const hasEgg = QUACKS.some(([t]) => t === "You're absolutely right!");
  assert(hasEgg, "Easter egg entry exists in QUACKS table");
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

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
