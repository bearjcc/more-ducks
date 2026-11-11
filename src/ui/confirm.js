// @ts-check
import { iconTrash, iconClose } from "./icons.js";

/** @type {HTMLElement|null} */
let overlay = null;

export function initConfirm() {
  if (overlay) return;
  overlay = document.createElement("div");
  overlay.className = "modal-overlay confirm-overlay";
  overlay.hidden = true;
  overlay.innerHTML =
    `<div class="gamewin gamewin--confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">` +
      `<header class="gamewin__bar">` +
        `<div class="gamewin__title-wrap">` +
          `<span class="gamewin__icon">${iconTrash()}</span>` +
          `<h2 id="confirm-title" class="gamewin__title" data-confirm-title>Confirm</h2>` +
        `</div>` +
        `<button type="button" class="gamewin__close" data-confirm-cancel aria-label="Cancel">${iconClose()}</button>` +
      `</header>` +
      `<div class="gamewin__inset">` +
        `<p class="gamewin__body" data-confirm-body></p>` +
        `<div class="gamewin__actions gamewin__actions--split">` +
          `<button type="button" class="gamewin__btn" data-confirm-cancel>Cancel</button>` +
          `<button type="button" class="gamewin__btn gamewin__btn--danger" data-confirm-ok>Confirm</button>` +
        `</div>` +
      `</div>` +
    `</div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeConfirm();
  });
  for (const el of overlay.querySelectorAll("[data-confirm-cancel]")) {
    el.addEventListener("click", closeConfirm);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay && !overlay.hidden) closeConfirm();
  });
}

/**
 * @param {{ title: string, body: string, okLabel?: string, cancelLabel?: string, onConfirm: () => void }} spec
 */
export function showConfirm(spec) {
  if (!overlay) initConfirm();
  const root = /** @type {HTMLElement} */ (overlay);
  root.querySelector("[data-confirm-title]").textContent = spec.title;
  root.querySelector("[data-confirm-body]").textContent = spec.body;
  const ok = /** @type {HTMLButtonElement} */ (root.querySelector("[data-confirm-ok]"));
  ok.textContent = spec.okLabel || "Confirm";
  ok.onclick = () => {
    closeConfirm();
    spec.onConfirm();
  };
  const cancel = /** @type {HTMLButtonElement} */ (root.querySelector(".gamewin__actions [data-confirm-cancel]"));
  cancel.textContent = spec.cancelLabel || "Cancel";
  root.hidden = false;
  ok.focus();
}

function closeConfirm() {
  if (!overlay) return;
  overlay.hidden = true;
}
