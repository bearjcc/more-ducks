# More Ducks — implementation TODO

**Read first:** [`HANDOFF.md`](HANDOFF.md) · [`docs/economy.md`](docs/economy.md)

Economy refactor (Milestones A–H) is **complete**. This list is **vision alignment** — fixing drift from multiple agents, QLM voice, and UI cohesion.

## How to use

- One agent, one session per `[ ]` task unless marked parallel-safe.
- Top to bottom = dependency order.
- Mark `[x]` only when `npm test` passes and the game loads without console errors.
- Keep playable after every task.

---

## Milestone 1 — Quack voice (QLM fidelity)

- [x] **1.1 Remove corporate answer tiers.** Deleted the `TIERS` entry at min 1_000_000 in `src/data/quacks.js`; top tier is now the short `After careful consideration:` prefix. `scripts/quack.test.mjs` block (q) asserts neither the corporate line nor `FINAL_ANSWER` ever leaks from `pickQuack()` across a grid of scores/coherences/duck counts (and that no `TIER` wraps with either). Files: `quacks.js`, `quack.js`, `quack.test.mjs`.
- [x] **1.2 Gate meta questions late.** `metaQuestionChance` is now 0 below the era-4 (Hall of Mirrors) gate, then ramps to 50% by the final era — no early linear leak. Exported `META_GATE_DUCKS` / `META_FULL_DUCKS`. Tests (h)/(i) assert 0% below the gate and the late ramp. Files: `quack.js`, `quack.test.mjs`.
- [x] **1.3 Reserve finale punchline.** `FINAL_ANSWER` documented as finale-only in `quack.js`; with the corporate tier gone no normal-play path emits it (asserted in test (q)). Wiring the explicit finale path is Milestone 2.

## Milestone 2 — Finale

- [x] **2.1 Hitchhiker beat OR capstone-only → chose B.** Removed `ENDINGS.hitchhiker` from `data/endings.js`, deleted the hitchhiker render branch + unused `getTotalDucks` plumbing in `ui/ending.js` (and the matching handler in `main.js`). The 5 hidden endings (bankrupt / singularity / swarm / space / competitor) are the narrative finale; the `space` ending carries the Hitchhiker reference and `FINAL_ANSWER` is the singularity ending's soft line. Updated `economy.md` §4/§7, `CONTEXT.md`, and `HANDOFF.md` to match. No separate Ultimate-Question deliberation UI.

## Milestone 3 — UI cohesion

- [x] **3.1 HUD blends into chat.** Base `.hud` uses gradient fade into `--surface` (no hard border); `.stage` shares the same tinted surface. Portrait overlay HUD unchanged. Files: `styles/main.css`.
- [x] **3.2 Feed hint visible on portrait.** Removed `display: none !important` on `.feed-hint`; hungry state shows pulsing hint above composer (`duck-hungry` + `[hidden]` toggle). Files: `main.css`, `chat.js`.
- [x] **3.3 Landscape pass.** Extended chat-first breakpoint to `(orientation: landscape) and (max-height: 520px)` so phone landscape (~844×390) gets sheet layout; nested landscape tweaks: 40dvh sheet, dock tab labels, safe-area insets. Files: `main.css`.

## Milestone 4 — Progression pacing

- [x] **4.1 Early shop order.** Producers hidden until Auto Feeder (`flockProducersUnlocked` in `unlocks.js` + `shop.js`).
- [x] **4.2 Ads after manual loop.** Hype tab requires flock unlock + at least one upgrade purchase (`hypeTabUnlocked`).
- [x] **4.3 Breeding pair timing.** `breeder` producer minimum era raised to 2.

## Milestone 5 — Cleanup

- [x] **5.1 Rename `crumbMult` → `coinMult`.** Effect kind `coinMult` in data; `crumbMult` alias kept in upgrade applier for old mod tools.
- [x] **5.2 Dead pond UI CSS.** (prior)
- [x] **5.3 Regional breeds.** Five regional Duckdex entries unlock on region access (`region` unlock type in `dex.js`).

## Milestone 6 — Balance

- [x] **6.1 Sim + arc.** `COIN_PER_ANSWER` 0.058, capstone costs trimmed; sim target band 6–8 h (re-run after merge).

---

### Completed (archive)

<details>
<summary>Economy refactor A–H (2025)</summary>

Renamed breadcrumbs→coins; two-sided market; dashboard tab; coherence; hype; prestige/pondering; endings scaffold; save v2. See git history / prior TODO revision.
</details>
