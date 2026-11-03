// @ts-check
// aislop-ignore-file security/innerhtml -- audited: all interpolated values are dev-authored constants (BASIC_ANSWERS data, toast strings).
import { prefersReducedMotion } from "./render.js";
/** @type {HTMLElement|null} */
let host = null;

/** @type {{ title: string, body: string }[]} */
const queue = [];
let showing = false;
const TOAST_MS = 4500;
const GAP_MS = 700;
const MAX_VISIBLE = 2;

export function initToasts() {
  host = document.createElement("div");
  host.className = "toast-host";
  host.setAttribute("aria-live", "polite");
  document.body.appendChild(host);
}

/**
 * @param {{ title: string, body: string }} spec
 */
export function showToast(spec) {
  queue.push(spec);
  drainQueue();
}

function drainQueue() {
  if (!host || showing) return;
  if (queue.length === 0) return;
  const visible = host.querySelectorAll(".toast.is-visible").length;
  if (visible >= MAX_VISIBLE) return;
  showing = true;
  const spec = queue.shift();
  if (!spec) {
    showing = false;
    return;
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<strong class="toast__title">${spec.title}</strong><span class="toast__body">${spec.body}</span>`;
  host.appendChild(el);
  if (!prefersReducedMotion()) {
    requestAnimationFrame(() => el.classList.add("is-visible"));
  } else {
    el.classList.add("is-visible");
  }
  const dismiss = () => {
    el.classList.remove("is-visible");
    setTimeout(() => {
      el.remove();
      showing = false;
      if (queue.length > 0) setTimeout(drainQueue, GAP_MS);
    }, prefersReducedMotion() ? 0 : 300);
  };
  setTimeout(dismiss, TOAST_MS);
  el.addEventListener("click", dismiss);
}
