// @ts-check
// aislop-ignore-file security/innerhtml -- audited: modal templates are static; spec fields are dev-authored strings.
import { ACTS } from "../data/eras.js";
import { sfxCollect } from "../game/sfx.js";
import { BUILD_COMMIT, GAME_NAME, GAME_VERSION } from "../data/build-info.js";
import { iconAway, iconClose, iconDuck } from "./icons.js";

/**
 * A single reusable modal with a queue, so act beats and dex details never
 * stack on top of each other. Built in JS to keep index.html lean.
 *
 * @typedef {{ emoji?: string, title: string, body: string, button?: string, variant?: string, onClose?: () => void }} ModalSpec
 */

/** @type {ModalSpec[]} */
const queue = [];
let open = false;
/** @type {ModalSpec|null} */
let currentSpec = null;

/** @type {HTMLElement} */ let overlay;
/** @type {HTMLElement} */ let iconSlot;
/** @type {HTMLElement} */ let titleEl;
/** @type {HTMLElement} */ let bodyEl;
/** @type {HTMLButtonElement} */ let btnEl;
/** @type {HTMLElement} */ let modalEl;

export function initModal() {
  overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.hidden = true;
  overlay.innerHTML =
    `<div class="gamewin gamewin--alert modal" role="dialog" aria-modal="true" aria-labelledby="story-modal-title">` +
      `<header class="gamewin__bar">` +
        `<div class="gamewin__title-wrap">` +
          `<span class="gamewin__icon" data-modal-icon>${iconDuck()}</span>` +
          `<h2 id="story-modal-title" class="gamewin__title" data-title></h2>` +
        `</div>` +
        `<button type="button" class="gamewin__close" data-modal-close aria-label="Close">${iconClose()}</button>` +
      `</header>` +
      `<div class="gamewin__inset">` +
        `<p class="gamewin__body gamewin__body--story" data-body></p>` +
        `<div class="gamewin__actions">` +
          `<button type="button" class="gamewin__btn gamewin__btn--primary modal__btn" data-btn>Onward</button>` +
        `</div>` +
      `</div>` +
      `<footer class="gamewin__foot">` +
        `<span class="gamewin__foot-name">${GAME_NAME}</span>` +
        `<span class="gamewin__foot-ver">v${GAME_VERSION}</span>` +
        `<span class="gamewin__foot-build" aria-hidden="true">${BUILD_COMMIT}</span>` +
      `</footer>` +
    `</div>`;
  document.body.appendChild(overlay);

  modalEl = /** @type {HTMLElement} */ (overlay.querySelector(".gamewin"));
  iconSlot = /** @type {HTMLElement} */ (overlay.querySelector("[data-modal-icon]"));
  titleEl = /** @type {HTMLElement} */ (overlay.querySelector("[data-title]"));
  bodyEl = /** @type {HTMLElement} */ (overlay.querySelector("[data-body]"));
  btnEl = /** @type {HTMLButtonElement} */ (overlay.querySelector("[data-btn]"));
  btnEl.addEventListener("click", dismiss);
  overlay.querySelector("[data-modal-close]")?.addEventListener("click", dismiss);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) dismiss(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) dismiss(); });
}

/** @param {ModalSpec} spec */
export function queueModal(spec) {
  queue.push(spec);
  if (!open) showNext();
}

/**
 * Welcome-back modal (Egg Inc style collect moment).
 * @param {{ mins: number, ducks: string, coins: string, onClose?: () => void }} spec
 */
export function queueWelcomeBack(spec) {
  queueModal({
    emoji: "🦆",
    title: "While you were away",
    body: `~${spec.mins} min — +${spec.ducks} ducks, +${spec.coins} coins.`,
    button: "Collect",
    variant: "welcome",
    onClose: spec.onClose,
  });
}

/**
 * Queue the intro modal for an act plus any scripted follow-up beats.
 * @param {number} actId
 * @param {string} [button]  Primary modal dismiss label (e.g. first-session CTA).
 */
export function queueActEntry(actId, button) {
  const def = ACTS[actId];
  if (!def) return;
  queueModal({
    emoji: def.emoji,
    title: def.name,
    body: def.modalBody,
    button,
  });
  for (const beat of def.beats ?? []) {
    queueModal({
      emoji: beat.emoji,
      title: beat.title,
      body: beat.body,
      button: beat.button,
    });
  }
}

function showNext() {
  const spec = queue.shift();
  if (!spec) { hide(); return; }
  currentSpec = spec;
  open = true;
  iconSlot.innerHTML = spec.variant === "welcome" ? iconAway() : iconDuck();
  titleEl.textContent = spec.title;
  const bodyText = spec.emoji ? `${spec.emoji} ${spec.body}` : spec.body;
  bodyEl.textContent = bodyText;
  bodyEl.style.display = spec.body ? "" : "none";
  btnEl.textContent = spec.button || "Onward";
  modalEl.classList.toggle("gamewin--welcome", spec.variant === "welcome");
  overlay.hidden = false;
  modalEl.classList.remove("is-exiting");
  btnEl.focus();
}

function dismiss() {
  const closing = currentSpec;
  if (closing && modalEl && !modalEl.classList.contains("is-exiting")) {
    modalEl.classList.add("is-exiting");
    modalEl.addEventListener("animationend", () => finishDismiss(closing), { once: true });
    setTimeout(() => finishDismiss(closing), 320);
    return;
  }
  finishDismiss(closing);
}

/** @param {ModalSpec|null} closing */
function finishDismiss(closing) {
  if (!closing || currentSpec !== closing) return;
  currentSpec = null;
  if (closing.variant === "welcome") sfxCollect();
  if (closing.onClose) closing.onClose();
  showNext();
}

function hide() {
  open = false;
  overlay.hidden = true;
}

/** Clear the queue and hide any open modal (capture / dev). */
export function flushModalQueue() {
  queue.length = 0;
  currentSpec = null;
  open = false;
  if (overlay) overlay.hidden = true;
}
