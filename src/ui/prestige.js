// @ts-check
import { formatNumber } from "../game/format.js";
import {
  canPrestige,
  citationsEarnedThisRun,
  citationsMult,
  CITATION_MULT_STEP,
  performPrestige,
} from "../game/prestige.js";
import { queueModal } from "./modal.js";
import { applyEra, logMessage } from "./render.js";

/** @type {HTMLElement|null} */
let root = null;
/** @type {HTMLButtonElement|null} */
let btn = null;
/** @type {HTMLElement|null} */
let citeEl = null;
/** @type {(() => void)|null} */
let onPrestige = null;

/**
 * @param {{ onPrestige: () => void }} handlers
 */
export function initPrestige(handlers) {
  onPrestige = handlers.onPrestige;
  root = document.getElementById("prestige-section");
  btn = /** @type {HTMLButtonElement|null} */ (document.getElementById("prestige-btn"));
  citeEl = document.getElementById("prestige-citations");
  if (btn) btn.addEventListener("click", openConfirm);
}

/**
 * @param {{ engine: any, meta: import("../game/meta.js").Meta, mods: import("../game/upgrades.js").Mods }} ctx
 */
export function updatePrestige(ctx) {
  const { meta } = ctx;
  if (!root || !btn || !citeEl) return;
  const unlocked = canPrestige(meta);
  root.hidden = !(unlocked || meta.prestigeCount > 0 || meta.citations > 0);
  btn.disabled = !unlocked;
  const mult = citationsMult(meta);
  const pct = Math.round((mult - 1) * 100);
  citeEl.textContent = meta.prestigeCount > 0 || meta.citations > 0
    ? `${formatNumber(meta.citations)} citations · +${pct}% income`
    : "Ship vNext to bank permanent citations.";
}

function openConfirm() {
  if (!btn || btn.disabled) return;
  const ctx = /** @type {any} */ (btn).__prestigeCtx;
  if (!ctx) return;
  const { engine, meta, mods } = ctx;
  const earned = citationsEarnedThisRun(meta);
  const first = meta.prestigeCount === 0;
  const lines = [
    "Reset coins, ducks, producers, upgrades, and the pond.",
    "Keep Duckdex, Quackmarks, and lifetime stats.",
    `Earn +${formatNumber(earned)} citation${earned === 1 ? "" : "s"} (+${Math.round(CITATION_MULT_STEP * 100)}% income each, permanent).`,
  ];
  if (first) lines.push("First ship unlocks Pondering Mode.");
  queueModal({
    emoji: "🚀",
    title: "Ship vNext",
    body: lines.join(" "),
    button: "Ship it",
    onClose: () => {
      const result = performPrestige(engine, meta, mods);
      if (!result.ok) return;
      applyEra(meta.era);
      logMessage(
        `Shipped model v${meta.prestigeCount}. +${formatNumber(result.citationsEarned ?? 0)} citations.` +
          (result.firstPonder ? " Pondering Mode unlocked." : ""),
        true,
      );
      if (onPrestige) onPrestige();
    },
  });
}

/**
 * Stash live ctx on the button each frame (avoids closure staleness).
 * @param {{ engine: any, meta: import("../game/meta.js").Meta, mods: import("../game/upgrades.js").Mods }} ctx
 */
export function bindPrestigeCtx(ctx) {
  if (btn) /** @type {any} */ (btn).__prestigeCtx = ctx;
}
