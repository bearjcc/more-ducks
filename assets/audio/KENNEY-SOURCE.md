# Kenney Interface Sounds (UI)

The 14 UI clips are **Kenney Interface Sounds** filenames (`click_001`, `confirmation_002`, etc.).

**Source used in CI / agent builds:** sparse clone of [ShadowBlip/OpenGamepadUI](https://github.com/ShadowBlip/OpenGamepadUI) at `assets/audio/interface/`. That tree is a redistributable copy of Kenney’s pack (CC0), not a substitute library.

**Processing:** `scripts/prepare-audio-assets.mjs` reads those `.ogg` files (unmodified bytes from the mirror), then re-encodes to **Opus** `.ogg` plus **AAC** `.m4a` for Safari. Shipped Opus files are **not bit-identical** to Kenney’s originals; they are lossy transcodes of the same sources.

Official pack: https://kenney.nl/assets/interface-sounds
