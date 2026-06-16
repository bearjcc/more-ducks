// @ts-check
/**
 * A single reusable modal with a queue, so era beats and dex details never
 * stack on top of each other. Built in JS to keep index.html lean.
 *
 * @typedef {{ emoji?: string, title: string, body: string, button?: string, onClose?: () => void }} ModalSpec
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

export function initModal() {
  overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.hidden = true;
  overlay.innerHTML =
    `<div class="modal" role="dialog" aria-modal="true">` +
      `<div class="modal__emoji" data-emoji aria-hidden="true"></div>` +
      `<h2 class="modal__title" data-title></h2>` +
      `<p class="modal__body" data-body></p>` +
      `<button class="modal__btn" type="button" data-btn></button>` +
    `</div>`;
  document.body.appendChild(overlay);

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
  overlay.hidden = false;
  btnEl.focus();
}

function dismiss() {
  const closing = currentSpec;
  currentSpec = null;
  if (closing && closing.onClose) closing.onClose();
  showNext();
}

function hide() {
  open = false;
  overlay.hidden = true;
}
