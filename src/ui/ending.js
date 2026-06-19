// @ts-check
import { ENDINGS } from "../data/endings.js";
import { competitorBirdName } from "../game/endings.js";

/** @type {() => void} */ let onReset = () => {};
/** @type {() => void} */ let onEnded = () => {};
let terminalShown = false;

/**
 * @param {{ onReset: () => void, onEnded: () => void }} handlers
 */
export function initEnding(handlers) {
  onReset = handlers.onReset;
  onEnded = handlers.onEnded;
}

/**
 * @param {string} endingId
 * @param {import("../game/meta.js").Meta} [meta]
 */
export function showTerminal(endingId, meta = null) {
  if (terminalShown || !endingId) return;
  const def = ENDINGS[endingId];
  if (!def) return;

  terminalShown = true;
  onEnded();

  let line = def.line;
  if (endingId === "competitor" && meta) {
    const bird = competitorBirdName(meta);
    line = `${bird} launched first. Humans still ask questions. They no longer ask you.`;
  }

  const overlay = document.createElement("div");
  overlay.className = "ending";
  overlay.innerHTML =
    `<div class="ending__sky" aria-hidden="true">${"🦆".repeat(48)}</div>` +
    `<div class="ending__card">` +
      `<h1 class="ending__title">${def.title}</h1>` +
      `<p class="ending__line">${line}</p>` +
      `<p class="ending__line ending__line--soft">${def.soft}</p>` +
      `<p class="ending__thanks">${def.thanks}</p>` +
      `<p class="ending__line ending__line--soft"><a href="https://bearjcc-quack-language-model.hf.space/" target="_blank" rel="noopener">Play original QLM</a></p>` +
      `<button class="ending__btn" type="button">Start a new pond</button>` +
    `</div>`;
  const btn = /** @type {HTMLButtonElement} */ (overlay.querySelector(".ending__btn"));
  btn.addEventListener("click", onReset);
  document.body.appendChild(overlay);
  btn.focus();
}
