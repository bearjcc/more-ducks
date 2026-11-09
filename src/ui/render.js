// @ts-check
// Intentionally one module: every function here shares the `els` DOM cache and the
// motion/pondering state below. Splitting would force a shared-state file or duplicate
// the cache, fragmenting cohesive render logic. Flat + single-purpose beats artificial seams.
import { formatNumber } from "../game/format.js";
import { ERAS } from "../data/eras.js";
import { syncThemeColor } from "./theme.js";
import {
  appendChatAnswer,
  appendChatExchange,
  appendChatThought,
  beginPonderExchange,
  updateChatAffordance,
} from "./chat.js";
import { applyActTier } from "./shell.js";
import {
  anyTabUnlocked,
  dashboardTabUnlocked,
  flockTabUnlocked,
  upgradesTabUnlocked,
  tabUnlocked,
} from "../game/unlocks.js";
import { showToast } from "./toast.js";
/** @type {Record<string, HTMLElement|null>} */
const els = {};
/** @type {boolean|null} */
let motionOverride = null;
/** @type {number} */
let lastHype = 0;
/** @type {number} */
let lastAnswersRate = 0;
let upgradesToastShown = false;
/** @type {import("../game/meta.js").Meta|null} */
let tabMeta = null;
/** Wide layout: open Stats once when the dock first appears. */
let wideDefaultTabOpened = false;

/** @param {boolean|null} pref null = system */
export function setReduceMotionPref(pref) {
  motionOverride = pref;
}

/** @returns {boolean} */
export function prefersReducedMotion() {
  if (motionOverride === true) return true;
  if (motionOverride === false) return false;
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Portrait bottom-sheet layout (matches main.css). */
function usesPortraitSheet() {
  if (typeof matchMedia !== "function") return false;
  return matchMedia("(max-aspect-ratio: 1/1), (max-width: 560px), (orientation: landscape) and (max-height: 520px)").matches;
}

/** @param {string} id */
function byId(id) {
  return document.getElementById(id);
}

/** Interval between streamed thoughts while holding (pondering mode). */
const PONDER_TICK_MS = 380;

/**
 * Pondering hold on duck avatar (post-Critical Mass). Streams thoughts while the
 * player holds, then resolves to an answer + coin gain on release.
 * @param {HTMLButtonElement|null} btn
 * @param {{
 *   isPonderingUnlocked?: () => boolean,
 *   onPonderStart?: () => { question: string, thought: string } | null,
 *   onPonderTick?: (holdMs: number) => { thought?: string } | void,
 *   onPonderEnd?: (holdMs: number) => { answer: string, coinGain: number } | null,
 * }} handlers
 */
function bindPonderHold(btn, handlers) {
  if (!btn || !handlers.onPonderStart || !handlers.onPonderEnd) return;

  /** @type {ReturnType<typeof setInterval>|null} */
  let tickTimer = null;
  let ponderActive = false;
  let holdStart = 0;
  /** @type {number|null} */
  let captureId = null;
  const stopTick = () => {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = null;
  };

  const endPonder = (/** @type {PointerEvent} */ e) => {
    if (!ponderActive) return;
    ponderActive = false;
    stopTick();
    const holdMs = Date.now() - holdStart;
    const result = handlers.onPonderEnd?.(holdMs);
    if (result) {
      appendChatAnswer(result.answer);
      setPondering(false);
      floatGain(btn, result.coinGain, e);
    } else {
      setPondering(false);
    }
    if (captureId !== null) {
      try { btn.releasePointerCapture(captureId); } catch { /* released */ }
      captureId = null;
    }
  };

  btn.addEventListener("pointerdown", (e) => {
    const ponderingUnlocked = handlers.isPonderingUnlocked?.() ?? false;
    if (!ponderingUnlocked || e.button !== 0) return;
    const session = handlers.onPonderStart?.();
    if (!session) return;
    e.preventDefault();
    ponderActive = true;
    holdStart = Date.now();
    beginPonderExchange(session.question, session.thought);
    setPondering(true);
    captureId = e.pointerId;
    btn.setPointerCapture(e.pointerId);
    tickTimer = setInterval(() => {
      const tick = handlers.onPonderTick?.(Date.now() - holdStart);
      if (tick && "thought" in tick && tick.thought) appendChatThought(tick.thought);
    }, PONDER_TICK_MS);
  });
  btn.addEventListener("pointerup", endPonder);
  btn.addEventListener("pointercancel", endPonder);
}

/**
 * Wire up persistent UI handlers (feed duck, tabs, pondering hold).
 * @param {{
 *   isPonderingUnlocked?: () => boolean,
 *   onPonderStart?: () => { question: string, thought: string } | null,
 *   onPonderTick?: (holdMs: number) => { thought?: string } | void,
 *   onPonderEnd?: (holdMs: number) => { answer: string, coinGain: number } | null,
 *   onFeedTap?: () => void,
 *   onBuyPond?: () => void,
 * }} handlers
 */
export function initUI(handlers) {
  els.duckCount = byId("duck-count");
  els.coinCount = byId("coin-count");
  els.answersRate = byId("answers-rate");
  els.demandRate = byId("demand-rate");
  els.supplyRate = byId("supply-rate");
  els.gaugeServed = byId("gauge-served");
  els.gaugeGap = byId("gauge-gap");
  els.hypeCount = byId("hype-count");
  els.hypeStat = els.hypeCount?.closest(".dash-stat--hype") ?? null;
  els.questionsAnswered = byId("questions-answered");
  els.duckFeedBtn = byId("duck-feed-btn");
  els.settingsGear = byId("settings-gear");
  els.feedOpexEl = byId("feed-opex");
  els.feedStatEl = els.feedOpexEl?.closest(".dash-stat--feed") ?? null;
  els.pondCapLabel = byId("pond-cap-label");
  els.buyPondBtn = /** @type {HTMLButtonElement} */ (byId("buy-pond-btn"));
  els.panelHeader = byId("panel-header");
  els.sheetTitle = byId("sheet-title");
  els.answersRateLabel = byId("answers-rate-label");

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.getAttribute("data-tab");
      if (tab.classList.contains("is-locked")) return;
      openTab(name);
    });
  });
  initViewModeControls();
  initCardFlavourTap();
  if (handlers.onFeedTap && els.duckFeedBtn) {
    els.duckFeedBtn.addEventListener("click", () => handlers.onFeedTap?.());
  }

  bindPonderHold(/** @type {HTMLButtonElement|null} */ (els.duckFeedBtn), handlers);
  if (handlers.onBuyPond && els.buyPondBtn) {
    els.buyPondBtn.addEventListener("click", () => handlers.onBuyPond?.());
  }
  setViewMode("chat");
}

