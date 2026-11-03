# Economy — More Ducks!

Authoritative rules for currencies, the market loop, feed, regions, acts, and endings. When this doc disagrees with informal notes, **this doc wins** on economy; see [`concept.md`](concept.md) for tone.

## 1. Design targets

- **Arc:** roughly **6–8 hours** of medium engagement to the first capstone ending branch (singularity or swarm). Orbital (`space`) and bankruptcy (`bankrupt`) branch earlier or later by player choice. Competitor (`competitor`) is a **real-time** fail-forward at ~80 h without a capstone.
- **No monetization.** Coins are the only spend currency in normal play; hype and research (if surfaced) are earned/spent in-game only.
- **Hero metric:** answers per second (Stats tab), not raw duck count.

## 2. Currencies and resources

| Id | Role |
|----|------|
| **coins** | Revenue from served answers; pays producers, upgrades, hype campaigns, regions, feed opex. |
| **hype** | Manufactured demand buffer; decays over time (`HYPE_DECAY_PER_SEC`). |
| **research** | Meta/progression currency where wired (prestige-adjacent). |
| **ducks** | Supply capacity — how many answers/sec the flock can serve after efficiency multipliers. |

Player-facing copy says **coins** (legacy code/comments may still say crumbs/breadcrumbs).

## 3. Market loop (two-sided)

Each tick:

1. **Supply** = live ducks × `ANSWERS_PER_DUCK_PER_SEC` × efficiency mult, clamped by pond capacity (`capacity.js`: flock headroom auto-expands with lifetime ducks).
2. **Demand** = `BASE_DEMAND` + buzz(`flock^BUZZ_EXPONENT`) + Duckdex question intake + `HYPE_FACTOR × hype`.
3. **Served** = `min(supply, demand)`.
4. **Coins** += served × `COIN_PER_ANSWER` × coherence value mult × **coinMult** ÷ Duckdex coin upkeep.

Manual chat taps credit answers **outside** the demand gate (teaching the QLM loop first). Constants live in `src/game/market.js`.

## 4. Coherence

`meta.coherence` rises with lifetime answers (`COHERENCE_ANSWERS_THRESHOLD`). Higher coherence increases coin mult and blends more fluent non-sequitur lines into duck replies (never corporate benchmark voice in chat — see [`HANDOFF.md`](../HANDOFF.md)).

## 5. Feed gate and opex

Until **Auto Feeder** is owned, the player must manually tap 🦆 after a burst of answers (`feed.js`). Auto Feeder converts feed into coin opex scaling with answers/sec — allegory for inference cost.

**Progression intent:** chat → manual feed → Upgrades tab (Steady Beak, Quick Quack, Auto Feeder) → Flock producers → Ads (hype) → breeding pair (era 2+).

## 6. Acts (six)

Defined in `src/data/eras.js`. Enter an act when **either** lifetime ducks **or** lifetime answers crosses the act threshold (whichever comes first). Acts gate UI era styling, producer/upgrade reveal eras, and narrative modals.

## 7. Endings (five)

Hidden until triggered; capstone upgrades look like normal shop rows until bought.

| Id | Trigger |
|----|---------|
| `bankrupt` | coins < 0 while renting a foreign pond |
| `singularity` | buy vertical capstone `selfgoverning` |
| `swarm` | buy horizontal capstone `oceanswarm` |
| `space` | deploy orbital ducks after saltwater |
| `competitor` | ~80 real hours without any capstone |

Finale soft line on singularity: *"Additional ducks may improve confidence."* — not emitted during normal quacks.

## 8. Duckdex demands

Each catalogued breed applies a **demand** modifier (coin upkeep, hype decay, coherence lift, question intake, produce mult, score inflate). See `src/data/ducks.js`. Full dex is required for sim "100% completion" but not for a single ending path.

## 9. Regions

Home (owned), abroad (unlock + rent → bankruptcy risk), Australia (flood capex), ocean (saltwater), space (orbital ending). Rent accrues per in-game day (`GAME_DAY_SEC` real seconds). See `src/data/regions.js`.

## 10. Balance tooling

- `npm run curve` — producer ladder audit (payback, dead tiers).
- `npm run sim` — full-arc timing with greedy buyer policy.
- Pacing knobs: `COIN_PER_ANSWER`, buzz constants, act thresholds, producer outputs — see [`curve.md`](curve.md).

## Open questions

- Pond **buy** button is nearly vestigial now that capacity tracks flock headroom — repurpose as minor mult or remove?
- Research tab in UI vs upgrades-only research currency — confirm before expanding.
