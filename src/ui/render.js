// @ts-check
import { formatNumber } from "../game/format.js";

/** @type {Record<string, HTMLElement|null>} */
const els = {};

/** @param {string} id */
function byId(id) {
  return document.getElementById(id);
}

/**
 * Wire up persistent UI handlers (the quack button and tab switching).
 * @param {{ onQuack: () => void }} handlers
 */
export function initUI(handlers) {
  els.duckCount = byId("duck-count");
  els.crumbCount = byId("crumb-count");
  els.duckRate = byId("duck-rate");
  els.logList = byId("log-list");

  const quack = byId("quack-btn");
  if (quack) {
    // `click` covers mouse, touch, and keyboard (Enter/Space) for accessibility.
    quack.addEventListener("click", () => handlers.onQuack());
  }

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => selectTab(tab.getAttribute("data-tab")));
  });
}

/** @param {string|null} name */
function selectTab(name) {
  if (!name) return;
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("is-active", t.getAttribute("data-tab") === name));
  document.querySelectorAll(".tab-panel").forEach((p) =>
    p.classList.toggle("is-active", p.getAttribute("data-panel") === name));
}

/**
 * Refresh the live counters. Called every frame.
 * @param {{ ducks: number, breadcrumbs: number, ducksPerSec: number }} snapshot
 */
export function updateUI(snapshot) {
  if (els.duckCount) els.duckCount.textContent = formatNumber(snapshot.ducks);
  if (els.crumbCount) els.crumbCount.textContent = formatNumber(snapshot.breadcrumbs);
  if (els.duckRate) els.duckRate.textContent = formatNumber(snapshot.ducksPerSec, 1);
}

/**
 * Append a line to the event log (newest on top).
 * @param {string} message
 * @param {boolean} [isBeat]  Highlight as a narrative beat.
 */
export function logMessage(message, isBeat = false) {
  const list = els.logList;
  if (!list) return;
  const li = document.createElement("li");
  li.textContent = message;
  if (isBeat) li.classList.add("is-beat");
  list.prepend(li);
  while (list.children.length > 100 && list.lastChild) {
    list.removeChild(list.lastChild);
  }
}