/**
 * Dock tab → human label shown in the sheet handle header.
 * @type {Record<string, string>}
 */
const PANEL_TITLES = {
  upgrades: "Upgrades",
  flock: "Flock",
  hype: "Marketing",
  regions: "Regions",
  dashboard: "Stats",
  collections: "Collections",
};

/** Last selected dock tab — kept when switching to chat-only layout. */
let selectedPanelTab = "dashboard";

/** @returns {"chat"|"split"|"manage"} */
export function getViewMode() {
  const v = document.body.dataset.viewMode;
  if (v === "split" || v === "manage") return v;
  return "chat";
}

/**
 * Portrait: chat (no panel), split (chat + panel), manage (panel only).
 * Wide layout: chat closes side panel; split/manage both keep the two-column panel open.
 * @param {"chat"|"split"|"manage"} mode
 */
export function setViewMode(mode) {
  let next = mode;
  if (!usesPortraitSheet() && next === "manage") next = "split";
  document.body.dataset.viewMode = next;
  syncViewModeChrome();
  if (next === "chat") {
    document.body.removeAttribute("data-panel-open");
    hidePanelSurfaces();
    highlightSelectedTab();
    return;
  }
  const tab = selectedPanelTab || document.body.dataset.panelOpen || "dashboard";
  showPanelSurfaces(tab);
  document.body.dataset.panelOpen = tab;
}

/**
 * Legacy capture helpers: half → split, full → manage.
 * @param {"half"|"full"} state
 */
export function setSheet(state) {
  setViewMode(state === "full" ? "manage" : "split");
}

function syncViewModeChrome() {
  const mode = getViewMode();
  document.querySelectorAll(".view-mode__btn[data-set-view]").forEach((btn) => {
    const v = btn.getAttribute("data-set-view");
    const on = v === mode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
}

function initViewModeControls() {
  document.querySelectorAll(".view-mode__btn[data-set-view]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const mode = btn.getAttribute("data-set-view");
      if (mode === "chat" || mode === "split" || mode === "manage") setViewMode(mode);
    });
  });
}

