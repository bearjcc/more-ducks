// @ts-check
import { ACTS } from "../data/eras.js";

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
/** @type {HTMLElement} */ let emojiEl;
/** @type {HTMLElement} */ let titleEl;
/** @type {HTMLElement} */ let bodyEl;
/** @type {HTMLButtonElement} */ let btnEl;

/** @type {HTMLElement} */ let modalEl;

export function initModal() {
  overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.hidden = true;
  overlay.innerHTML =
    `<div class="modal" role="dialog" aria-modal="true">` +
      `<div class="modal__header">` +
        `<div class="modal__emoji" data-emoji aria-hidden="true"></div>` +
      `</div>` +
      `<h2 class="modal__title" data-title></h2>` +
      `<p class="modal__body" data-body></p>` +
      `<button class="modal__btn" type="button" data-btn></button>` +
    `</div>`;
  document.body.appendChild(overlay);

  modalEl = /** @type {HTMLElement} */ (overlay.querySelector(".modal"));
  emojiEl = /** @type {HTMLElement} */ (overlay.querySelector("[data-emoji]"));
  titleEl = /** @type {HTMLElement} */ (overlay.querySelector("[data-title]"));
  bodyEl = /** @type {HTMLElement} */ (overlay.querySelector("[data-body]"));
  btnEl = /** @type {HTMLButtonElement} */ (overlay.querySelector("[data-btn]"));

  btnEl.addEventListener("click", dismiss);
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
  emojiEl.textContent = spec.emoji || "";
  emojiEl.style.display = spec.emoji ? "" : "none";
  titleEl.textContent = spec.title;
  bodyEl.textContent = spec.body;
  bodyEl.style.display = spec.body ? "" : "none";
  btnEl.textContent = spec.button || "Onward";
  modalEl.classList.toggle("modal--welcome", spec.variant === "welcome");
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
  if (closing.onClose) closing.onClose();
  showNext();
}

function hide() {
  open = false;
  overlay.hidden = true;
}
