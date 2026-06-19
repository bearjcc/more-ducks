// @ts-check
import { setNotation } from "../game/format.js";
import { mergeSettings } from "../game/meta.js";
import { exportSaveText, importSaveText } from "../game/save.js";
import { setBuyMode } from "./shop.js";
import { setReduceMotionPref } from "./render.js";
import { setSfxEnabled } from "../game/sfx.js";
import { applyTimeOfDay } from "./theme.js";

/** @type {import("../game/meta.js").Settings} */
let current = mergeSettings();

/**
 * @param {import("../game/meta.js").Settings} settings
 */
export function applySettings(settings) {
  current = mergeSettings(settings);
  setNotation(current.notation);
  setBuyMode(current.buyMode);
  setReduceMotionPref(current.reduceMotion);
  setSfxEnabled(current.sfx);
  applyTimeOfDay(current.timeOfDay);
  document.body.classList.toggle("force-reduce-motion", current.reduceMotion === true);
  document.body.classList.toggle("force-motion", current.reduceMotion === false);
}

/** @returns {import("../game/meta.js").Settings} */
export function getSettings() {
  return current;
}

/**
 * @param {{
 *   meta: import("../game/meta.js").Meta,
 *   engine: any,
 *   onImport: () => void,
 * }} ctx
 */
export function initSettings(ctx) {
  const root = document.getElementById("settings-root");
  if (!root) return;

  root.innerHTML =
    `<section class="settings__block">` +
      `<h2 class="settings__heading">Display</h2>` +
      `<label class="settings__row">` +
        `<span>Number notation</span>` +
        `<select id="set-notation" class="settings__select">` +
          `<option value="word">Words (1.5 million)</option>` +
          `<option value="compact">Compact (1.5M)</option>` +
          `<option value="scientific">Scientific (1.5e6)</option>` +
        `</select>` +
      `</label>` +
      `<label class="settings__row">` +
        `<span>Time of day</span>` +
        `<select id="set-time" class="settings__select">` +
          `<option value="system">System default</option>` +
          `<option value="day">Day</option>` +
          `<option value="night">Night</option>` +
        `</select>` +
      `</label>` +
      `<label class="settings__row">` +
        `<span>Reduce motion</span>` +
        `<select id="set-motion" class="settings__select">` +
          `<option value="system">System default</option>` +
          `<option value="on">Always reduce</option>` +
          `<option value="off">Allow animations</option>` +
        `</select>` +
      `</label>` +
    `</section>` +
    `<section class="settings__block">` +
      `<h2 class="settings__heading">Sound</h2>` +
      `<label class="settings__row settings__row--check">` +
        `<input id="set-sfx" type="checkbox" />` +
        `<span>Sound effects</span>` +
      `</label>` +
    `</section>` +
    `<section class="settings__block">` +
      `<h2 class="settings__heading">Save data</h2>` +
      `<p class="settings__hint">Copy your save to another device, or paste one in to restore.</p>` +
      `<div class="settings__actions">` +
        `<button id="set-export" class="settings__btn" type="button">Copy save to clipboard</button>` +
        `<button id="set-download" class="settings__btn" type="button">Download save</button>` +
      `</div>` +
      `<textarea id="set-import" class="settings__textarea" rows="4" placeholder="Paste save JSON here…"></textarea>` +
      `<button id="set-import-btn" class="settings__btn settings__btn--primary" type="button">Import save</button>` +
      `<p id="set-status" class="settings__status" role="status"></p>` +
    `</section>`;

  const notationEl = /** @type {HTMLSelectElement} */ (root.querySelector("#set-notation"));
  const timeEl = /** @type {HTMLSelectElement} */ (root.querySelector("#set-time"));
  const motionEl = /** @type {HTMLSelectElement} */ (root.querySelector("#set-motion"));
  const sfxEl = /** @type {HTMLInputElement} */ (root.querySelector("#set-sfx"));
  const statusEl = root.querySelector("#set-status");

  syncControls(ctx.meta.settings);

  notationEl.addEventListener("change", () => {
    ctx.meta.settings.notation = /** @type {any} */ (notationEl.value);
    applySettings(ctx.meta.settings);
  });
  motionEl.addEventListener("change", () => {
    const v = motionEl.value;
    ctx.meta.settings.reduceMotion = v === "on" ? true : v === "off" ? false : null;
    applySettings(ctx.meta.settings);
  });
  timeEl.addEventListener("change", () => {
    ctx.meta.settings.timeOfDay = /** @type {any} */ (timeEl.value);
    applySettings(ctx.meta.settings);
  });
  sfxEl.addEventListener("change", () => {
    ctx.meta.settings.sfx = sfxEl.checked;
    applySettings(ctx.meta.settings);
  });

  root.querySelector("#set-export")?.addEventListener("click", async () => {
    const text = exportSaveText(ctx.engine, ctx.meta);
    try {
      await navigator.clipboard.writeText(text);
      setStatus(statusEl, "Save copied to clipboard.");
    } catch {
      setStatus(statusEl, "Could not copy — try Download instead.");
    }
  });

  root.querySelector("#set-download")?.addEventListener("click", () => {
    const text = exportSaveText(ctx.engine, ctx.meta);
    const blob = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "more-ducks-save.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus(statusEl, "Save downloaded.");
  });

  root.querySelector("#set-import-btn")?.addEventListener("click", () => {
    const raw = /** @type {HTMLTextAreaElement} */ (root.querySelector("#set-import")).value.trim();
    if (!raw) {
      setStatus(statusEl, "Paste save JSON first.");
      return;
    }
    const result = importSaveText(ctx.engine, ctx.meta, raw);
    if (!result.ok) {
      setStatus(statusEl, result.error || "Import failed.");
      return;
    }
    applySettings(ctx.meta.settings);
    syncControls(ctx.meta.settings);
    setStatus(statusEl, "Save imported — reloading…");
    ctx.onImport();
    setTimeout(() => location.reload(), 400);
  });

  /** @param {import("../game/meta.js").Settings} s */
  function syncControls(s) {
    notationEl.value = s.notation;
    timeEl.value = s.timeOfDay;
    motionEl.value = s.reduceMotion === true ? "on" : s.reduceMotion === false ? "off" : "system";
    sfxEl.checked = s.sfx;
  }
}

/** @param {Element|null} el @param {string} msg */
function setStatus(el, msg) {
  if (el) el.textContent = msg;
}
