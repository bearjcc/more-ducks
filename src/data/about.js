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

/**
 * One row each: holder, licence name, link (for About → Licences).
 * @type {{ holder: string, licence: string, href: string, linkLabel: string }[]}
 */
export const LICENSE_ENTRIES = [
  {
    holder: "More Ducks",
    licence: "MIT License",
    href: "https://opensource.org/licenses/MIT",
    linkLabel: "MIT License",
  },
  {
    holder: "continuum-engine (Peter Mares)",
    licence: "MIT License",
    href: "https://github.com/petemares/continuum-engine",
    linkLabel: "continuum-engine",
  },
  {
    holder: "CELPHASE duck-pond",
    licence: "MIT License",
    href: "https://github.com/celphase/duck-pond",
    linkLabel: "duck-pond",
  },
  {
    holder: "Creative Commons",
    licence: "CC0 1.0 Universal",
    href: "https://creativecommons.org/publicdomain/zero/1.0/",
    linkLabel: "CC0 deed",
  },
  {
    holder: "Creative Commons",
    licence: "CC BY 4.0",
    href: "https://creativecommons.org/licenses/by/4.0/",
    linkLabel: "CC BY 4.0 deed",
  },
];

/**
 * Full plain text of the About page (manifest / licence tests).
 * @returns {string}
 */
export function aboutPlainText() {
  const licenceLines = LICENSE_ENTRIES.map(
    (e) => `${e.holder} — ${e.licence} — ${e.href}`,
  );
  const parts = [
    GAME_NAME,
    GAME_VERSION,
    BUILD_COMMIT,
    GAME_TAGLINE,
    `QLM: ${QLM_URL}`,
    creditsPlainText(),
    `Licences\n${licenceLines.join("\n")}`,
  ];
  return parts.join("\n\n");
}

export { CREDITS_BLOCKS, creditsPlainText, BUILD_COMMIT, GAME_NAME, GAME_TAGLINE, GAME_VERSION };
