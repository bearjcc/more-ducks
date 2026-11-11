// @ts-check
// aislop-ignore-file security/innerhtml -- audited: settings templates are static; no user data interpolated.
import { setNotation } from "../game/format.js";
import { mergeSettings } from "../game/meta.js";
import { exportSaveText, importSaveText, clearSave } from "../game/save.js";
import { setBuyMode } from "./shop.js";
import { setReduceMotionPref } from "./render.js";
import { applyAudioSettings } from "../game/sfx.js";
import { applyTimeOfDay } from "./theme.js";
import { mountAboutPanel, showAbout } from "./about.js";
import { gameWindowMarkup } from "./gameWindow.js";
import { showConfirm } from "./confirm.js";
import {
  iconGear,
  iconSpeaker,
  iconMusic,
  iconWaves,
  iconMute,
  iconSun,
  iconMoon,
  iconAuto,
  iconHash,
  iconMotion,
  iconInfo,
  iconCopy,
  iconDownload,
  iconPaste,
  iconTrash,
} from "./icons.js";

/** @type {import("../game/meta.js").Settings} */
let current = mergeSettings();

/** @type {HTMLElement|null} */ let overlay = null;
/** @type {HTMLButtonElement|null} */ let gearBtn = null;
/** @type {HTMLElement|null} */ let headerIconEl = null;
let settingsOpen = false;

const NOTATION_LABEL = { suffix: "Suffix", scientific: "Scientific" };
const NOTATION_SAMPLE = { suffix: "1.5aa", scientific: "1.5e15" };
const TIME_ORDER = /** @type {const} */ (["system", "day", "night"]);
const TIME_LABEL = { system: "System", day: "Day", night: "Night" };
const MOTION_ORDER = /** @type {const} */ (["system", "on", "off"]);
const MOTION_LABEL = { system: "System", on: "Reduced", off: "Full motion" };

/** @param {number} steps @returns {string} */
function pipRow(id, steps = 5) {
  const pips = Array.from({ length: steps }, (_, i) =>
    `<button type="button" class="gw-pip" data-step="${i}" aria-label="Level ${i + 1} of ${steps}"></button>`,
  ).join("");
  return `<div class="gw-pips" id="${id}" role="slider" aria-valuemin="0" aria-valuemax="${steps - 1}" tabindex="0">${pips}</div>`;
}

/** @param {string} id @param {string} label @param {string} icon @param {string} [tone] @param {boolean} [vol] */
function audioTile(id, label, icon, tone = "sfx", vol = true) {
  const muteCls = tone === "mute" ? " gw-tile--mute" : "";
  return (
    `<div class="gw-audio-frame gw-audio-frame--${tone}">` +
      `<button type="button" id="${id}" class="gw-tile gw-tile--audio${muteCls}" aria-pressed="true">` +
        `<span class="gw-tile__icon">${icon}<span class="gw-tile__offmark" aria-hidden="true"></span></span>` +
        `<span class="gw-tile__label">${label}</span>` +
        `<span class="gw-tile__state" aria-hidden="true">On</span>` +
      `</button>` +
      (vol
        ? `<div class="gw-tile__voltrack" aria-hidden="false">${pipRow(`${id}-vol`)}</div>`
        : "") +
    `</div>`
  );
}

/** @param {string} id @param {string} label @param {string} icon @param {string} value */
function cycleTile(id, label, icon, value) {
  return (
    `<button type="button" id="${id}" class="gw-tile gw-tile--cycle" aria-label="${label}">` +
      `<span class="gw-tile__icon">${icon}</span>` +
      `<span class="gw-tile__label">${label}</span>` +
      `<span class="gw-tile__preview" aria-live="polite">${value}</span>` +
    `</button>`
  );
}

