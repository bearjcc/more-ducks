// @ts-check
// aislop-ignore-file security/innerhtml -- audited: all interpolated values are dev-authored constants (ALL_UPGRADES data, emoji).

import { formatNumber } from "../game/format.js";
import { ALL_UPGRADES, upgradeNextCost, upgradeAtCap, maxLevelFor } from "../game/upgrades.js";
import { purchaseRevealed, upgradesTabUnlocked } from "../game/unlocks.js";
import { upgradeLevel } from "../game/levels.js";
import { flashCard } from "./render.js";
/**
 * @typedef {object} UpgRefs
 * @property {HTMLElement} root
 * @property {HTMLElement} title
 * @property {HTMLElement} count
 * @property {HTMLElement} cost
 * @property {HTMLButtonElement} btn
 */

/** @type {Map<string, UpgRefs>} */

const cards = new Map();

/** @type {HTMLElement|null} */ let listEl = null;

/** @type {HTMLElement|null} */ let emptyEl = null;

/** @type {(id: string) => boolean} */ let onBuy = () => false;

/**
 * @param {{ onBuy: (id: string) => boolean }} handlers
 */

export function initUpgrades(handlers) {
  listEl = document.getElementById("upgrade-list");
  emptyEl = document.getElementById("upgrades-empty");
  onBuy = handlers.onBuy;
}

/**
 * @param {import("../data/upgrades.js").UpgradeDef} def
 * @param {HTMLElement|null} container
 * @returns {UpgRefs}
 */

function createCard(def, container) {
  const li = document.createElement("li");
  li.className = "card";
  li.innerHTML =
    `<div class="card__icon" aria-hidden="true">${def.emoji}</div>` +
    `<div class="card__body">` +
      `<div class="card__title" data-title>${def.name}</div>` +
      `<div class="card__blurb">${def.blurb}</div>` +
    `</div>` +
    `<button class="card__buy" type="button" data-buy aria-label="Buy ${def.name}">` +
      `<span class="card__count" data-count hidden></span>` +
      `<span class="card__cost" data-cost>—</span>` +
    `</button>`;

  const btn = /** @type {HTMLButtonElement} */ (li.querySelector("[data-buy]"));

  /** @type {UpgRefs} */

  const refs = {
    root: li,

    title: /** @type {HTMLElement} */ (li.querySelector("[data-title]")),

    count: /** @type {HTMLElement} */ (li.querySelector("[data-count]")),

    cost: /** @type {HTMLElement} */ (li.querySelector("[data-cost]")),
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
  if (container) container.appendChild(li);
  return refs;
}

/**
 * @param {{ engine: any, meta: import("../game/meta.js").Meta, coins: number }} s
 */

export function updateUpgrades(s) {
  let anyVisible = false;
  for (const def of ALL_UPGRADES) {
    const level = upgradeLevel(s.meta, def.id);
    const atCap = upgradeAtCap(def, level);
    const nextCost = upgradeNextCost(def, level);
    const teaserFirst =
      def.id === "steadybeak" && upgradesTabUnlocked(s.meta) && level === 0;
    const visible = teaserFirst
      || ((def.era <= s.meta.era || level > 0)
        && purchaseRevealed(s.coins, nextCost, level > 0));
    let refs = cards.get(def.id);
    if (!visible) {
      if (refs) refs.root.style.display = "none";
      continue;
    }

    if (!refs) refs = createCard(def, listEl);
    refs.root.style.display = "";
    anyVisible = true;
    refs.root.classList.toggle("is-owned", atCap && def.purchaseMode === "once");
    if (def.purchaseMode === "level") {
      const max = maxLevelFor(def);
      refs.title.textContent = `${def.name} Lv ${level}/${max}`;
      refs.count.hidden = true;
    } else if (def.purchaseMode === "quantity" && level > 0) {
      refs.title.textContent = def.name;
      refs.count.hidden = false;
      refs.count.textContent = `×${formatNumber(level, 0)}`;
    } else {
      refs.title.textContent = def.name;
      refs.count.hidden = true;
    }

    if (atCap) {
      refs.cost.textContent = def.purchaseMode === "once" ? "✓ Owned" : "Max";
      refs.btn.disabled = true;
      refs.root.classList.remove("is-affordable");
      continue;
    }

    refs.cost.textContent = "🪙 " + formatNumber(nextCost, 0);
    const affordable = s.coins >= nextCost;
    refs.btn.disabled = !affordable;
    refs.root.classList.toggle("is-affordable", affordable);
  }

  if (emptyEl) emptyEl.style.display = anyVisible ? "none" : "";
}
