// @ts-check
import { DUCKS } from "../data/ducks.js";
import { PRODUCERS } from "../data/producers.js";
import { UPGRADES } from "../data/upgrades.js";
import { ERAS } from "../data/eras.js";
import { formatNumber } from "../game/format.js";
import { queueModal } from "./modal.js";

const PRODUCER_NAME = Object.fromEntries(PRODUCERS.map((p) => [p.id, p.name]));
const UPGRADE_NAME = Object.fromEntries(UPGRADES.map((u) => [u.id, u.name]));

/**
 * Human-readable "how to catalogue this breed" hint for a locked cell, so a
 * player chasing the finale knows what's still missing instead of staring at an
 * anonymous egg. Stays glib — it's a hint, not a quest log.
 * @param {import("../data/ducks.js").Unlock} u
 * @returns {string}
 */
function lockedHint(u) {
  switch (u.type) {
    case "era": return `Reach the “${ERAS[u.value].name}” era`;
    case "ducks": return `Make ${formatNumber(u.value)} ducks in total`;
    case "producer": return `Own ${u.count}× ${PRODUCER_NAME[u.id] || u.id}`;
    case "upgrade": return `Buy “${UPGRADE_NAME[u.id] || u.id}”`;
    default: return "Keep making ducks";
  }
}

/**
 * @typedef {object} DexCell
 * @property {HTMLButtonElement} root
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
    cell.title = lockedHint(d.unlock);
    cell.setAttribute("aria-label", `Undiscovered duck. ${lockedHint(d.unlock)}.`);
    cell.innerHTML =
      `<span class="dex-cell__emoji" data-emoji aria-hidden="true">🥚</span>` +
      `<span class="dex-cell__name" data-name>???</span>`;
    cell.addEventListener("click", () => {
      const refs = cells.get(d.id);
      if (refs && refs.revealed) {
        queueModal({ emoji: d.emoji, title: d.name, body: d.blurb, button: "Nice" });
      } else {
        // Locked: tell the player how to earn it (no spoilers on what it is).
        queueModal({ emoji: "🥚", title: "Undiscovered", body: `${lockedHint(d.unlock)}.`, button: "Got it" });
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
      refs.root.title = d.name;
      refs.root.setAttribute("aria-label", `${d.name}. ${d.blurb}`);
      refs.revealed = true;
    }
  }
  if (haveEl) haveEl.textContent = String(meta.dexUnlocked.length);
}