function initCardFlavourTap() {
  /** @param {HTMLElement} wrap */
  const toggleFlavour = (wrap) => {
    const card = wrap.closest(".card");
    if (!card) return;
    const expanded = card.classList.toggle("is-flavour-expanded");
    wrap.setAttribute("aria-expanded", expanded ? "true" : "false");
  };
  document.querySelectorAll(".card-list").forEach((list) => {
    list.addEventListener("click", (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (target.closest(".card__buy")) return;
      const wrap = target.closest(".card__flavour-wrap");
      if (wrap instanceof HTMLElement) toggleFlavour(wrap);
    });
    list.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const target = /** @type {HTMLElement} */ (e.target);
      const wrap = target.closest(".card__flavour-wrap");
      if (wrap instanceof HTMLElement) {
        e.preventDefault();
        toggleFlavour(wrap);
      }
    });
  });
}

function hidePanelSurfaces() {
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.remove("is-active");
    /** @type {HTMLElement} */ (p).hidden = true;
  });
}

function highlightSelectedTab() {
  document.querySelectorAll(".tab").forEach((t) => {
    const tabName = t.getAttribute("data-tab");
    const isActive = tabName === selectedPanelTab;
    t.classList.toggle("is-active", isActive);
    t.setAttribute("aria-selected", String(isActive));
  });
}

/** @param {string} panel */
function showPanelSurfaces(panel) {
  selectedPanelTab = panel;
  if (els.sheetTitle) els.sheetTitle.textContent = PANEL_TITLES[panel] || "Panel";
  document.querySelectorAll(".tab").forEach((t) => {
    const tabName = t.getAttribute("data-tab");
    const isActive = tabName === panel;
    t.classList.toggle("is-active", isActive);
    t.setAttribute("aria-selected", String(isActive));
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    const isActive = p.getAttribute("data-panel") === panel;
    p.classList.toggle("is-active", isActive);
    /** @type {HTMLElement} */ (p).hidden = !isActive;
  });
}

/** Close management panel (chat-only layout). */
export function closeTab() {
  setViewMode("chat");
}

/** @param {string|null|undefined} name */
export function openTab(name) {
  if (!name) {
    closeTab();
    return;
  }
  if (selectedPanelTab === name && getViewMode() !== "chat") {
    setViewMode("chat");
    return;
  }
  selectedPanelTab = name;
  const mode = getViewMode() === "chat" ? "split" : getViewMode();
  setViewMode(mode);
  if (tabMeta) tabMeta.flags.dockDotSeen = true;
}

/** First quack — hide onboarding hint. */
export function markGameStarted() {
  document.body.dataset.started = "1";
}

/**
 * Spawn a rising "+N" over the duck button on each tap — the core bit of game
 * feel. Positioned at the pointer (or the button centre for keyboard taps) and
 * removed when its animation ends. Skipped entirely under reduced-motion.
 * @param {HTMLElement} btn
 * @param {number} amount
 * @param {MouseEvent} e
 */
function floatGain(btn, amount, e) {
  if (prefersReducedMotion() || !amount) return;
  const rect = btn.getBoundingClientRect();
  // clientX is 0 for keyboard-driven clicks; fall back to the button centre.
  const x = e.clientX || rect.left + rect.width / 2;
  const y = e.clientY || rect.top + rect.height / 2;
  const el = document.createElement("div");
  el.className = "float-gain";
  const decimals = amount < 1 ? 3 : 0;
  el.textContent = "+" + formatNumber(amount, decimals);
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.setProperty("--drift", (Math.random() * 28 - 14).toFixed(1) + "px");
  el.addEventListener("animationend", () => el.remove());
  // Fallback cleanup so a float can never leak if animationend doesn't fire
  // (interrupted animation, backgrounded tab, etc.).
  setTimeout(() => el.remove(), 1000);
  document.body.appendChild(el);
  pulseCoinCounter();
}

/** Toggle pondering glow on the feed duck button. */
function setPondering(active) {
  if (els.duckFeedBtn) els.duckFeedBtn.classList.toggle("is-pondering", active);
}

/**
 * Brief purchase flash on a card row.
 * @param {HTMLElement|null|undefined} root
 */
export function flashCard(root) {
  if (prefersReducedMotion() || !root) return;
  root.classList.remove("is-purchased");
  void root.offsetWidth;
  root.classList.add("is-purchased");
  root.addEventListener("animationend", () => root.classList.remove("is-purchased"), { once: true });
}

/**
 * Reflect the current era on the stage: sky palette shifts and browser theme-colour
 * follows. Idempotent; safe to call every era advance and on load.
 * @param {number} era
 */
export function applyEra(era) {
  const def = ERAS[era] || ERAS[0];
  document.body.dataset.era = String(def.id);
  document.body.dataset.totalDucks = String(document.body.dataset.totalDucks || "1");
  applyActTier(era);
  syncThemeColor();
}

/** @param {string} question @param {string} answer */
export function showExchange(question, answer) {
  appendChatExchange(question, answer);
}

