// @ts-check
// aislop-ignore-file ai-slop/console-leftover ai-slop/narrative-comment -- CLI report tool; console output is the product, header documents cited research.
//
// More Ducks! — deterministic curve shaper & auditor.  NOT shipped; NOT imported
// by the game.  Companion to scripts/sim.mjs: where sim.mjs answers "how long is
// the arc?", curve.mjs answers "is the *shape* of the price/output ladder healthy?"
// and "what numbers would make it healthy?".  Fully deterministic — no RNG, no
// wall-clock — so it doubles as a regression gate in CI.
//
//   node scripts/curve.mjs              # AUDIT the live producers.js (default)
//   node scripts/curve.mjs --shape      # SHAPE: print an ideal ladder + deltas
//   node scripts/curve.mjs --shape --json
//
//
// WHY THESE FORMULAS  (research distilled — see docs/curve.md)
//
// Every idle economy is a seesaw: cost grows EXPONENTIALLY in units owned,
// production grows only LINEARLY in units owned. Exponential always wins, so a
// single producer inevitably stalls — which is the *point*: it pushes you to the
// next tier (Kongregate / GameDeveloper "Math of Idle Games"). Cost multipliers
// across shipped games cluster in 1.07–1.15 (Cookie Clicker 1.15, Clicker Heroes
// 1.07, AdVenture Capitalist 1.07–1.15). More Ducks runs 1.15–1.19: a steeper,
// shorter arc, on purpose (target ~6–8 h, economy.md §1).
//
// The single lever that controls "feel" is PAYBACK TIME: cost ÷ marginal income.
// A purchase that pays for itself in a few seconds is a dopamine hit; one that
// takes hours is a grind wall — and grind walls are exactly the void predatory
// games sell you out of. We have no IAP and never will, so a wall here is pure
// player attrition with zero upside. The deterministic health rules below all
// reduce to: keep payback inside a humane band, and make sure every producer is
// somebody's best buy at some moment (no dead tiers, no false choices).
//

import { PRODUCERS } from "../src/data/producers.js";

const args = new Set(process.argv.slice(2));
const JSON_OUT = args.has("--json");

// Shared helpers

/** dps of ONE unit of a producer at its base output (no upgrades). */
function unitDps(p) {
  return p.productionAmount / (p.productionTime / 1000);
}

/** Marginal coin cost of the (k+1)-th unit — mirrors engine Producer.calculateCost. */
function marginalCost(p, owned) {
  return Math.round(p.baseCost * Math.pow(p.costCoefficient, owned));
}

/** Standalone payback (s) of buying the (owned+1)-th unit, paying it off from
 *  that unit's OWN output alone. The honest "is this worth it?" number. */
function standalonePayback(p, owned) {
  return marginalCost(p, owned) / unitDps(p);
}

function fmt(n) {
  if (!isFinite(n)) return "∞";
  if (n < 1000) return n.toFixed(n < 10 ? 2 : 0);
  const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx"];
  let u = 0;
  while (n >= 1000 && u < units.length - 1) { n /= 1000; u++; }
  return n.toFixed(2) + units[u];
}
function dur(sec) {
  if (!isFinite(sec)) return "∞";
  if (sec < 90) return sec.toFixed(1) + "s";
  if (sec < 5400) return (sec / 60).toFixed(1) + "m";
  return (sec / 3600).toFixed(1) + "h";
}

// PART A — SHAPE: derive an ideal ladder deterministically from design intent.
//
// Design principle: hold STANDALONE PAYBACK roughly constant per tier (it may
// drift gently upward so late game breathes slower). If payback is constant then
// dps_i scales exactly with base cost — so every tier is equally coin-efficient
// at unit #1, and it's purely the cost coefficient (growth WITHIN a tier) that
// retires the old tier and pulls you to the new one. That is the AdVenture
// Capitalist shape, and it provably can't produce a dead producer.
//
//   base_i  = BASE0 · R^i                       (clean geometric ladder)
//   payback_i = PB0 · DRIFT^i                    (snappy early → calmer late)
//   dps_i   = base_i / payback_i                 (⇒ output that hits that payback)
//   output_i = dps_i · (time_i / 1000)