/** @param {string} id @param {string} label @param {string} icon @param {string} [extraClass] */
function actionBtn(id, label, icon, extraClass = "") {
  return (
    `<button type="button" id="${id}" class="gw-action ${extraClass}">` +
      `<span class="gw-action__icon">${icon}</span>` +
      `<span class="gw-action__label">${label}</span>` +
    `</button>`
  );
}

const SETTINGS_BODY =
  `<div id="settings-root" class="settings settings-modal__body">` +
    `<section class="settings__section">` +
      `<h3 class="settings__section-title">Sound</h3>` +
      `<div class="gw-tile-row gw-tile-row--4" role="group" aria-label="Audio">` +
        audioTile("set-sfx-tile", "SFX", iconSpeaker(), "sfx") +
        audioTile("set-amb-tile", "Ambience", iconWaves(), "amb") +
        audioTile("set-music-tile", "Music", iconMusic(), "music") +
        audioTile("set-mute-tile", "Mute", iconMute(), "mute", false) +
      `</div>` +
    `</section>` +
    `<section class="settings__section">` +
      `<h3 class="settings__section-title">Display</h3>` +
      `<div class="gw-tile-row gw-tile-row--3" role="group" aria-label="Display">` +
        cycleTile("set-notation-tile", "Numbers", iconHash(), NOTATION_SAMPLE.suffix) +
        cycleTile("set-time-tile", "Time", iconSun(), TIME_LABEL.system) +
        cycleTile("set-motion-tile", "Motion", iconMotion(), MOTION_LABEL.system) +
      `</div>` +
    `</section>` +
    `<section class="settings__section">` +
      `<h3 class="settings__section-title">Data</h3>` +
      `<div class="gw-action-grid">` +
        actionBtn("set-about", "About", iconInfo()) +
        actionBtn("set-export", "Copy save", iconCopy()) +
        actionBtn("set-download", "Download save", iconDownload()) +
        actionBtn("set-paste-toggle", "Paste save", iconPaste()) +
        actionBtn("set-reset", "Reset save", iconTrash(), "gw-action--danger") +
      `</div>` +
      `<div id="set-import-panel" class="settings__import" hidden>` +
        `<textarea id="set-import" class="settings__textarea" rows="4" placeholder="Paste save JSON here…"></textarea>` +
        `<button id="set-import-btn" type="button" class="gamewin__btn gamewin__btn--primary settings__import-btn">Import save</button>` +
      `</div>` +
      `<p id="set-status" class="settings__status" role="status"></p>` +
    `</section>` +
  `</div>`;

function initSettingsShell() {
  overlay = document.createElement("div");
  overlay.className = "modal-overlay settings-overlay";
  overlay.hidden = true;
  const inner = gameWindowMarkup({
    title: "Settings",
    iconHtml: iconGear(),
    labelledBy: "settings-modal-title",
    extraClass: "settings-modal",
    bodySlot:
      `<div class="settings-modal__panes">` + SETTINGS_BODY + `</div>`,
  });
  overlay.innerHTML = inner;
  document.body.appendChild(overlay);
  headerIconEl = overlay.querySelector(".gamewin__icon");
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSettings(); });
  overlay.querySelector(".gamewin__close")?.addEventListener("click", closeSettings);
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
  /** @type {HTMLButtonElement|null} */ (overlay.querySelector(".gamewin__close"))?.focus();
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

  const modal = overlay?.querySelector(".gamewin");
  const panes = overlay?.querySelector(".settings-modal__panes");
  if (modal && root && panes) {
    mountAboutPanel({
      shell: /** @type {HTMLElement} */ (modal),
      panes: /** @type {HTMLElement} */ (panes),
      settingsBody: root,
      headerIcon: headerIconEl,
      onBack: () => {
        /** @type {HTMLButtonElement|null} */ (overlay?.querySelector(".gamewin__close"))?.focus();
      },
    });
  }

  const statusEl = root.querySelector("#set-status");

  /** @param {import("../game/meta.js").Settings} s */
  function syncControls(s) {
    setAudioTile("set-sfx-tile", s.sfx && !s.masterMute);
    setAudioTile("set-amb-tile", s.ambience && !s.masterMute);
    setAudioTile("set-music-tile", s.music && !s.masterMute);
    setMuteTile(s.masterMute);
    setPips("set-sfx-tile-vol", volStep(s.sfxVolume));
    setPips("set-amb-tile-vol", volStep(s.ambienceVolume));
    setPips("set-music-tile-vol", volStep(s.musicVolume));
    updateCycleTile("set-notation-tile", NOTATION_SAMPLE[s.notation]);
    const timeEl = document.getElementById("set-time-tile");
    if (timeEl) {
      const iconWrap = timeEl.querySelector(".gw-tile__icon");
      if (iconWrap) iconWrap.innerHTML = timeIcon(s.timeOfDay);
      updateCycleTile("set-time-tile", TIME_LABEL[s.timeOfDay]);
    }
    const motionKey = s.reduceMotion === true ? "on" : s.reduceMotion === false ? "off" : "system";
    updateCycleTile("set-motion-tile", MOTION_LABEL[motionKey]);
  }

  syncControls(ctx.meta.settings);
  bindSettingsControls(ctx.meta.settings, syncControls);
  bindSaveData(root, ctx, statusEl, () => syncControls(ctx.meta.settings));
  root.querySelector("#set-about")?.addEventListener("click", () => showAbout(true));
}

