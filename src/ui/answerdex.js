// @ts-check
import { QUACKS } from "../data/quacks.js";
import { answerdexCount } from "../game/answerdex.js";

/** @type {HTMLElement|null} */ let gridEl = null;
/** @type {HTMLElement|null} */ let countEl = null;

export function initAnswerdex() {
  gridEl = document.getElementById("answerdex-grid");
  countEl = document.getElementById("answerdex-have");
}

/**
 * @param {import("../game/meta.js").Meta} meta
 */
export function updateAnswerdex(meta) {
  if (!gridEl) return;
  const seen = new Set(meta.answerdexSeen);
  if (countEl) countEl.textContent = String(answerdexCount(meta));
  gridEl.replaceChildren();
  for (const [text, weight] of QUACKS) {
    const cell = document.createElement("div");
    cell.className = "answerdex__cell";
    const known = seen.has(text);
    cell.classList.toggle("is-seen", known);
    cell.title = known ? text : "Unknown quack";
    cell.textContent = known ? text : "?";
    if (!known && weight < 50) cell.classList.add("is-rare");
    gridEl.appendChild(cell);
  }
}
