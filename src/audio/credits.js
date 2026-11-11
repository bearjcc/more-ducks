// @ts-check

/** Lines shown in Settings → Credits. Keep in sync with assets/audio/manifest.json. */
export const CREDITS_BLOCKS = [
  {
    heading: "Music",
    lines: [
      "Pond Bed — original calm loop composed for More Ducks (CC0, in-repo).",
      "Direction: Kevin MacLeod (incompetech.com, CC BY 4.0). When a MacLeod track is bundled, use:",
      '"Music: [Title] by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0."',
      "Licence: https://creativecommons.org/licenses/by/4.0/",
    ],
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
      "Procedural pond beds (day/night) rendered in-repo (CC0).",
      "Freesound references (not redistributed): parret 481883, Nirtana 152675 (CC0).",
    ],
  },
  {
    heading: "Duck quack synthesizer",
    lines: [
      "duck-pond by CELPHASE — MIT License.",
      "https://github.com/celphase/duck-pond",
      "JS port: src/audio/duckSynth.js (see vendor/duck-pond/LICENSE).",
    ],
  },
];

/**
 * @returns {string}
 */
export function creditsPlainText() {
  return CREDITS_BLOCKS.map((b) => `${b.heading}\n${b.lines.join("\n")}`).join("\n\n");
}
