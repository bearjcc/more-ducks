# More Ducks — agent handoff

Read this first. Then [`../docs/economy.md`](../docs/economy.md) (economy), [`../docs/concept.md`](../docs/concept.md) (satire/tone), [`DESIGN.md`](DESIGN.md) (UI target), [`../CONTEXT.md`](../CONTEXT.md) (glossary).

**Repo:** `Idle/more-ducks` (game) · **Lineage:** [`../QLM`](../QLM) (Quack Language Model — chat UI + weighted quack table)

---

## What this is

Incremental sequel to QLM: starts as a believable mobile LLM chat app, becomes a satirical idle game about scaling a duck Q&A empire. Same joke as QLM (confident nonsense), stretched into Cookie Clicker / Egg Inc / Universal Paperclips territory.

**Art project, not F2P.** No monetization. Has real endings.

**Target player arc:**

> Ha! Duck Intelligence, that's silly… Hey, this is cute… Huh, it's pretty fun… Yes, of course I want to flood Australia — **more ducks**… Wait, am I the villain? …Oh.

Satire is **mechanical**, never preachy. Never name real AI products. Ducks are earnest.

---

## Authoritative doc hierarchy

| Topic | Document |
|-------|----------|
| Economy, feed opex, market loop, acts | [`../docs/economy.md`](../docs/economy.md) |
| Satire spine, tone, collection design | [`../docs/concept.md`](../docs/concept.md) |
| Pillars, phases, humor style | [`../docs/gdd.md`](../docs/gdd.md) |
| UI/UX target (Tap Titans 2 + chat apps) | [`DESIGN.md`](DESIGN.md) |
| Product voice, anti-slop | [`PRODUCT.md`](PRODUCT.md) |
| Implementation backlog | [`TODO.md`](TODO.md) |
| Domain terms | [`../CONTEXT.md`](../CONTEXT.md) |

When docs disagree on **economy**, `economy.md` wins. When they disagree on **tone/satire**, `concept.md` wins.

---

## Shipped architecture (do not rebuild)

- Static ES modules, no bundler. `npm test` + `npm run typecheck`.
- Vendored [`continuum-engine`](VENDOR.md) — do not edit `src/engine/`.
- **Hero metric:** Answers/sec (dashboard tab, not HUD headline).
- **Currencies:** coins, research, hype. **Resource:** ducks (supply capacity).
- **Market loop:** `served = min(supply, demand)` in `src/main.js` / `src/game/market.js`.
- **Chat UI:** `src/ui/chat.js` — thread, Send, Auto (Auto **sends immediately**, does not fill the input).
- **Collections:** Answerdex (unique quack strings), Duckdex (breeds + mechanical demands).
- **Feed:** manual tap after ~10 answers; Auto Feeder → coins/sec ∝ answers/sec (`src/game/feed.js`).
- **Regions:** home (owned), abroad (rent + bankruptcy), Australia (flood capex), ocean (saltwater), space (orbital ending).
- **Endings:** bankrupt, singularity (vertical capstone), swarm (horizontal capstone), space (orbital), competitor (~80h clock).

---

## Intended early-game loop (QLM → incremental)

Order matters for feel. Current code is **close but not strict enough**:

1. **Chat only** — type or tap **Auto** (sends a random question + answer). Small coin per answer. Track unique answers in Answerdex.
2. **Feed gate** — after a burst, tap 🦆 to feed (free). Teaches energy cost allegory.
3. **First panel** — after a few manual Q&A + at least one feed (`flockTabUnlocked`: 3 answers + 1 feed).
4. **First purchases** — Steady Beak (hold Auto), Quick Quack (faster hold), Auto Feeder (removes feed gate, adds opex). Items reveal at ~10% of cost.
5. **More ducks** — producers in Flock tab; second duck effectively doubles throughput.
6. **Ads tab** — hype campaigns manufacture demand so player is not hand-sending every question.
7. **Breeding pair** — passive duck growth (producer `breeder`, era 1) after manual loop is established.
8. **Pond capacity** — buy ponds when density caps; then regions / research / capstones.

Reference: AdVenture Capitalist lemonade-stand tapping, QLM chat UX, Tap Titans 2 panel unlock rhythm.

---

## UI model (Tap Titans 2 + mobile chat)

**Panels closed:** full-screen chat app (HUD overlays thread like ChatGPT/Gemini — same background, no harsh divider).

**Panels open:** bottom sheet slides up; composer lifts with it (keyboard behavior). Implemented via `data-panel-open` in `styles/main.css`.

**Six dock tabs** (each hidden until unlocked):

| Tab | Panel | Unlock gist |
|-----|-------|-------------|
| Stats | Dashboard: answers/sec, demand vs supply, hype, ducks, ducks/sec, feed opex | Early market activity |
| Flock | Producers, pond buy | 3 answers + 1 manual feed |
| Ads | Hype campaigns | Era 1 or cost threshold |
| Upgrades | Steady Beak, Auto Feeder, etc. | Flock + producer or Steady Beak cost threshold |
| Research | Efficiency / coherence | Research currency visible |
| More | Answerdex, Duckdex, regions, vanity, settings | Answerdex depth or era 2 |

