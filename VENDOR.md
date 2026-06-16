# Vendored dependencies

More Ducks! is build-free: third-party code is copied into the repo rather than
pulled from a package manager, so the game runs straight from static files.

## continuum-engine

- **Location:** `src/engine/`
- **License:** MIT — Copyright (c) 2018 Peter Mares (see `src/engine/LICENSE`)
- **Upstream:** https://github.com/petemares/continuum-engine
- **What it is:** a small idle/incremental game engine (currencies, resources,
  producers, modifiers, reactors, a tick loop, and an event system).
- **Local changes:** none yet. If the vendored source is modified, note the
  change here so it stays distinguishable from upstream.

## break_eternity.js (not yet vendored)

Reserved for a possible future "endless" mode if numbers ever need to exceed the
JavaScript float ceiling (~1e308). Not a current dependency — the game is paced
to a deliberate ending well before that limit.