const SHAPE = {
  tiers: PRODUCERS.length, // match the current roster so deltas line up
  base0: 12,               // coins for the first unit of tier 0
  ratio: 11,               // base-cost ×R per tier (research healthy band 6–15)
  payback0: 6,             // seconds: tier-0 unit #1 should pay back this fast
  paybackDrift: 1.18,      // payback ×this per tier (late game slows gently)
  timeMs: 1000,            // production interval (tier 0 keeps its own 1500)
  coeff0: 1.15,            // cost coefficient for tier 0
  coeffDrift: 0.006,       // +this per tier (1.15 → ~1.19 across 8 tiers)
};

function shapeLadder(cfg = SHAPE) {
  const rows = [];
  for (let i = 0; i < cfg.tiers; i++) {
    const baseCost = Math.round(cfg.base0 * Math.pow(cfg.ratio, i));
    const payback = cfg.payback0 * Math.pow(cfg.paybackDrift, i);
    const timeMs = i === 0 ? 1500 : cfg.timeMs;
    const dps = baseCost / payback;
    const productionAmount = Math.max(1, Math.round(dps * (timeMs / 1000)));
    const costCoefficient = +(cfg.coeff0 + cfg.coeffDrift * i).toFixed(3);
    rows.push({
      id: PRODUCERS[i]?.id ?? `tier${i}`,
      baseCost, costCoefficient, productionTime: timeMs, productionAmount,
      payback, dpsPerCoin: dps / baseCost,
    });
  }
  return rows;
}

function printShape() {
  const ideal = shapeLadder();
  if (JSON_OUT) { console.log(JSON.stringify(ideal, null, 2)); return; }

  console.log("=== SHAPE — ideal ladder (constant-ish payback) ===");
  console.log(`knobs: base0=${SHAPE.base0} ratio=${SHAPE.ratio}x payback0=${SHAPE.payback0}s drift=${SHAPE.paybackDrift}\n`);
  console.log("tier          baseCost   coeff  out/batch  payback   vs CURRENT base");
  for (let i = 0; i < ideal.length; i++) {
    const r = ideal[i];
    const cur = PRODUCERS[i];
    const delta = cur ? `${fmt(cur.baseCost)} → ${fmt(r.baseCost)}` : "(new)";
    console.log(
      `${r.id.padEnd(12)} ${fmt(r.baseCost).padStart(9)}  ${r.costCoefficient.toFixed(3)}  ${fmt(r.productionAmount).padStart(8)}  ${dur(r.payback).padStart(7)}   ${delta}`,
    );
  }
  console.log("\nThis is a starting skeleton, not gospel — feed it to sim.mjs to confirm arc length,");
  console.log("then hand-tune individual tiers for jokes/pacing. The audit below guards the result.");
}

// PART B — AUDIT: score the LIVE ladder against deterministic health rules.

// Humane bands. A failure (✗) is a real problem; a warning (⚠) is a smell.
const BANDS = {
  ratioMin: 4,        // consecutive base costs closer than this collapse choice
  ratioMax: 40,       // …farther than this is a cash cliff (a soft paywall shape)
  paybackFloorS: 1,   // sub-second payback = trivial, no decision
  paybackWallS: 7200, // 2 h to pay back one unit from its own output = grind wall
  efficiencyDropMax: 0.5, // a new tier's unit#1 efficiency shouldn't be <50% of prev
};

const findings = [];
function fail(msg) { findings.push({ level: "✗", msg }); }
function warn(msg) { findings.push({ level: "⚠", msg }); }

