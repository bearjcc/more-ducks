// @ts-check
import { BUILD_COMMIT, GAME_NAME, GAME_VERSION } from "../data/build-info.js";
import { iconBack, iconClose } from "./icons.js";

/**
 * Shared game-window chrome for Settings, About, alerts, and confirms.
 * @param {{
 *   title: string,
 *   iconHtml?: string,
 *   labelledBy: string,
 *   showFooter?: boolean,
 *   extraClass?: string,
 *   bodySlot?: string,
 * }} opts
 */
export function gameWindowMarkup(opts) {
  const foot =
    opts.showFooter !== false
      ? `<footer class="gamewin__foot"><span class="gamewin__foot-name">${GAME_NAME}</span>` +
        `<span class="gamewin__foot-ver">v${GAME_VERSION}</span>` +
        `<span class="gamewin__foot-build" aria-hidden="true">${BUILD_COMMIT}</span></footer>`
      : "";
  const icon = opts.iconHtml ? `<span class="gamewin__icon">${opts.iconHtml}</span>` : "";
  return (
    `<div class="gamewin ${opts.extraClass || ""}" role="dialog" aria-modal="true" aria-labelledby="${opts.labelledBy}">` +
      `<header class="gamewin__bar">` +
        `<button type="button" class="gamewin__back" id="settings-about-back" hidden aria-label="Back">` +
          iconBack() +
        `</button>` +
        `<div class="gamewin__title-wrap">` +
          icon +
          `<h2 id="${opts.labelledBy}" class="gamewin__title">${opts.title}</h2>` +
        `</div>` +
        `<button type="button" class="gamewin__close" aria-label="Close">` + iconClose() + `</button>` +
      `</header>` +
      `<div class="gamewin__inset">${opts.bodySlot || ""}</div>` +
      foot +
    `</div>`
  );
}