**Auto button:** right of Send (correct in `index.html`). **Auto sends**, never prefills-only.

**Primary layout target:** phone landscape slightly favoured over laptop; portrait still supported.

---

## Quack voice rules (QLM fidelity — critical)

Reference implementation: [`../QLM/api/main.py`](../QLM/api/main.py) weighted `DUCK_SOUNDS` + [`../QLM/frontend/index.html`](../QLM/frontend/index.html).

### Duck answers during normal play

- Draw from `QUACKS` table: quack variants, emoji ducks, rare cosmic entries.
- Coherence may blend in **fluent non-sequitur** lines from `BASIC_QUESTIONS` / `META_QUESTIONS` pools — duck trivia delivered with authority, **never correct**, never corporate.
- Verbosity tiers may repeat or prefix the base quack (`Quack quack`, `After careful consideration: …`).

### Never emit during normal play

- **`Comprehensive analysis suggests additional ducks may improve confidence.`** (and variants) — reserved for **finale / credits only**.
- **Meta questions** like **`Can bread solve this?`** — late-game Auto pool only (high era / high `totalDucksEver`, not era 4 threshold as today).
- SaaS / benchmark voice in the chat thread (`Research indicates…` as an *answer*) — belongs in upgrade blurbs and Quackmark UI, not duck replies.

### Finale punchline

**`Additional ducks may improve confidence.`** — appears as the soft line on the **singularity** ending game-over screen (it already does in `data/endings.js`). There is **no** separate Hitchhiker Ultimate-Question beat: the endings below are the finale (Milestone 2 resolved to Option B). Never a random tier wrap at score 1M.

**Fixed (Milestone 1.1):** the `TIERS` min 1_000_000 corporate tier is gone — `After careful consideration:` is the verbosity ceiling. `scripts/quack.test.mjs` block (q) now guards that neither the comprehensive-analysis line nor `FINAL_ANSWER` ever leaks from `pickQuack()`.

---

## Endings (hidden until triggered)

Capstones are the **last upgrade in their list** — they look normal until purchased.
Orbital ducks are a region action after saltwater. The player learns which path
they took only when the game-over screen appears.

| ID | Trigger | Allegory |
|----|---------|----------|
| `bankrupt` | coins < 0 while renting foreign ponds | Over-expanded leased capacity |
| `singularity` | buy `selfgoverning` (vertical capstone) | AGI / ducks self-organize |
| `swarm` | buy `oceanswarm` (horizontal capstone) | Planetary scale / ecosystem collapse |
| `space` | deploy orbital ducks (after saltwater) | Hitchhiker / Muppets / Howard — "win" until Vogons |
| `competitor` | ~80 real-hours without capstone | Another bird LLM wins (owl, sparrow, …) |

---

## Known inconsistencies (fix these)

Priority-ordered for next agent:

1. ~~**Quack tiers + tests** — remove comprehensive-analysis tier; gate meta questions late; align tests with QLM.~~ **Done (Milestone 1):** corporate tier removed, meta questions gated to era 4+, tests realigned in `scripts/quack.test.mjs`.
2. ~~**Finale** — endings are capstone purchases + orbital deploy; remove leftover hitchhiker dead code.~~ **Done (Milestone 2, Option B):** dropped `ENDINGS.hitchhiker` and its UI branch; the 5 hidden endings (bankrupt / singularity / swarm / space / competitor) are the finale. The `FINAL_ANSWER` punchline lives on the singularity ending.
3. **HUD / header** — reduce contrast seam between `.hud` and `.stage`; match DESIGN.md (gradient overlay, shared `--surface`).
4. **Progression pacing** — delay producers / Ads until upgrades land; verify unlock order matches § early-game loop above.
5. **Naming cleanup** — `crumbMult` → `coinMult` or `revenueMult` in code (player-facing is already coins).
6. **Overlap audit** — one coherent path for: feed gate vs auto feeder vs passive answers vs manual send; document in code comments where needed.
7. **Regional duck species** — regions exist; Duckdex breeds are not yet tied to region unlocks per vision.
8. **Landscape polish** — verify chat + dock on phone landscape (design center per Bear).
9. **Remove stale UI spec** — DESIGN.md previously described stage quack FAB and hero-in-stage; stage is chat-only now.

---

## Dev commands

```sh
cd more-ducks
npm install
npm run serve          # static server :8000
npm test               # node:test suite
npm run typecheck
npm run sim            # balance sim
```

Debug handle: `window.MoreDucks` in browser console.

---

## Inspiration (mechanics, not UI copy)

Oiligarchy, McDonald's Video Game, Universal Paperclips, Cookie Clicker, Egg Inc, AdVenture Capitalist, Make More!, Tap Titans 2, Cell to Singularity. Chat apps: ChatGPT, Gemini (chrome layering). **Anti-reference:** generic AI-slop dashboards.