/**
 * Refresh HUD counters and market dashboard. Score lives in the Marks vanity panel.
 * @param {{ ducks: number, coins: number, ducksPerSec: number, answersPerSec: number, supplyPerSec: number, demandPerSec: number, hype: number, questionsAnswered: number, feedOpexPerSec?: number, pondCap?: number, pondDucks?: number, hungry?: boolean, canAsk?: boolean }} snapshot
 */
export function updateUI(snapshot) {
  if (els.duckCount) els.duckCount.textContent = formatNumber(snapshot.ducks);
  document.body.dataset.totalDucks = String(snapshot.ducks);
  if (els.coinCount) els.coinCount.textContent = formatNumber(snapshot.coins);
  if (els.answersRate) els.answersRate.textContent = formatNumber(snapshot.answersPerSec, 2);
  if (els.answersRateLabel) {
    const r = snapshot.answersPerSec;
    const singular = r > 0 && r < 1.05;
    els.answersRateLabel.textContent = singular ? "answer per sec" : "answers per sec";
  }
  if (els.answersRate && snapshot.answersPerSec > lastAnswersRate + 0.001) {
    pulseHeroRate();
  }
  lastAnswersRate = snapshot.answersPerSec;
  if (els.demandRate) els.demandRate.textContent = formatNumber(snapshot.demandPerSec, 2);
  if (els.supplyRate) els.supplyRate.textContent = formatNumber(snapshot.supplyPerSec, 2);
  if (els.hypeCount) els.hypeCount.textContent = formatNumber(snapshot.hype, 1);
  if (els.hypeStat) {
    const decaying = snapshot.hype > 0.05 && snapshot.hype < lastHype - 0.0005;
    els.hypeStat.classList.toggle("is-decaying", decaying);
  }
  lastHype = snapshot.hype;
  if (snapshot.questionsAnswered > 0) {
    document.body.dataset.started = "1";
  }
  updateMarketGauge(snapshot.supplyPerSec, snapshot.demandPerSec);
  document.querySelectorAll("[data-duck-rate]").forEach((el) => {
    el.textContent = formatNumber(snapshot.ducksPerSec, 1);
  });
  document.querySelectorAll("[data-duck-total]").forEach((el) => {
    el.textContent = formatNumber(snapshot.ducks);
  });
  document.querySelectorAll(".dash-stat--ducks .dash-stat__label").forEach((el) => {
    el.textContent = Math.round(snapshot.ducks) === 1 ? "duck" : "ducks";
  });
  if (els.questionsAnswered && snapshot.questionsAnswered > 0) {
    els.questionsAnswered.textContent = `${formatNumber(snapshot.questionsAnswered)} questions answered`;
  }
  const feedOpex = snapshot.feedOpexPerSec ?? 0;
  if (els.feedOpexEl) els.feedOpexEl.textContent = formatNumber(feedOpex, 3);
  if (els.feedStatEl) els.feedStatEl.hidden = feedOpex <= 0;
  if (els.pondCapLabel && snapshot.pondCap != null && snapshot.pondDucks != null) {
    const duckWord = Math.round(snapshot.pondDucks) === 1 ? "duck" : "ducks";
    els.pondCapLabel.textContent =
      `${formatNumber(snapshot.pondDucks, 0)} / ${formatNumber(snapshot.pondCap, 0)} ${duckWord}`;
  }
  updateChatAffordance(snapshot.hungry ?? false, snapshot.canAsk ?? true);
}

/**
 * Reveal dock tabs as progression gates clear; hide dock until first tab unlocks.
 * @param {{ meta: import("../game/meta.js").Meta, coins: number, engine: any, answersPerSec?: number }} ctx
 */
