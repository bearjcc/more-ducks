// @ts-check
import { DUCKS } from "../data/ducks.js";
import { queueModal } from "./modal.js";

/**
 * @typedef {object} DexCell
 * @property {HTMLElement} root
 * @property {HTMLElement} emoji
 * @property {HTMLElement} name
 * @property {boolean} revealed
 */

/** @type {Map<string, DexCell>} */
const cells = new Map();
/** @type {HTMLElement|null} */ let gridEl = null;
/** @type {HTMLElement|null} */ let haveEl = null;
/** @type {HTMLElement|null} */ let totalEl = null;
/** @type {HTMLElement|null} */ let emptyEl = null;

export function initDex() {
  gridEl = document.getElementById("duckdex-grid");
  haveEl = document.getElementById("dex-have");
  totalEl = document.getElementById("dex-total");
  emptyEl = document.getElementById("duckdex-empty");
  if (totalEl) totalEl.textContent = String(DUCKS.length);

  // Build every cell up front as a locked egg, so the grid shows the shape of
  // the collection (and how much is missing).
  for (const d of DUCKS) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "dex-cell is-locked";
    cell.disabled = true;
    cell.innerHTML =
      `<span class="dex-cell__emoji" data-emoji aria-hidden="true">🥚</span>` +
      `<span class="dex-cell__name" data-name>???</span>`;
    cell.addEventListener("click", () => {
      const refs = cells.get(d.id);
      if (refs && refs.revealed) {
        queueModal({ emoji: d.emoji, title: d.name, body: d.blurb, button: "Nice" });
      }
    });
    cells.set(d.id, {
      root: cell,
      emoji: /** @type {HTMLElement} */ (cell.querySelector("[data-emoji]")),
      name: /** @type {HTMLElement} */ (cell.querySelector("[data-name]")),
      revealed: false,
    });
    if (gridEl) gridEl.appendChild(cell);
  }
  if (emptyEl) emptyEl.style.display = "none";
}

/**
 * Reveal cells for catalogued breeds. Cheap: only flips newly-unlocked ones.
 * @param {import("../game/meta.js").Meta} meta
 */
export function updateDex(meta) {
  for (const d of DUCKS) {
    const refs = cells.get(d.id);
    if (!refs || refs.revealed) continue;
    if (meta.dexUnlocked.includes(d.id)) {
      refs.root.classList.remove("is-locked");
      refs.root.classList.add("is-unlocked");
      refs.root.disabled = false;
      refs.emoji.textContent = d.emoji;
      refs.name.textContent = d.name;
      refs.revealed = true;
    }
  }
  if (haveEl) haveEl.textContent = String(meta.dexUnlocked.length);
}
