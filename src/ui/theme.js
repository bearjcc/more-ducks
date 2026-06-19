// @ts-check

/** @type {MediaQueryList|null} */
let darkMq = null;
/** @type {(() => void)|null} */
let mqHandler = null;

/**
 * @param {"day"|"night"|"system"} pref
 * @returns {"day"|"night"}
 */
export function resolveTimeOfDay(pref) {
  if (pref === "day") return "day";
  if (pref === "night") return "night";
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches
    ? "night"
    : "day";
}

/** Sync browser chrome colour from the current --sky-1 token. */
export function syncThemeColor() {
  const theme = getComputedStyle(document.body).getPropertyValue("--sky-1").trim();
  if (!theme) return;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme);
}

/** @type {(() => void)|null} */
let themeColorSyncHandler = null;
let themeBooted = false;

function scheduleThemeColorSync() {
  const root = document.documentElement;
  const duration = getComputedStyle(root).getPropertyValue("--theme-duration").trim();
  if (duration === "0s") {
    syncThemeColor();
    return;
  }
  if (themeColorSyncHandler) {
    root.removeEventListener("transitionend", themeColorSyncHandler);
  }
  themeColorSyncHandler = (e) => {
    if (e.target !== root || e.propertyName !== "--sky-1") return;
    syncThemeColor();
    root.removeEventListener("transitionend", themeColorSyncHandler);
    themeColorSyncHandler = null;
  };
  root.addEventListener("transitionend", themeColorSyncHandler);
}

/**
 * @param {"day"|"night"|"system"} pref
 */
export function applyTimeOfDay(pref) {
  const instant = !themeBooted;
  themeBooted = true;
  if (instant) document.documentElement.classList.add("theme-instant");

  const resolved = resolveTimeOfDay(pref);
  document.documentElement.dataset.time = resolved;
  document.documentElement.style.colorScheme = resolved === "night" ? "dark" : "light";

  if (instant) {
    syncThemeColor();
    requestAnimationFrame(() => document.documentElement.classList.remove("theme-instant"));
  } else {
    scheduleThemeColorSync();
  }
  updateTimeToggle(resolved);

  if (pref === "system") {
    if (!darkMq && typeof matchMedia === "function") {
      darkMq = matchMedia("(prefers-color-scheme: dark)");
      mqHandler = () => applyTimeOfDay("system");
      darkMq.addEventListener("change", mqHandler);
    }
  } else if (darkMq && mqHandler) {
    darkMq.removeEventListener("change", mqHandler);
    darkMq = null;
    mqHandler = null;
  }
}

/**
 * Flip resolved appearance; leaves system mode when used.
 * @param {import("../game/meta.js").Settings} settings
 */
export function toggleTimeOfDay(settings) {
  settings.timeOfDay = resolveTimeOfDay(settings.timeOfDay) === "day" ? "night" : "day";
}

/**
 * @param {"day"|"night"} resolved
 */
function updateTimeToggle(resolved) {
  const btn = document.getElementById("time-toggle");
  if (!btn) return;
  const toNight = resolved === "day";
  btn.textContent = toNight ? "\u{1F319}" : "\u{2600}\u{FE0F}";
  btn.setAttribute("aria-label", toNight ? "Switch to night" : "Switch to day");
  btn.setAttribute("title", toNight ? "Night mode" : "Day mode");
}

/**
 * @param {{
 *   meta: import("../game/meta.js").Meta,
 *   onChange: () => void,
 * }} ctx
 */
export function initTimeToggle(ctx) {
  const btn = document.getElementById("time-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    toggleTimeOfDay(ctx.meta.settings);
    ctx.onChange();
    const select = /** @type {HTMLSelectElement|null} */ (document.getElementById("set-time"));
    if (select) select.value = ctx.meta.settings.timeOfDay;
  });
}