/** @param {number} v @returns {number} */
function volStep(v) {
  return Math.min(4, Math.round(v * 4));
}

/** @param {number} step @returns {number} */
function stepVol(step) {
  return step / 4;
}

/**
 * @param {string} tileId
 * @param {boolean} on
 */
function setAudioTile(tileId, on) {
  const el = document.getElementById(tileId);
  if (!el) return;
  el.setAttribute("aria-pressed", on ? "true" : "false");
  el.classList.toggle("gw-tile--off", !on);
  el.classList.toggle("gw-tile--on", on);
  const state = el.querySelector(".gw-tile__state");
  if (state) state.textContent = on ? "On" : "Off";
  el.closest(".gw-audio-frame")?.classList.toggle("gw-audio-frame--off", !on);
}

/** @param {boolean} masterMute */
function setMuteTile(masterMute) {
  const el = document.getElementById("set-mute-tile");
  if (!el) return;
  el.setAttribute("aria-pressed", masterMute ? "true" : "false");
  el.classList.toggle("gw-tile--mute-active", masterMute);
  el.classList.remove("gw-tile--off");
  el.classList.toggle("gw-tile--on", !masterMute);
  const state = el.querySelector(".gw-tile__state");
  if (state) state.textContent = masterMute ? "On" : "Off";
  const frame = el.closest(".gw-audio-frame");
  frame?.classList.remove("gw-audio-frame--off");
  frame?.classList.toggle("gw-audio-frame--mute-active", masterMute);
}

/** @param {string} pipId @param {number} step */
function setPips(pipId, step) {
  const row = document.getElementById(pipId);
  if (!row) return;
  row.setAttribute("aria-valuenow", String(step));
  row.setAttribute("aria-valuetext", `${Math.round((step / 4) * 100)}%`);
  const pips = row.querySelectorAll(".gw-pip");
  pips.forEach((p, i) => p.classList.toggle("is-on", i <= step));
}

/** @param {string} id @param {string} value */
function updateCycleTile(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const preview = el.querySelector(".gw-tile__preview");
  if (preview) preview.textContent = value;
}

/** @param {"system"|"day"|"night"} mode */
function timeIcon(mode) {
  if (mode === "night") return iconMoon();
  if (mode === "day") return iconSun();
  return iconAuto();
}

/**
 * @param {import("../game/meta.js").Settings} settings
 * @param {(s: import("../game/meta.js").Settings) => void} sync
 */
