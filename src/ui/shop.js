// @ts-check
import { formatNumber } from "../game/format.js";
import { bulkCost, maxAffordable } from "../game/economy.js";
import { PRODUCERS } from "../data/producers.js";

/** @typedef {1 | 10 | 100 | "max"} BuyMode */

/**
 * @typedef {object} CardRefs
 * @property {HTMLElement} root
 * @property {HTMLElement} count
 * @property {HTMLElement} cost
 * @property {HTMLButtonElement} btn
 */

/** @type {Map<string, CardRefs>} */
const cards = new Map();
/** @type {WeakMap<HTMLButtonElement, { engine: any, crumbs: number }>} */
const buyCtx = new WeakMap();

/** @type {HTMLElement|null} */ let listEl = null;
/** @type {HTMLElement|null} */ let emptyEl = null;
/** @type {(id: string, qty: number) => void} */ let onBuy = () => {};
/** @type {(mode: import("../game/meta.js").Settings["buyMode"]) => void} */ let onBuyModeChange = () => {};
/** @type {BuyMode} */ let buyMode = 1;

const BUY_MODES = /** @type {const} */ (["1", "10", "100", "max"]);

/**
 * @param {{ onBuy: (id: string, qty: number) => void, onBuyModeChange?: (mode: import("../game/meta.js").Settings["buyMode"]) => void }} handlers
 */
export function initShop(handlers) {
  listEl = document.getElementById("producer-list");
  emptyEl = document.getElementById("flock-empty");
  onBuy = handlers.onBuy;
  onBuyModeChange = handlers.onBuyModeChange || (() => {});

  const bar = document.getElementById("buy-amount");
  if (bar) {
    bar.querySelectorAll("[data-buy-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-buy-mode");
        if (mode === "1" || mode === "10" || mode === "100" || mode === "max") {
          buyMode = mode === "max" ? "max" : /** @type {1|10|100} */ (Number(mode));
          bar.querySelectorAll("[data-buy-mode]").forEach((b) =>
            b.classList.toggle("is-active", b === btn));
          onBuyModeChange(buyMode);
        }
      });
    });
  }
}

/** @param {BuyMode} mode */
export function setBuyMode(mode) {
  buyMode = mode;
  const bar = document.getElementById("buy-amount");
  if (!bar) return;
  bar.querySelectorAll("[data-buy-mode]").forEach((b) => {
    const m = b.getAttribute("data-buy-mode");
    const active = m === String(mode);
    b.classList.toggle("is-active", active);
  });
}

/** @returns {BuyMode} */
export function getBuyMode() {
  return buyMode;
}

/**
 * @param {any} engine
 * @param {string} id
 * @param {number} breadcrumbs
 * @returns {number}
 */
function resolveQty(engine, id, breadcrumbs) {
  if (!engine) return 0;
  if (buyMode === "max") return maxAffordable(engine, id, breadcrumbs);
  const cap = buyMode;
  const afford = maxAffordable(engine, id, breadcrumbs);
  return Math.min(cap, afford);
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
  btn.addEventListener("click", () => {
    const ctx = buyCtx.get(btn);
    const qty = resolveQty(ctx?.engine, def.id, ctx?.crumbs ?? 0);
    if (qty > 0) onBuy(def.id, qty);
  });
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

    const qty = resolveQty(s.engine, def.id, s.breadcrumbs);
    const cost = qty > 0 ? bulkCost(s.engine, def.id, qty) : bulkCost(s.engine, def.id, 1);
    refs.count.textContent = "×" + formatNumber(prod.count, 0);
    const label = qty > 1 ? `×${formatNumber(qty, 0)} ` : "";
    refs.cost.textContent = "🍞 " + label + (isFinite(cost) ? formatNumber(cost, 0) : "∞");
    const affordable = qty > 0 && isFinite(cost) && s.breadcrumbs >= cost;
    refs.btn.disabled = !affordable;
    buyCtx.set(refs.btn, { engine: s.engine, crumbs: s.breadcrumbs });
    refs.btn.setAttribute("aria-label", qty > 1 ? `Buy ${qty} ${def.name}` : `Buy ${def.name}`);
    refs.root.classList.toggle("is-affordable", affordable);
  }
  if (emptyEl) emptyEl.style.display = anyVisible ? "none" : "";
}
