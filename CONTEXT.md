# Domain glossary — More Ducks!

Quick reference for code and docs. Economy rules: [`docs/economy.md`](docs/economy.md).

| Term | Meaning |
|------|---------|
| **Act / era** | Narrative chapter 0–5; gates content reveal and sky palette. |
| **Answer** | One served Q&A pair (chat tap or market resolution). |
| **Answerdex** | Collection of unique quack strings seen in play. |
| **Auto** | Composer button; sends a random question immediately (does not fill-only). |
| **Buzz** | Organic demand from flock size (`BUZZ_PER_DUCK`, sublinear exponent). |
| **Capstone** | Final upgrade in vertical (`selfgoverning`) or horizontal (`oceanswarm`) line; triggers ending on purchase. |
| **Coherence** | 0–1 fluency score from lifetime answers; affects coins and quack blend. |
| **Coin mult** | Internal revenue multiplier from upgrades (formerly `crumbMult` in code). |
| **Demand** | Questions wanting answers per second. |
| **Duckdex** | Breed catalogue; each entry adds a market demand modifier. |
| **Feed gate** | Manual 🦆 feed required until Auto Feeder. |
| **Hype** | Spent buff currency; campaigns add demand, decays over time. |
| **QLM** | Quack Language Model — predecessor chat toy at [github.com/bearjcc/QLM](https://github.com/bearjcc/QLM). |
| **Served** | `min(supply, demand)` — monetizable answers per second. |
| **Supply** | Answers/sec the flock can deliver. |

## Ending ids

`bankrupt`, `singularity`, `swarm`, `space`, `competitor` — see `src/data/endings.js`.