function bindSettingsControls(settings, sync) {
  bindToggleTile("set-sfx-tile", () => {
    settings.sfx = !settings.sfx;
    applySettings(settings);
    sync(settings);
    unlockAudio();
  });
  bindToggleTile("set-amb-tile", () => {
    settings.ambience = !settings.ambience;
    applySettings(settings);
    sync(settings);
  });
  bindToggleTile("set-music-tile", () => {
    settings.music = !settings.music;
    applySettings(settings);
    sync(settings);
  });
  bindToggleTile("set-mute-tile", () => {
    settings.masterMute = !settings.masterMute;
    applySettings(settings);
    sync(settings);
  });

  bindPips("set-sfx-tile-vol", (step) => {
    settings.sfxVolume = stepVol(step);
    applySettings(settings);
    sync(settings);
    unlockAudio();
  });
  bindPips("set-amb-tile-vol", (step) => {
    settings.ambienceVolume = stepVol(step);
    applySettings(settings);
    sync(settings);
  });
  bindPips("set-music-tile-vol", (step) => {
    settings.musicVolume = stepVol(step);
    applySettings(settings);
    sync(settings);
  });

  document.getElementById("set-notation-tile")?.addEventListener("click", () => {
    settings.notation = settings.notation === "suffix" ? "scientific" : "suffix";
    applySettings(settings);
    sync(settings);
  });
  document.getElementById("set-time-tile")?.addEventListener("click", () => {
    const i = TIME_ORDER.indexOf(settings.timeOfDay);
    settings.timeOfDay = TIME_ORDER[(i + 1) % TIME_ORDER.length];
    applySettings(settings);
    sync(settings);
  });
  document.getElementById("set-motion-tile")?.addEventListener("click", () => {
    const key = settings.reduceMotion === true ? "on" : settings.reduceMotion === false ? "off" : "system";
    const i = MOTION_ORDER.indexOf(key);
    const next = MOTION_ORDER[(i + 1) % MOTION_ORDER.length];
    settings.reduceMotion = next === "on" ? true : next === "off" ? false : null;
    applySettings(settings);
    sync(settings);
  });

  document.getElementById("set-paste-toggle")?.addEventListener("click", () => {
    const panel = /** @type {HTMLElement|null} */ (document.getElementById("set-import-panel"));
    if (!panel) return;
    const opening = panel.hidden;
    panel.hidden = !opening;
    panel.classList.toggle("is-open", opening);
    document.getElementById("set-paste-toggle")?.setAttribute("aria-expanded", opening ? "true" : "false");
    if (opening) /** @type {HTMLElement|null} */ (document.getElementById("set-import"))?.focus();
  });

  document.getElementById("set-reset")?.addEventListener("click", () => {
    showConfirm({
      title: "Reset save?",
      body: "This erases your pond on this device. Export first if you want to keep your progress.",
      okLabel: "Yes, reset",
      cancelLabel: "Keep playing",
      onConfirm: () => {
        clearSave();
        location.reload();
      },
    });
  });
}

/** @param {string} id @param {() => void} onToggle */
function bindToggleTile(id, onToggle) {
  document.getElementById(id)?.addEventListener("click", onToggle);
}

/** @param {string} pipId @param {(step: number) => void} onPick */
function bindPips(pipId, onPick) {
  const row = document.getElementById(pipId);
  if (!row) return;
  row.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const btn = t.closest(".gw-pip");
    if (!btn) return;
    const step = Number(btn.getAttribute("data-step"));
    if (!Number.isFinite(step)) return;
    onPick(step);
    e.stopPropagation();
  });
  row.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const cur = Number(row.getAttribute("aria-valuenow") || "4");
    const next = e.key === "ArrowRight" ? Math.min(4, cur + 1) : Math.max(0, cur - 1);
    onPick(next);
    e.preventDefault();
  });
}

function unlockAudio() {
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
