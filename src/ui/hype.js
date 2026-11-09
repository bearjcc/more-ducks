// @ts-check
// aislop-ignore-file security/innerhtml -- audited: all interpolated values are dev-authored constants (HYPE_CAMPAIGNS data, emoji).

import { formatNumber } from "../game/format.js";
import {
  campaignVisible,
  campaignNextCost,
  campaignAtCap,
  campaignHypeGain,
  maxMarketingLevel,
} from "../game/hype.js";

import { HYPE_CAMPAIGNS } from "../data/hype.js";
import { purchaseRevealed } from "../game/unlocks.js";
import { marketingLevel } from "../game/levels.js";
import { flashCard } from "./render.js";
import { cardCopyMarkup, hypeEffectLine } from "../game/cardCopy.js";
/**
 * @typedef {object} CardRefs
 * @property {HTMLElement} root
 * @property {HTMLElement} title
 * @property {HTMLElement} count
 * @property {HTMLElement} cost
 * @property {HTMLElement|null} effectEl
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
      `<div class="card__title" data-title>${def.name}</div>` +
      `<div class="card__copy">${cardCopyMarkup(hypeEffectLine(def), def.flavour)}</div>` +
    `</div>` +
    `<button class="card__buy" type="button" data-buy aria-label="Launch ${def.name}">` +
      `<span class="card__count" data-count hidden></span>` +
      `<span class="card__cost" data-cost>—</span>` +
    `</button>`;

  const btn = /** @type {HTMLButtonElement} */ (li.querySelector("[data-buy]"));

  /** @type {CardRefs} */

  const refs = {
    root: li,

    title: /** @type {HTMLElement} */ (li.querySelector("[data-title]")),

    count: /** @type {HTMLElement} */ (li.querySelector("[data-count]")),

    cost: /** @type {HTMLElement} */ (li.querySelector("[data-cost]")),
    effectEl: li.querySelector(".card__effect"),
    btn,
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (onBuy(def.id)) flashCard(refs.root);
  });
  li.addEventListener("click", () => {
    if (refs.btn.disabled) return;
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
    const level = marketingLevel(s.meta, def.id);
    const atCap = campaignAtCap(def, level);
    const nextCost = campaignNextCost(def, level);
    const visible = campaignVisible(s.meta, def)
      && purchaseRevealed(s.coins, nextCost, level > 0);
    let refs = cards.get(def.id);
    if (!visible) {
      if (refs) refs.root.style.display = "none";
      continue;
    }

    if (!refs) refs = createCard(def);
    refs.root.style.display = "";
    anyVisible = true;
    if (refs.effectEl) refs.effectEl.textContent = hypeEffectLine(def, level);
    const nextGain = campaignHypeGain(def, level + 1);
    if (def.purchaseMode === "level") {
      const max = maxMarketingLevel(def);
      refs.title.textContent = `${def.name} Lv ${level}/${max}`;
      refs.count.hidden = false;
      refs.count.textContent = `+${formatNumber(nextGain, 0)}`;
    } else {
      refs.title.textContent = def.name;
      refs.count.hidden = false;
      refs.count.textContent = level > 0
        ? `×${formatNumber(level, 0)} +${formatNumber(nextGain, 0)}`
        : `+${formatNumber(nextGain, 0)}`;
    }

    if (atCap) {
      refs.cost.textContent = "Max";
      refs.btn.disabled = true;
      refs.root.classList.remove("is-affordable");
      continue;
    }

    refs.cost.textContent = "🪙 " + formatNumber(nextCost, 0);
    const affordable = s.coins >= nextCost;
    refs.btn.disabled = !affordable;
    refs.root.classList.toggle("is-affordable", affordable);
    refs.btn.setAttribute("aria-label", `Launch ${def.name} for ${formatNumber(nextCost, 0)} coins`);
  }

  if (emptyEl) emptyEl.style.display = anyVisible ? "none" : "";
}
