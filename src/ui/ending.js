// @ts-check
import { queueModal } from "./modal.js";
import { formatNumber } from "../game/format.js";

/**
 * The finale. A glowing "Convert Everything" appears once the world is era 4
 * and the Duckdex is complete. Clicking it runs a short sequence of beats whose
 * tone descends from glib to quiet, then opens a calm terminal screen. The
 * allegory is never named — the ending just stops, and lets the player connect
 * it themselves.
 */

/** @type {HTMLButtonElement|null} */ let ctaEl = null;
/** @type {HTMLElement|null} */ let hintEl = null;
/** @type {() => void} */ let onReset = () => {};
/** @type {() => number} */ let getTotalDucks = () => 0;
/** @type {() => void} */ let onEnded = () => {};
let ctaWired = false;
let terminalShown = false;

/** @type {import("./modal.js").ModalSpec[]} */
const BEATS = [
  { emoji: "🌏", title: "One Pond Left", body: "A little not-duck remains — a continent's worth, maybe two. It would be tidier as ducks, wouldn't it?", button: "Convert it" },
  { emoji: "🦆", title: "Converting…", body: "The oceans first. Then everything else. It goes quickly now; the ducks know how.", button: "…" },
  { title: "Done.", body: "There is nothing left to count but ducks. You have made more ducks than there were things to make them from.", button: "…" },
  { title: "More Ducks.", body: "", button: "…" },
  { title: "Oh.", body: "", button: "…" },
];

/**
 * @param {{ onReset: () => void, getTotalDucks: () => number, onEnded: () => void }} handlers
 */
export function initEnding(handlers) {
  onReset = handlers.onReset;
  getTotalDucks = handlers.getTotalDucks;
  onEnded = handlers.onEnded;
  ctaEl = /** @type {HTMLButtonElement} */ (document.getElementById("finale-cta"));
  hintEl = document.getElementById("finale-hint");
  if (ctaEl && !ctaWired) {
    ctaEl.addEventListener("click", startFinale);
    ctaWired = true;
  }
}

/**
 * Reflect endgame readiness each frame (idempotent). When ready, the CTA shows;
 * otherwise an era-4 player sees how much of the Duckdex remains.
 * @param {boolean} ready
 * @param {number} have
 * @param {number} total
 */
export function updateFinaleCta(ready, have, total) {
  if (!ctaEl) return;
  if (ready) {
    ctaEl.hidden = false;
    if (hintEl) hintEl.hidden = true;
  } else {
    ctaEl.hidden = true;
    if (hintEl) {
      hintEl.hidden = false;
      hintEl.textContent = `Catalogue every duck to finish — ${have}/${total}.`;
    }
  }
}

function startFinale() {
  if (ctaEl) ctaEl.hidden = true;
  if (hintEl) hintEl.hidden = true;
  BEATS.forEach((beat, i) => {
    /** @type {import("./modal.js").ModalSpec} */
    const spec = { ...beat };
    if (i === BEATS.length - 1) spec.onClose = showTerminal;
    queueModal(spec);
  });
}

/** Open the terminal screen. Also called on load if the game is already ended. */
export function showTerminal() {
  if (terminalShown) return;
  terminalShown = true;
  onEnded();

  const total = formatNumber(getTotalDucks());
  const overlay = document.createElement("div");
  overlay.className = "ending";
  overlay.innerHTML =
    `<div class="ending__sky" aria-hidden="true">${"🦆".repeat(48)}</div>` +
    `<div class="ending__card">` +
      `<h1 class="ending__title">More Ducks.</h1>` +
      `<p class="ending__line">You made ${total} ducks. There was nothing you wouldn't turn into a duck, in the end.</p>` +
      `<p class="ending__line ending__line--soft">Funny how reasonable each step seemed. It usually does.</p>` +
      `<p class="ending__thanks">Thanks for playing. 🦆</p>` +
      `<button class="ending__btn" type="button">Start a new pond</button>` +
    `</div>`;
  const btn = /** @type {HTMLButtonElement} */ (overlay.querySelector(".ending__btn"));
  btn.addEventListener("click", onReset);
  document.body.appendChild(overlay);
  btn.focus();
}