export function updateTabUnlocks(ctx) {
  const { meta, coins, engine, answersPerSec = 0 } = ctx;
  tabMeta = meta;
  const dock = document.querySelector(".dock");
  const tabsVisible = anyTabUnlocked(meta, coins, engine, answersPerSec);

  if (dock) /** @type {HTMLElement} */ (dock).hidden = !tabsVisible;
  document.querySelectorAll(".tab[data-tab]").forEach((tab) => {
    const name = tab.getAttribute("data-tab");
    if (!name) return;
    const unlocked = tabUnlocked(name, meta, coins, engine, answersPerSec);
    /** @type {HTMLElement} */ (tab).hidden = !tabsVisible;
    tab.classList.toggle("is-locked", tabsVisible && !unlocked);
    tab.toggleAttribute("disabled", tabsVisible && !unlocked);
    tab.setAttribute("aria-disabled", String(tabsVisible && !unlocked));
    tab.classList.toggle("has-dot", name === "flock" && unlocked && !meta.flags.dockDotSeen);
  });
  const flockJustUnlocked = flockTabUnlocked(meta) && !meta.flags.flockTabToast;
  if (flockJustUnlocked) {
    meta.flags.flockTabToast = true;
    showToast({ title: "Flock unlocked", body: "Tap Flock to buy duck-makers." });
  }

  if (upgradesTabUnlocked(meta) && !upgradesToastShown && !meta.flags.upgradesTabToast) {
    upgradesToastShown = true;
    meta.flags.upgradesTabToast = true;
    if (!flockJustUnlocked) {
      showToast({ title: "Upgrades unlocked", body: "Try Steady Beak — hold Auto to ask faster." });
    }
  } else if (meta.flags.upgradesTabToast) {
    upgradesToastShown = true;
  }

  const openPanel = document.body.dataset.panelOpen;
  if (openPanel && !tabUnlocked(openPanel, meta, coins, engine, answersPerSec)) {
    closeTab();
  }

  if (!tabsVisible && getViewMode() !== "chat") {
    closeTab();
  }
  syncViewModeChrome();

  if (
    tabsVisible
    && !usesPortraitSheet()
    && !wideDefaultTabOpened
    && dashboardTabUnlocked(meta, answersPerSec)
  ) {
    wideDefaultTabOpened = true;
    if (getViewMode() === "chat") openTab("dashboard");
  }
}

/**
 * Demand-vs-supply gauge: green = served, amber = idle capacity or backlog.
 * @param {number} supply
 * @param {number} demand
 */
function updateMarketGauge(supply, demand) {
  const max = Math.max(supply, demand, 0.001);
  const served = Math.min(supply, demand);
  const gap = Math.abs(supply - demand);
  if (els.gaugeServed) els.gaugeServed.style.width = `${(served / max) * 100}%`;
  if (els.gaugeGap) {
    els.gaugeGap.style.width = `${(gap / max) * 100}%`;
    els.gaugeGap.dataset.mode = supply > demand ? "idle" : "backlog";
  }
}

/** Brief pulse on hero answers/sec when rate rises. */
export function pulseHeroRate() {
  if (prefersReducedMotion() || !els.answersRate) return;
  els.answersRate.classList.remove("is-pulse");
  void els.answersRate.offsetWidth;
  els.answersRate.classList.add("is-pulse");
}

/** One-shot confetti burst on era transition. */
export function triggerEraBurst() {
  if (prefersReducedMotion()) return;
  const host = document.getElementById("era-burst");
  if (!host) return;
  host.hidden = false;
  host.replaceChildren();
  const pieces = ["🦆", "✨", "🪙", "🌿"];
  for (let i = 0; i < 14; i++) {
    const el = document.createElement("span");
    el.className = "era-burst__bit";
    el.textContent = pieces[i % pieces.length];
    el.style.setProperty("--x", `${(Math.random() * 160 - 80).toFixed(0)}px`);
    el.style.setProperty("--r", `${(Math.random() * 40 - 20).toFixed(0)}deg`);
    el.style.animationDelay = `${(i * 40)}ms`;
    host.appendChild(el);
  }
  host.addEventListener("animationend", () => {
    host.hidden = true;
    host.replaceChildren();
  }, { once: true });
  setTimeout(() => { host.hidden = true; host.replaceChildren(); }, 1200);
}

/** Brief pulse on the duck counter when idle production ticks. */
export function pulseDuckCounter() {
  if (prefersReducedMotion() || !els.duckCount) return;
  els.duckCount.classList.remove("is-pulse");
  void els.duckCount.offsetWidth;
  els.duckCount.classList.add("is-pulse");
}

export function updateBuyPondBtn(cost, affordable, visible) {
  const btn = els.buyPondBtn;
  if (!btn) return;
  btn.hidden = !visible;
  if (!visible) return;
  btn.textContent = `Buy pond (${formatNumber(cost, 0)} 🪙) +50 capacity`;
  /** @type {HTMLButtonElement} */ (btn).disabled = !affordable;
}

/** Brief gold pulse on the coin counter when coins are earned. */
export function pulseCoinCounter() {
  if (prefersReducedMotion() || !els.coinCount) return;
  els.coinCount.classList.remove("is-pulse", "is-shimmer");
  void els.coinCount.offsetWidth;
  els.coinCount.classList.add("is-pulse", "is-shimmer");
}

/** @deprecated Pond log removed — no-op for callers still invoking. */
// aislop-ignore-next-line ai-slop/empty-function -- intentional deprecated no-op for back-compat callers.
export function logMessage(_message, _isBeat = false) {}
