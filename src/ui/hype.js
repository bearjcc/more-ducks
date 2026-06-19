// @ts-check
import { formatNumber } from "../game/format.js";
import { campaignVisible } from "../game/hype.js";
import { HYPE_CAMPAIGNS } from "../data/hype.js";
import { flashCard } from "./render.js";

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
/** @type {(id: string) => boolean} */ let onBuy = () => false;

/**
 * @param {{ onBuy: (id: string) => boolean }} handlers
 */
export function initHype(handlers) {
  listEl = document.getElementById("hype-list");
  emptyEl = document.getElementById("hype-empty");
  onBuy = handlers.onBuy;
}

/**
 * @param {import("../data/hype.js").HypeCampaignDef} def
 * @returns {CardRefs}
 */
function createCard(def) {
  const li = document.createElement("li");
  li.className = "card";
  li.innerHTML =
    `<div class="card__icon" aria-hidden="true">${def.emoji}</div>` +
    `<div class="card__body">` +
      `<div class="card__title">${def.name} <span class="card__count" data-hype>+${formatNumber(def.hypeGain, 0)}</span></div>` +
      `<div class="card__blurb">${def.blurb}</div>` +
    `</div>` +
    `<button class="card__buy" type="button" data-buy aria-label="Launch ${def.name}">` +
      `<span class="card__cost" data-cost>—</span>` +
    `</button>`;
  const btn = /** @type {HTMLButtonElement} */ (li.querySelector("[data-buy]"));
  /** @type {CardRefs} */
  const refs = {
    root: li,
    count: /** @type {HTMLElement} */ (li.querySelector("[data-hype]")),
    cost: /** @type {HTMLElement} */ (li.querySelector("[data-cost]")),
    btn,
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
 * @param {{ meta: import("../game/meta.js").Meta, coins: number }} s
 */
export function updateHype(s) {
  let anyVisible = false;
  for (const def of HYPE_CAMPAIGNS) {
    const visible = campaignVisible(s.meta, def);
    let refs = cards.get(def.id);

    if (!visible) {
      if (refs) refs.root.style.display = "none";
      continue;
    }
    if (!refs) refs = createCard(def);
    refs.root.style.display = "";
    anyVisible = true;

    refs.cost.textContent = "🪙 " + formatNumber(def.cost, 0);
    const affordable = s.coins >= def.cost;
    refs.btn.disabled = !affordable;
    refs.root.classList.toggle("is-affordable", affordable);
    refs.btn.setAttribute("aria-label", `Launch ${def.name} for ${formatNumber(def.cost, 0)} coins`);
  }
  if (emptyEl) emptyEl.style.display = anyVisible ? "none" : "";
}
