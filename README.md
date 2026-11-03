# More Ducks! 🦆

Incremental sequel to [QLM](https://github.com/bearjcc/QLM) (Quack Language Model): a small, silly, earnestly satirical browser game about scaling a duck Q&A service until the world is mostly pond.

It runs entirely in your browser — no backend, no accounts, no monetization.
Progress is kept in `localStorage`. **Phone portrait first** (QLM-style chat); laptop landscape supported.

## Docs (read before hacking)

| File | Purpose |
|------|---------|
| [**HANDOFF.md**](HANDOFF.md) | Agent entry point: vision, shipped state, known gaps |
| [**TODO.md**](TODO.md) | Current implementation backlog |
| [**DESIGN.md**](DESIGN.md) | UI/UX target (Tap Titans 2 + mobile chat) |
| [**PRODUCT.md**](PRODUCT.md) | Product voice and anti-slop rules |
| [docs/economy.md](docs/economy.md) | Authoritative economy spec |
| [docs/concept.md](docs/concept.md) | Satire spine and tone |
| [CONTEXT.md](CONTEXT.md) | Domain glossary |

> Ha, *Duck Intelligence*, that's silly… hey, this is cute… huh, it's pretty
> fun… yes, of course I want to flood Australia, that means **more ducks**…
> wait, am I the villain? …oh.

## Play

The game is build-free static files. Because it uses native ES modules, it must
be served over HTTP (not opened as a `file://` URL):

```sh
# from the repo root, pick one:
npx serve .
python -m http.server 8000
```

Then open the printed URL.

## Project layout

```
index.html              entry point (loads src/main.js as a module)
manifest.webmanifest    PWA manifest (any orientation, standalone)
styles/main.css         responsive; portrait stack + laptop two-column
scripts/sim.mjs         balance simulator (dev only; npm run sim)
src/
  main.js               boot + game loop + autosave
  data/                 producers, upgrades, ducks, eras (balance + copy)
  engine/               vendored continuum-engine (see VENDOR.md)
  game/                 economy, save/load, meta state, formatting
  ui/                   DOM rendering (chat, shop, dashboard, dex, modal, ending)
sw.js                   service worker (offline precache)
```

## Development

The game needs **no build** — editing a file and refreshing the browser is the
whole loop. Tooling is optional:

```sh
npm install        # only to run the type-checker
npm run typecheck  # tsc over the JSDoc (// @ts-check); the vendored engine is skipped
npm run serve      # python static server on :8000
```

Game data lives in `src/data/` (producers, upgrades, ducks, eras) so balance and
copy can be tuned without touching logic. A `window.MoreDucks` console handle is
exposed for debugging and modding.

## Deploying

Pushing to `main` on GitHub publishes via `.github/workflows/pages.yml` (free for
public repos). **One-time repo setup:** Settings → Pages → Build and deployment →
**Source: GitHub Actions** (not “Deploy from a branch”). If the site 404s, check
that the latest “Deploy to GitHub Pages” workflow run succeeded under Actions.

## Contributing

This is free and open source under the MIT license. It's a personal project
shared in the open — issues and pull requests that keep it small, kind, and fun
are welcome.

## Credits

- Game engine: [continuum-engine](https://github.com/petemares/continuum-engine)
  by Peter Mares (MIT). See [VENDOR.md](VENDOR.md).
