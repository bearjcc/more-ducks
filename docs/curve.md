# Curve — pricing & scaling for More Ducks!

How we decide what a producer costs, what it outputs, and why the ladder feels
good instead of grindy. The math here is enforced by
[`scripts/curve.mjs`](../scripts/curve.mjs); the *pacing* (how many hours the arc
takes) is checked separately by [`scripts/sim.mjs`](../scripts/sim.mjs).

> North star: **fun, silly, poignant — not digital heroin.** No IAP, no premium
> currency, no FOMO timers, no engineered walls. Every number below exists to keep
> a thumb-tapper on a park bench smiling, then put the phone down happy.

## 1. The seesaw (why idle games work at all)

Every incremental economy balances two curves:

| Quantity   | Grows…        | Formula                                  |
| ---------- | ------------- | ---------------------------------------- |
| **Cost**   | exponentially | `cost(n) = base · coeff^n`               |
| **Output** | linearly      | `output(n) = unitOutput · n · multipliers` |

Exponential beats linear *eventually, always*. So any single producer stalls —
and that stall is the feature: it nudges you to the next tier, an upgrade, an era,
or a prestige. The designer's job is to make that nudge feel like an invitation,
not a toll booth.

Shipped multipliers cluster tight:

| Game                | `coeff`     |
| ------------------- | ----------- |
| Clicker Heroes      | 1.07        |
| AdVenture Capitalist| 1.07–1.15   |
| Cookie Clicker      | 1.15        |
| **More Ducks!**     | **1.15–1.19** |

We run hot because we want a **~6–8 h arc**, not a 6-month one. A higher `coeff`
makes each tier retire faster.

## 2. The one number that controls "feel": payback time

```
payback = cost ÷ income-it-buys-you
```

- **Seconds** → a dopamine hit. "Number went up, buy again."
- **Minutes** → a satisfying goal. "Almost… there."
- **Hours** → a grind wall.

Predatory games manufacture hour-long walls and then sell you the ladder over
them. We have nothing to sell, so a wall is **pure attrition with zero upside** —
it is the single worst thing our curve can do. The auditor's hardest failure is a
payback over ~2 h.

## 3. How we *shape* a ladder (`--shape`)

Principle: **hold standalone payback roughly constant per tier** (drifting gently
upward so the late game breathes slower). If payback is constant, output scales
exactly with cost, so *every tier is equally coin-efficient at its first unit* —
and it's purely the cost coefficient (growth **within** a tier) that retires the
old tier and pulls you forward. This is the AdVenture Capitalist shape, and it
provably cannot produce a dead producer.

```
base_i    = base0 · ratio^i          # clean geometric ladder
payback_i = payback0 · drift^i       # snappy early → calmer late
output_i  = (base_i / payback_i) · (batchSeconds)
coeff_i   = coeff0 + coeffDrift · i
```

Knobs live at the top of `curve.mjs` (`SHAPE`). `--shape` prints the ideal ladder
and the delta from today's numbers. It's a **skeleton, not gospel**: take the
shape, run it through `sim.mjs` for arc length, then hand-tune individual tiers
for jokes and pacing. The audit guards whatever you land on.

## 4. How we *test* a ladder (default / audit)

Deterministic — no RNG, no clock — so it's a clean CI gate. Rules and bands live
in `BANDS` at the top of the file.

| Check | Hard fail (✗) when… | Why it matters |
| --- | --- | --- |
| **Tier ratio** | consecutive base costs < 4× apart | the cheaper tier dies the instant the dearer one unlocks → false choice |
| **Strict dominance** | a producer is both cheaper *and* ≥ output vs another | it has literally no reason to exist |
| **Payback wall** | unit #1 takes > 2 h to pay for itself | grind wall; the thing we sell nothing to skip |
| **Dead producer** | a greedy "lowest-payback" buyer never picks it across 4000 buys | it's screen clutter that's never the right call |

Warnings (⚠) flag smells, not bugs: tier gaps over 40× (a cash-cliff shape),
sub-second paybacks (too trivial to be a decision), and unlock-efficiency that
drops more than 50% tier-to-tier (each new unlock feels like a downgrade per coin).

## 5. What it found on the current roster — and the fix (2026-06-20)

