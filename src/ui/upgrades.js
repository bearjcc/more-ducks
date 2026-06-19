// @ts-check
import { formatNumber } from "../game/format.js";
import { ALL_UPGRADES } from "../game/upgrades.js";
import { purchaseRevealed } from "../game/unlocks.js";
import { flashCard } from "./render.js";

/**
 * @typedef {object} UpgRefs
 * @property {HTMLElement} root
 * @property {HTMLElement} cost
 * @property {HTMLButtonElement} btn
 * @property {boolean} ownedShown
 */

/** @type {Map<string, UpgRefs>} */
const cards = new Map();

/** @type {HTMLElement|null} */ let coinListEl = null;
/** @type {HTMLElement|null} */ let coinEmptyEl = null;
/** @type {HTMLElement|null} */ let researchListEl = null;
/** @type {HTMLElement|null} */ let researchEmptyEl = null;
/** @type {(id: string) => boolean} */ let onBuy = () => false;

/**
 * @param {import("../data/upgrades.js").UpgradeDef|import("../data/research.js").ResearchUpgradeDef} def
 */
function isResearch(def) {
  return "currency" in def && def.currency === "research";
}

/**
 * @param {{ onBuy: (id: string) => boolean }} handlers
 */
export function initUpgrades(handlers) {
  coinListEl = document.getElementById("upgrade-list");
  coinEmptyEl = document.getElementById("upgrades-empty");
  researchListEl = document.getElementById("research-list");
  researchEmptyEl = document.getElementById("research-empty");
  onBuy = handlers.onBuy;
}

/**
 * @param {import("../data/upgrades.js").UpgradeDef|import("../data/research.js").ResearchUpgradeDef} def
 * @param {HTMLElement|null} listEl
 * @returns {UpgRefs}
 */
function createCard(def, listEl) {
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
  /** @type {UpgRefs} */
  const refs = {
    root: li,
    cost: /** @type {HTMLElement} */ (li.querySelector("[data-cost]")),
    btn,
    ownedShown: false,
  };
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (onBuy(def.id)) flashCard(refs.root);
  });
  li.addEventListener("click", () => {
    if (onBuy(def.id)) flashCard(refs.root);
  });
  cards.set(def.id, refs);
  if (listEl) listEl.appendChild(li);
  return refs;
}

/**
 * @param {{ engine: any, meta: import("../game/meta.js").Meta, coins: number, research?: number }} s
 * @param {HTMLElement|null} listEl
 * @param {HTMLElement|null} emptyEl
 * @param {(def: import("../data/upgrades.js").UpgradeDef|import("../data/research.js").ResearchUpgradeDef) => boolean} filter
 */
function updateList(s, listEl, emptyEl, filter) {
  let anyVisible = false;
  for (const def of ALL_UPGRADES) {
    if (!filter(def)) continue;
    const owned = s.meta.upgradesOwned.includes(def.id);
    const currencyKey = isResearch(def) ? "research" : "coins";
    const balance = currencyKey === "research" ? (s.research ?? 0) : s.coins;
    const visible = (def.era <= s.meta.era || owned)
      && purchaseRevealed(balance, def.cost, owned);
    let refs = cards.get(def.id);

    if (!visible) {
      if (refs) refs.root.style.display = "none";
      continue;
    }
    if (!refs) refs = createCard(def, listEl);
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

    const icon = currencyKey === "research" ? "🔬" : "🪙";
    refs.cost.textContent = icon + " " + formatNumber(def.cost, 0);
    const affordable = balance >= def.cost;
    refs.btn.disabled = !affordable;
    refs.root.classList.toggle("is-affordable", affordable);
  }
  if (emptyEl) emptyEl.style.display = anyVisible ? "none" : "";
}

/**
 * @param {{ engine: any, meta: import("../game/meta.js").Meta, coins: number, research?: number }} s
 */
export function updateUpgrades(s) {
  updateList(s, coinListEl, coinEmptyEl, (def) => !isResearch(def));
  updateList(s, researchListEl, researchEmptyEl, isResearch);
}
