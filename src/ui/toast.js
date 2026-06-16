// @ts-check
import { prefersReducedMotion } from "./render.js";

/** @type {HTMLElement|null} */
let host = null;

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
  if (!host) return;
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
    setTimeout(() => el.remove(), prefersReducedMotion() ? 0 : 300);
  };
  setTimeout(dismiss, 4500);
  el.addEventListener("click", dismiss);
}