The first audit caught two **hard failures**: `datapond (2.8M) → recursive (5M)
→ singularity (6M)` were only 1.8× and 1.2× apart while output jumped 5×/30×. The
moment Act 3 opened, `recursive`/`singularity` were so much more efficient that
`datapond` and `recursive` were dead on arrival. **Fixed** by restoring the
geometric ladder: `recursive 36M / 8K out`, `singularity 450M / 95K out` — clean
12–13× ratios and flat unlock-efficiency at the top. Audit now passes (0 failures;
the remaining ⚠ are the gentle per-tier efficiency decline, which is normal idle
behaviour). The audit is wired into `npm test` so the shape can't regress.

## 6. Running it

```
node scripts/curve.mjs            # audit live producers.js (exit 1 on hard fail)
node scripts/curve.mjs --shape    # print the ideal ladder + deltas
node scripts/curve.mjs --json     # machine-readable (works with either mode)
node scripts/sim.mjs              # full-arc pacing (act timings + capstone)
TRACE=300 node scripts/sim.mjs    # hourly→5-min trajectory on stderr (set seconds)
```

`curve.mjs` is wired into `npm test` so the producer shape can never silently
regress.

## 7. The supply model — the flock drives it (and the sim now knows that)

Auditing the *arc* (not just the ladder) surfaced two compounding problems the old
`sim.mjs` had been hiding because **it ignored the pond/capacity system entirely**:

1. **Harness bug.** `main.js` clamps live ducks to `pondCapacity` before computing
   supply, but the sim accumulated ducks unbounded. So its arc numbers were
   fiction. The sim now models the capacity clamp + pond purchases.
2. **Unwinnable economy.** As originally coded, supply was capped by ponds whose
   cost grew `5000·2.2^n` — supply asymptoted at a few hundred ducks and the
   8–12 B capstone was never reachable.

**Decision (you):** the flock should drive supply. `pondCapacity` now auto-expands
to `FLOCK_HEADROOM×` the flock you've raised, so producers — not pond purchases —
set your live duck count and therefore your supply. Ponds/the capacity upgrade are
a light early-game headroom booster on top. *(Open follow-up: with capacity
auto-tracking, the manual "buy pond" button is now near-vestigial — consider
repurposing it as a small supply/coin multiplier or retiring it.)*

## 8. The demand model — buzz with diminishing returns

With the flock driving supply, demand became the coin bottleneck (coins come from
`min(supply, demand)`). The fix (`market.js`):

```
demand = BASE_DEMAND + BUZZ_PER_DUCK·flock^BUZZ_EXPONENT + dexIntake + HYPE_FACTOR·hype
```

- **The flock makes its own buzz** (`BUZZ_PER_DUCK·flock^0.6`) so the coin economy
  never freezes on a coin→hype→demand bootstrap (it used to sit at demand≈1 for
  ~5 h).
- **Diminishing returns** (`^0.6`): the market saturates, so an ever-larger slice
  of the flock is *idle supply* you monetize by manufacturing extra demand (hype,
  Duckdex intake) — the satirical "overbuilt, over-hyped" loop. The sub-linear
  exponent also tames the flock→demand→coins→flock feedback so the arc doesn't
  explode.

## 9. Pacing knobs (current: ~2.5 h, even acts)

The arc and act cadence are tuned against `sim.mjs`. The live levers:

| Lever | File | Effect |
| --- | --- | --- |
| `BUZZ_PER_DUCK`, `BUZZ_EXPONENT` | `market.js` | demand magnitude + feedback damping |
| `COIN_PER_ANSWER` | `market.js` | coin clock → capstone timing (≈ 1/arc) |
| `duckThreshold` / `answersThreshold` | `eras.js` | when each act fires (also gates content) |
| producer `productionAmount` | `producers.js` | flock growth rate (audited by `curve.mjs`) |
| `FLOCK_HEADROOM` | `capacity.js` | how far the cap leads the flock |

Current result: Act 1 @2m, 2 @20m, 3 @46m, 4 @1h14m, 5 @1h37m, capstone @2h27m —
**2.46 h, evenly spread.** Act thresholds also gate content unlocks, so raising
them slows progression; re-tune `COIN_PER_ANSWER` after any threshold change and
re-run `sim.mjs`.
