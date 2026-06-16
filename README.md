# More Ducks! 🦆

A small, silly, earnestly satirical incremental game about making more ducks.

It runs entirely in your browser — no backend, no accounts, no monetization.
Progress is kept in `localStorage`. Built to play well on a phone in landscape
as much as on a laptop.

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
index.html         entry point (loads src/main.js as a module)
styles/main.css    responsive, phone-landscape-first
src/
  main.js          boot + game loop + autosave
  engine/          vendored continuum-engine (see VENDOR.md)
  game/            economy, save/load, meta state, formatting
  ui/              DOM rendering
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
public repos). All asset paths are relative, so it works under a project subpath
like `you.github.io/more-ducks/` with no configuration.

## Contributing

This is free and open source under the MIT license. It's a personal project
shared in the open — issues and pull requests that keep it small, kind, and fun
are welcome.

## Credits

- Game engine: [continuum-engine](https://github.com/petemares/continuum-engine)
  by Peter Mares (MIT). See [VENDOR.md](VENDOR.md).
