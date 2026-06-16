// @ts-check
import { formatNumber } from "../game/format.js";
import { PRODUCERS } from "../data/producers.js";

/**
 * @typedef {object} CardRefs
 * @property {HTMLElement} root
 * @property {HTMLElement} count
 * @property {HTMLElement} cost
 * @property {HTMLButtonElement} btn
 */

/** @type {Map<string, CardRefs>} */
const cards = new Map();

/** @type {HTMLElement|null} */ let listEl = null;
/** @type {HTMLElement|null} */ let emptyEl = null;
/** @type {(id: string) => void} */ let onBuy = () => {};

/**
 * @param {{ onBuy: (id: string) => void }} handlers
 */
export function initShop(handlers) {
  listEl = document.getElementById("producer-list");
  emptyEl = document.getElementById("flock-empty");
  onBuy = handlers.onBuy;
}

/**
 * @param {import("../data/producers.js").ProducerDef} def
 * @returns {CardRefs}
 */
function createCard(def) {
  const li = document.createElement("li");
  li.className = "card";
  li.innerHTML =
    `<div class="card__icon" aria-hidden="true">${def.emoji}</div>` +
    `<div class="card__body">` +
      `<div class="card__title">${def.name} <span class="card__count" data-count>×0</span></div>` +
      `<div class="card__blurb">${def.blurb}</div>` +
    `</div>` +
    `<button class="card__buy" type="button" data-buy aria-label="Buy ${def.name}">` +
      `<span class="card__cost" data-cost>—</span>` +
    `</button>`;
  const btn = /** @type {HTMLButtonElement} */ (li.querySelector("[data-buy]"));
  btn.addEventListener("click", () => onBuy(def.id));
  /** @type {CardRefs} */
  const refs = {
    root: li,
    count: /** @type {HTMLElement} */ (li.querySelector("[data-count]")),
    cost: /** @type {HTMLElement} */ (li.querySelector("[data-cost]")),
    btn,
  };
  cards.set(def.id, refs);
  if (listEl) listEl.appendChild(li);
  return refs;
}

/**
 * Reveal/update producer cards. Called every frame; cheap because cards are
 * created once and only their dynamic bits change.
 * @param {{ engine: any, breadcrumbs: number, era: number }} s
 */
export function updateShop(s) {
  let anyVisible = false;
  for (const def of PRODUCERS) {
    const prod = s.engine.producer(def.id);
    const visible = def.era <= s.era || prod.count > 0;
    let refs = cards.get(def.id);

    if (!visible) {
      if (refs) refs.root.style.display = "none";
      continue;
    }
    if (!refs) refs = createCard(def);
    refs.root.style.display = "";
    anyVisible = true;

    const cost = prod.calculateCost(1).price;
    refs.count.textContent = "×" + formatNumber(prod.count, 0);
    refs.cost.textContent = "🍞 " + (isFinite(cost) ? formatNumber(cost, 0) : "∞");
    const affordable = isFinite(cost) && s.breadcrumbs >= cost;
    refs.btn.disabled = !affordable;
    refs.root.classList.toggle("is-affordable", affordable);
  }
  if (emptyEl) emptyEl.style.display = anyVisible ? "none" : "";
}
