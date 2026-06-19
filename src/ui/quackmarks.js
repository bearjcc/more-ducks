// @ts-check
/** Quackmark cards inside the Marks tab vanity panel (#quackmark-list). */
import { formatNumber } from "../game/format.js";
import { QUACKMARKS } from "../data/quackmarks.js";
import { quackmarkVisible } from "../game/quackmarks.js";
import { DUCKS } from "../data/ducks.js";
import { flashCard } from "./render.js";

const DUCK_NAME = Object.fromEntries(DUCKS.map((d) => [d.id, d.name]));

/** @type {Map<string, { root: HTMLElement, cost: HTMLElement, btn: HTMLButtonElement, ownedShown: boolean }>} */
const cards = new Map();

/** @type {HTMLElement|null} */ let listEl = null;
/** @type {HTMLElement|null} */ let emptyEl = null;
/** @type {(id: string) => boolean} */ let onBuy = () => false;

/**
 * @param {{ onBuy: (id: string) => boolean }} handlers
 */
export function initQuackmarks(handlers) {
  listEl = document.getElementById("quackmark-list");
  emptyEl = document.getElementById("quackmarks-empty");
  onBuy = handlers.onBuy;
}

/**
 * @param {import("../data/quackmarks.js").QuackmarkDef} def
 */
function createCard(def) {
  const li = document.createElement("li");
  li.className = "card card--mark";
  li.innerHTML =
    `<div class="card__icon" aria-hidden="true">${def.emoji}</div>` +
    `<div class="card__body">` +
      `<div class="card__title">${def.name} <span class="card__tag">${def.label}</span></div>` +
      `<div class="card__blurb">${def.blurb}</div>` +
    `</div>` +
    `<button class="card__buy" type="button" data-buy aria-label="Run ${def.name}">` +
      `<span class="card__cost" data-cost>—</span>` +
    `</button>`;
  const btn = /** @type {HTMLButtonElement} */ (li.querySelector("[data-buy]"));
  btn.addEventListener("click", () => {
    if (onBuy(def.id)) flashCard(refs.root);
  });
  const refs = { root: li, cost: /** @type {HTMLElement} */ (li.querySelector("[data-cost]")), btn, ownedShown: false };
  cards.set(def.id, refs);
  if (listEl) listEl.appendChild(li);
  return refs;
}

/**
 * @param {{ engine: any, meta: import("../game/meta.js").Meta, coins: number }} s
 */
export function updateQuackmarks(s) {
  let anyVisible = false;
  for (const def of QUACKMARKS) {
    const owned = s.meta.quackmarksOwned.includes(def.id);
    const visible = quackmarkVisible(s.meta, def);
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
        refs.cost.textContent = "✓ Certified";
        refs.btn.disabled = true;
        refs.ownedShown = true;
      }
      continue;
    }

    if (def.needsDex && !s.meta.dexUnlocked.includes(def.needsDex)) {
      refs.cost.textContent = `Needs ${DUCK_NAME[def.needsDex] || def.needsDex}`;
      refs.btn.disabled = true;
      refs.root.classList.remove("is-affordable");
      continue;
    }

    refs.cost.textContent = "🪙 " + formatNumber(def.cost, 0);
    const affordable = s.coins >= def.cost;
    refs.btn.disabled = !affordable;
    refs.root.classList.toggle("is-affordable", affordable);
  }
  if (emptyEl) emptyEl.style.display = anyVisible ? "none" : "";
}
