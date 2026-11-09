// @ts-check
// aislop-ignore-file security/innerhtml -- audited: all interpolated values are dev-authored constants (REGIONS data, emoji).
import { formatNumber } from "../game/format.js";
import { REGIONS } from "../data/regions.js";
import {
  totalRentPerDay,
} from "../game/regions.js";
import { flashCard } from "./render.js";
import { cardCopyMarkup, regionEffectLine } from "../game/cardCopy.js";
/** @type {HTMLElement|null} */ let listEl = null;
/** @type {(id: string, action: string) => boolean} */ let onAction = () => false;

/**
 * @param {{ onAction: (id: string, action: string) => boolean }} handlers
 */
export function initRegions(handlers) {
  listEl = document.getElementById("region-list");
  onAction = handlers.onAction;
}

/**
 * @param {{ engine: any, meta: import("../game/meta.js").Meta, era: number }} ctx
 */
export function updateRegions(ctx) {
  if (!listEl) return;
  if (ctx.era < 4) {
    listEl.replaceChildren();
    return;
  }

  listEl.replaceChildren();
  for (const r of REGIONS) {
    if (r.id === "home") continue;
    if (ctx.era < r.era) continue;
    const li = document.createElement("li");
    li.className = "card";
    const unlocked = ctx.meta.regionsUnlocked.includes(r.id);
    const rented = ctx.meta.regionsRented.includes(r.id);
    const flooded = r.id === "australia" && ctx.meta.australiaFlooded;
    const salt = r.id === "ocean" && ctx.meta.saltwaterDeployed;
    const orbital = r.id === "space" && ctx.meta.spaceDeployed;
    const saltwaterGate = r.requiresSaltwater && !ctx.meta.saltwaterDeployed;
    let action = "";
    let actionLabel = "";
    if (saltwaterGate) {
      action = "";
    } else if (!unlocked) {
      action = "unlock";
      actionLabel = formatNumber(r.unlockCost, 0) + " 🪙";
    } else if (r.orbital && !orbital) {
      action = "space";
      actionLabel = "Launch orbital ducks";
    } else if (r.saltwater && !salt) {
      action = "saltwater";
      actionLabel = "Deploy saltwater ducks";
    } else if (r.id === "australia" && !flooded) {
      action = "flood";
      actionLabel = formatNumber(r.floodCost ?? 0, 0) + " 🪙 flood";
    } else if (!r.saltwater && r.rentPerDay > 0 && !rented) {
      action = "rent";
      actionLabel = `Rent · ${formatNumber(r.rentPerDay, 0)} coins / game-day`;
    }

    li.innerHTML =
      `<span class="card__emoji" aria-hidden="true">${r.emoji}</span>` +
      `<div class="card__body">` +
        `<span class="card__title">${r.name}</span>` +
        `<div class="card__copy">${cardCopyMarkup(regionEffectLine(r), r.flavour)}</div>` +
        (rented && r.rentPerDay > 0
          ? `<span class="card__meta">Rented · ${formatNumber(r.rentPerDay, 0)} coins / game-day</span>`
          : "") +
        (rented && !action && r.rentPerDay === 0
          ? `<span class="card__meta">Owned</span>`
          : "") +
      `</div>` +
      (action
        ? `<button class="card__buy" type="button" data-region="${r.id}" data-action="${action}">${actionLabel}</button>`
        : `<span class="card__owned" aria-label="Active">✓</span>`);
    const btn = li.querySelector(".card__buy");
    if (btn) {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-region");
        const act = btn.getAttribute("data-action");
        if (id && act && onAction(id, act)) flashCard(li);
      });
    }
    listEl.appendChild(li);
  }

  const rent = totalRentPerDay(ctx.meta);
  if (rent > 0) {
    const note = document.createElement("p");
    note.className = "empty-hint";
    note.textContent = `Total rent: ${formatNumber(rent, 0)} coins / game-day`;
    listEl.appendChild(note);
  }
}
