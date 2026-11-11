// @ts-check
// aislop-ignore-file security/innerhtml -- audited: settings templates are static option lists; no user data interpolated.
import { setNotation } from "../game/format.js";
import { mergeSettings } from "../game/meta.js";
import { exportSaveText, importSaveText } from "../game/save.js";
import { setBuyMode } from "./shop.js";
import { setReduceMotionPref } from "./render.js";
import { applyAudioSettings } from "../game/sfx.js";
import { applyTimeOfDay } from "./theme.js";
import { mountAboutPanel, showAbout } from "./about.js";
/** @type {import("../game/meta.js").Settings} */
let current = mergeSettings();

/** @type {HTMLElement|null} */ let overlay = null;
/** @type {HTMLButtonElement|null} */ let gearBtn = null;
let settingsOpen = false;

function initSettingsShell() {
  overlay = document.createElement("div");
  overlay.className = "modal-overlay settings-overlay";
  overlay.hidden = true;
  overlay.innerHTML =
    `<div class="settings-modal modal" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">` +
      `<div class="settings-modal__head">` +
        `<button id="settings-about-back" class="settings-modal__back" type="button" hidden aria-label="Back to settings">←</button>` +
        `<h2 id="settings-modal-title" class="settings-modal__title">Settings</h2>` +
        `<button class="settings-modal__close" type="button" aria-label="Close settings">×</button>` +
      `</div>` +
      `<div class="settings-modal__panes">` +
        `<div id="settings-root" class="settings settings-modal__body"></div>` +
      `</div>` +
    `</div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSettings(); });
  overlay.querySelector(".settings-modal__close")?.addEventListener("click", closeSettings);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && settingsOpen) closeSettings();
  });
}

/** @param {HTMLButtonElement|null} btn */
export function bindSettingsGear(btn) {
  gearBtn = btn;
  btn?.addEventListener("click", toggleSettings);
}

export function openSettings() {
  if (!overlay || settingsOpen) return;
  showAbout(false);
  settingsOpen = true;
  overlay.hidden = false;
  gearBtn?.classList.add("is-active");
  /** @type {HTMLButtonElement|null} */ (overlay.querySelector(".settings-modal__close"))?.focus();
}

export function closeSettings() {
  if (!overlay || !settingsOpen) return;
  settingsOpen = false;
  overlay.hidden = true;
  gearBtn?.classList.remove("is-active");
}

export function toggleSettings() {
  if (settingsOpen) closeSettings();
  else openSettings();
}

/**
 * @param {import("../game/meta.js").Settings} settings
 */
export function applySettings(settings) {
  current = mergeSettings(settings);
  setNotation(current.notation);
  setBuyMode(current.buyMode);
  setReduceMotionPref(current.reduceMotion);
  applyAudioSettings(current);
  applyTimeOfDay(current.timeOfDay);
  document.body.classList.toggle("force-reduce-motion", current.reduceMotion === true);
  document.body.classList.toggle("force-motion", current.reduceMotion === false);
}

/** @returns {import("../game/meta.js").Settings} */
export function getSettings() {
  return current;
}

const SETTINGS_HTML =
  `<section class="settings__block">` +
    `<h2 class="settings__heading">Display</h2>` +
    `<label class="settings__row">` +
      `<span>Number notation</span>` +
      `<select id="set-notation" class="settings__select">` +
        `<option value="suffix">Suffix (1.5M, 1.5aa)</option>` +
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
      `<input id="set-mute" type="checkbox" />` +
      `<span>Mute all audio</span>` +
    `</label>` +
    `<label class="settings__row settings__row--check">` +
      `<input id="set-sfx" type="checkbox" />` +
      `<span>Sound effects</span>` +
    `</label>` +
    `<label class="settings__row">` +
      `<span>SFX volume</span>` +
      `<input id="set-sfx-vol" class="settings__range" type="range" min="0" max="100" step="1" />` +
    `</label>` +
    `<label class="settings__row settings__row--check">` +
      `<input id="set-ambience" type="checkbox" />` +
      `<span>Ambience</span>` +
    `</label>` +
    `<label class="settings__row">` +
      `<span>Ambience volume</span>` +
      `<input id="set-amb-vol" class="settings__range" type="range" min="0" max="100" step="1" />` +
    `</label>` +
    `<label class="settings__row settings__row--check">` +
      `<input id="set-music" type="checkbox" />` +
      `<span>Music</span>` +
    `</label>` +
    `<label class="settings__row">` +
      `<span>Music volume</span>` +
      `<input id="set-music-vol" class="settings__range" type="range" min="0" max="100" step="1" />` +
    `</label>` +
  `</section>` +
  `<section class="settings__block">` +
    `<button id="set-about" type="button" class="settings__btn settings__nav-btn">About</button>` +
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

/**
 * @param {{
 *   meta: import("../game/meta.js").Meta,
 *   engine: any,
 *   onImport: () => void,
 * }} ctx
 */
export function initSettings(ctx) {
  initSettingsShell();
  const root = document.getElementById("settings-root");
  if (!root) return;
  root.innerHTML = SETTINGS_HTML;

  const notationEl = /** @type {HTMLSelectElement} */ (root.querySelector("#set-notation"));
  const timeEl = /** @type {HTMLSelectElement} */ (root.querySelector("#set-time"));
  const motionEl = /** @type {HTMLSelectElement} */ (root.querySelector("#set-motion"));
  const sfxEl = /** @type {HTMLInputElement} */ (root.querySelector("#set-sfx"));
  const muteEl = /** @type {HTMLInputElement} */ (root.querySelector("#set-mute"));
  const ambEl = /** @type {HTMLInputElement} */ (root.querySelector("#set-ambience"));
  const musicEl = /** @type {HTMLInputElement} */ (root.querySelector("#set-music"));
  const sfxVolEl = /** @type {HTMLInputElement} */ (root.querySelector("#set-sfx-vol"));
  const ambVolEl = /** @type {HTMLInputElement} */ (root.querySelector("#set-amb-vol"));
  const musicVolEl = /** @type {HTMLInputElement} */ (root.querySelector("#set-music-vol"));
  const statusEl = root.querySelector("#set-status");
  const modal = overlay?.querySelector(".settings-modal");
  const panes = overlay?.querySelector(".settings-modal__panes");
  if (modal && root && panes) {
    mountAboutPanel({
      shell: /** @type {HTMLElement} */ (modal),
      panes: /** @type {HTMLElement} */ (panes),
      settingsBody: root,
      onBack: () => {
        /** @type {HTMLButtonElement|null} */ (overlay?.querySelector(".settings-modal__close"))?.focus();
      },
    });
  }
  root.querySelector("#set-about")?.addEventListener("click", () => showAbout(true));

  /** @param {import("../game/meta.js").Settings} s */
  function syncControls(s) {
    notationEl.value = s.notation;
    timeEl.value = s.timeOfDay;
    motionEl.value = s.reduceMotion === true ? "on" : s.reduceMotion === false ? "off" : "system";
    sfxEl.checked = s.sfx;
    muteEl.checked = s.masterMute;
    ambEl.checked = s.ambience;
    musicEl.checked = s.music;
    sfxVolEl.value = String(Math.round(s.sfxVolume * 100));
    ambVolEl.value = String(Math.round(s.ambienceVolume * 100));
    musicVolEl.value = String(Math.round(s.musicVolume * 100));
  }

  syncControls(ctx.meta.settings);
  bindDisplayControls(ctx.meta.settings, {
    notationEl, timeEl, motionEl, sfxEl, muteEl, ambEl, musicEl, sfxVolEl, ambVolEl, musicVolEl,
  });
  bindSaveData(root, ctx, statusEl, () => syncControls(ctx.meta.settings));
}

/**
 * @param {import("../game/meta.js").Settings} settings
 * @param {{
 *   notationEl: HTMLSelectElement, timeEl: HTMLSelectElement, motionEl: HTMLSelectElement,
 *   sfxEl: HTMLInputElement, muteEl: HTMLInputElement, ambEl: HTMLInputElement, musicEl: HTMLInputElement,
 *   sfxVolEl: HTMLInputElement, ambVolEl: HTMLInputElement, musicVolEl: HTMLInputElement,
 * }} els
 */
function bindDisplayControls(settings, els) {
  els.notationEl.addEventListener("change", () => {
    settings.notation = /** @type {any} */ (els.notationEl.value);
    applySettings(settings);
  });
  els.motionEl.addEventListener("change", () => {
    const v = els.motionEl.value;
    settings.reduceMotion = v === "on" ? true : v === "off" ? false : null;
    applySettings(settings);
  });
  els.timeEl.addEventListener("change", () => {
    settings.timeOfDay = /** @type {any} */ (els.timeEl.value);
    applySettings(settings);
  });
  els.sfxEl.addEventListener("change", () => {
    settings.sfx = els.sfxEl.checked;
    applySettings(settings);
    unlockOnSlider(els.sfxEl);
  });
  els.muteEl.addEventListener("change", () => {
    settings.masterMute = els.muteEl.checked;
    applySettings(settings);
  });
  els.ambEl.addEventListener("change", () => {
    settings.ambience = els.ambEl.checked;
    applySettings(settings);
  });
  els.musicEl.addEventListener("change", () => {
    settings.music = els.musicEl.checked;
    applySettings(settings);
  });
  const bindVol = (el, key) => {
    el.addEventListener("input", () => {
      settings[key] = Number(el.value) / 100;
      applySettings(settings);
      unlockOnSlider(el);
    });
  };
  bindVol(els.sfxVolEl, "sfxVolume");
  bindVol(els.ambVolEl, "ambienceVolume");
  bindVol(els.musicVolEl, "musicVolume");
}

/** @param {HTMLElement} el */
function unlockOnSlider(el) {
  import("../game/sfx.js").then((m) => m.unlockAudio(true)).catch(() => {});
}

/**
 * @param {HTMLElement} root
 * @param {{ meta: import("../game/meta.js").Meta, engine: any, onImport: () => void }} ctx
 * @param {Element|null} statusEl
 * @param {() => void} syncControls
 */
function bindSaveData(root, ctx, statusEl, syncControls) {
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
    syncControls();
    setStatus(statusEl, "Save imported — reloading…");
    ctx.onImport();
    setTimeout(() => location.reload(), 400);
  });
}

/** @param {Element|null} el @param {string} msg */
function setStatus(el, msg) {
  if (el) el.textContent = msg;
}
