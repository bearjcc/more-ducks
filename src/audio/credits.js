// @ts-check

/** Exact CC-BY attribution (manifest tests). */
export const MACLEOD_ATTRIBUTION =
  '"Thinking Music" Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License, http://creativecommons.org/licenses/by/4.0/.';

/** Audio attribution blocks (About page). Keep in sync with assets/audio/manifest.json. */
export const CREDITS_BLOCKS = [
  {
    heading: "Music",
    lines: [MACLEOD_ATTRIBUTION],
  },
  {
    heading: "Sound effects (UI)",
    lines: [
      "Kenney Interface Sounds — Kenney Vleugels (kenney.nl), CC0 1.0.",
      "https://creativecommons.org/publicdomain/zero/1.0/",
    ],
  },
  {
    heading: "Ambience",
    lines: [
      '"Ducks, mostly Mallard, High Park, Toronto (2012)" by TRP — CC0 1.0 — https://freesound.org/people/TRP/sounds/616827/',
      '"night at pond edit 2012" by Nirtana — CC0 1.0 — https://freesound.org/people/Nirtana/sounds/152675/',
      '"Night Ambience" by parret — CC0 1.0 — https://freesound.org/people/parret/sounds/481883/',
      '"Hundreds of ducks" by spurioustransients — CC0 1.0 — https://freesound.org/people/spurioustransients/sounds/591702/ (optional late-act layer, heavily ducked).',
    ],
  },
  {
    heading: "Duck quack synthesizer",
    lines: [
      "Quack synth ported from CELPHASE duck-pond (MIT) — https://github.com/celphase/duck-pond",
    ],
  },
];

/**
 * @returns {string}
 */
export function creditsPlainText() {
  return CREDITS_BLOCKS.map((b) => `${b.heading}\n${b.lines.join("\n")}`).join("\n\n");
}
