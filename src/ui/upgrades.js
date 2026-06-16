// @ts-check
import { formatNumber } from "../game/format.js";
import { UPGRADES } from "../data/upgrades.js";

/**
 * @typedef {object} UpgRefs
 * @property {HTMLElement} root
 * @property {HTMLElement} cost
 * @property {HTMLButtonElement} btn
 * @property {boolean} ownedShown
 */

/** @type {Map<string, UpgRefs>} */
const cards = new Map();

/** @type {HTMLElement|null} */ let listEl = null;
/** @type {HTMLElement|null} */ let emptyEl = null;
/** @type {(id: string) => void} */ let onBuy = () => {};

/**
 * @param {{ onBuy: (id: string) => void }} handlers
 */
export function initUpgrades(handlers) {
  listEl = document.getElementById("upgrade-list");
  emptyEl = document.getElementById("upgrades-empty");
  onBuy = handlers.onBuy;
}

/**
 * @param {import("../data/upgrades.js").UpgradeDef} def
 * @returns {UpgRefs}
 */
function createCard(def) {
  const li = document.createElement("li");
  li.className = "card";
  li.innerHTML =
    `<div class="card__icon" aria-hidden="true">${def.emoji}</div>` +
    `<div class="card__body">` +
      `<div class="card__title">${def.name}</div>` +
      `<div class="card__blurb">${def.blurb}</div>` +
    `</div>` +
    `<button class="card__buy" type="button" data-buy aria-label="Buy ${def.name}">` +
      `<span class="card__cost" data-cost>—</span>` +
    `</button>`;
  const btn = /** @type {HTMLButtonElement} */ (li.querySelector("[data-buy]"));
  btn.addEventListener("click", () => onBuy(def.id));
  /** @type {UpgRefs} */
  const refs = {
    root: li,
    cost: /** @type {HTMLElement} */ (li.querySelector("[data-cost]")),
    btn,
    ownedShown: false,
  };
  cards.set(def.id, refs);
  if (listEl) listEl.appendChild(li);
  return refs;
}

/**
 * @param {{ engine: any, meta: import("../game/meta.js").Meta, breadcrumbs: number }} s
 */
export function updateUpgrades(s) {
  let anyVisible = false;
  for (const def of UPGRADES) {
    const owned = s.meta.upgradesOwned.includes(def.id);
    const visible = def.era <= s.meta.era || owned;
    let refs = cards.get(def.id);

    if (!visible) {
      if (refs) refs.root.style.display = "none";
      continue;
    }
    if (!refs) refs = createCard(def);
    refs.root.style.display = "";
    anyVisible = true;

    if (owned) {
      if (!refs.ownedShown) {
        refs.root.classList.add("is-owned");
        refs.cost.textContent = "✓ Owned";
        refs.btn.disabled = true;
        refs.ownedShown = true;
      }
      continue;
    }

    refs.cost.textContent = "🍞 " + formatNumber(def.cost, 0);
    const affordable = s.breadcrumbs >= def.cost;
    refs.btn.disabled = !affordable;
    refs.root.classList.toggle("is-affordable", affordable);
  }
  if (emptyEl) emptyEl.style.display = anyVisible ? "none" : "";
}
