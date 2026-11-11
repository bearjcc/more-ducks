// @ts-check
import { creditsPlainText, CREDITS_BLOCKS } from "../audio/credits.js";
import {
  BUILD_COMMIT,
  GAME_NAME,
  GAME_TAGLINE,
  GAME_VERSION,
} from "./build-info.js";

/** Predecessor chat toy. */
export const QLM_URL = "https://bearjcc-quack-language-model.hf.space/";

/** @type {{ heading: string, lines: string[] }[]} */
export const LICENSE_BLOCKS = [
  {
    heading: "More Ducks (game code)",
    lines: [
      "This project is licensed under the MIT License.",
      "https://opensource.org/licenses/MIT",
    ],
  },
  {
    heading: "Creative Commons",
    lines: [
      "CC0 1.0 Universal: https://creativecommons.org/publicdomain/zero/1.0/",
      "CC BY 4.0: https://creativecommons.org/licenses/by/4.0/",
    ],
  },
  {
    heading: "continuum-engine",
    lines: [
      "Copyright (c) 2018 Peter Mares — MIT License.",
      "https://github.com/petemares/continuum-engine",
    ],
  },
  {
    heading: "CELPHASE duck-pond (quack synthesizer)",
    lines: [
      "Copyright (c) 2026 CELPHASE — MIT License.",
      "See vendor/duck-pond/LICENSE in the repository.",
      "https://github.com/celphase/duck-pond",
    ],
  },
];

/**
 * Full plain text of the About page (manifest / licence tests).
 * @returns {string}
 */
export function aboutPlainText() {
  const parts = [
    GAME_NAME,
    GAME_VERSION,
    BUILD_COMMIT,
    GAME_TAGLINE,
    `QLM: ${QLM_URL}`,
    creditsPlainText(),
    ...LICENSE_BLOCKS.map((b) => `${b.heading}\n${b.lines.join("\n")}`),
  ];
  return parts.join("\n\n");
}

export { CREDITS_BLOCKS, creditsPlainText, BUILD_COMMIT, GAME_NAME, GAME_TAGLINE, GAME_VERSION };