function auditLadder() {
  const rows = PRODUCERS.map((p) => ({
    id: p.id,
    base: p.baseCost,
    dps: unitDps(p),
    eff: unitDps(p) / p.baseCost, // dps per coin at unit #1 ("unlock efficiency")
    payback: standalonePayback(p, 0),
  }));

  // --- 1. base-cost ladder ratios -----------------------------------------
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i].base / rows[i - 1].base;
    if (r < BANDS.ratioMin)
      fail(`tier gap ${rows[i - 1].id}→${rows[i].id} is only ${r.toFixed(1)}x (< ${BANDS.ratioMin}x): the cheaper tier is pointless the moment the dearer one unlocks`);
    else if (r > BANDS.ratioMax)
      warn(`tier gap ${rows[i - 1].id}→${rows[i].id} is ${r.toFixed(1)}x (> ${BANDS.ratioMax}x): a long dead stretch where nothing new is affordable`);
  }

  // --- 2. strict dominance (a producer that is worse on BOTH axes) ---------
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < rows.length; j++) {
      if (i === j) continue;
      if (rows[j].base <= rows[i].base && rows[j].dps >= rows[i].dps &&
          (rows[j].base < rows[i].base || rows[j].dps > rows[i].dps)) {
        fail(`${rows[i].id} is strictly dominated by ${rows[j].id} (cheaper base AND ≥ output) — it has no reason to exist`);
        break;
      }
    }
  }

  // --- 3. unlock-efficiency continuity ------------------------------------
  // A new tier should be at least comparably efficient per coin at unit #1.
  for (let i = 1; i < rows.length; i++) {
    const drop = rows[i].eff / rows[i - 1].eff;
    if (drop < BANDS.efficiencyDropMax)
      warn(`${rows[i].id} unlocks at ${(drop * 100).toFixed(0)}% of ${rows[i - 1].id}'s coin-efficiency — feels like a downgrade at unlock`);
  }

  // --- 4. standalone payback band -----------------------------------------
  for (const r of rows) {
    if (r.payback > BANDS.paybackWallS)
      fail(`${r.id} unit #1 takes ${dur(r.payback)} to pay for itself (> ${dur(BANDS.paybackWallS)}): a wall, and we have no IAP to sell past it`);
    else if (r.payback < BANDS.paybackFloorS)
      warn(`${r.id} unit #1 pays back in ${dur(r.payback)} (< ${dur(BANDS.paybackFloorS)}): too trivial to be a decision`);
  }

  // --- 5. dead-producer walk (deterministic greedy buyer) -----------------
  // No RNG: we own a growing flock and at each step buy whichever REVEALED
  // producer offers the lowest standalone payback (best marginal value). Any
  // producer never chosen across the whole walk is dead weight on the screen.
  const dead = deadProducerWalk();
  for (const id of dead)
    fail(`${id} is never the best marginal buy at any point — a dead producer (greedy buyer skips it forever)`);

  return rows;
}

/** Returns ids of producers that a greedy "lowest-payback" buyer never picks. */
function deadProducerWalk() {
  const owned = Object.fromEntries(PRODUCERS.map((p) => [p.id, 0]));
  const everBought = new Set();
  const STEPS = 4000; // plenty to cover the full roster many times over
  // Reveal everything (we're testing the ladder shape, not era gating here).
  for (let s = 0; s < STEPS; s++) {
    let best = null, bestPB = Infinity;
    for (const p of PRODUCERS) {
      const pb = standalonePayback(p, owned[p.id]);
      if (pb < bestPB) { bestPB = pb; best = p; }
    }
    if (!best) break;
    owned[best.id]++;
    everBought.add(best.id);
  }
  return PRODUCERS.filter((p) => !everBought.has(p.id)).map((p) => p.id);
}

function printAudit() {
  const rows = auditLadder();
  if (JSON_OUT) {
    console.log(JSON.stringify({ rows, findings }, null, 2));
    return;
  }

  console.log("=== AUDIT — live producer ladder (src/data/producers.js) ===\n");
  console.log("tier          baseCost   coeff   unitDPS   dps/coin   payback   ratioΔ");
  for (let i = 0; i < PRODUCERS.length; i++) {
    const p = PRODUCERS[i];
    const r = rows[i];
    const ratio = i === 0 ? "—" : (p.baseCost / PRODUCERS[i - 1].baseCost).toFixed(1) + "x";
    console.log(
      `${p.id.padEnd(12)} ${fmt(p.baseCost).padStart(9)}  ${p.costCoefficient.toFixed(2)}  ${fmt(r.dps).padStart(8)}  ${r.eff.toExponential(1).padStart(9)}  ${dur(r.payback).padStart(7)}  ${ratio.padStart(6)}`,
    );
  }

  console.log("\n--- findings ---");
  if (findings.length === 0) {
    console.log("✓ ladder is healthy: clean ratios, no dead/dominated tiers, payback in band.");
  } else {
    for (const f of findings) console.log(`${f.level} ${f.msg}`);
  }

  const hard = findings.filter((f) => f.level === "✗").length;
  const soft = findings.filter((f) => f.level === "⚠").length;
  console.log(`\n${hard} failure(s), ${soft} warning(s).`);
  if (hard > 0) process.exitCode = 1;
}

if (args.has("--shape")) printShape();
else printAudit();
