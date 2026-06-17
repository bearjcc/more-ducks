// @ts-check
import { formatNumber } from "../game/format.js";
import { ERAS } from "../data/eras.js";

/** @type {Record<string, HTMLElement|null>} */
const els = {};
/** @type {boolean|null} */
let motionOverride = null;

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

/** @param {string} id */
function byId(id) {
  return document.getElementById(id);
}

/**
 * Wire up persistent UI handlers (the quack button and tab switching).
 * @param {{ onQuack: () => number }} handlers  onQuack returns ducks hatched, for juice.
 */
export function initUI(handlers) {
  els.duckCount = byId("duck-count");
  els.crumbCount = byId("crumb-count");
  els.scoreCount = byId("score-count");
  els.scoreBadge = byId("score-badge");
  els.duckRate = byId("duck-rate");
  els.quackAnswer = byId("quack-answer");
  els.questionsAnswered = byId("questions-answered");
  els.pondMeter = byId("pond-meter");
  els.logList = byId("log-list");
  els.quackBtn = byId("quack-btn");

  const quack = els.quackBtn;
  if (quack) {
    // `click` covers mouse, touch, and keyboard (Enter/Space) for accessibility.
    quack.addEventListener("click", (e) => {
      const got = handlers.onQuack();
      floatGain(quack, got, e);
    });
  }

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => selectTab(tab.getAttribute("data-tab")));
  });

  // Initialise ARIA state to match the active tab.
  const active = document.querySelector(".tab.is-active");
  if (active) selectTab(active.getAttribute("data-tab"));
}

/** @param {string|null} name */
function selectTab(name) {
  if (!name) return;
  document.querySelectorAll(".tab").forEach((t) => {
    const isActive = t.getAttribute("data-tab") === name;
    t.classList.toggle("is-active", isActive);
    t.setAttribute("aria-selected", String(isActive));
  });
  document.querySelectorAll(".tab-panel").forEach((p) =>
    p.classList.toggle("is-active", p.getAttribute("data-panel") === name));
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
  el.textContent = "+" + formatNumber(amount, 0);
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.setProperty("--drift", (Math.random() * 28 - 14).toFixed(1) + "px");
  el.addEventListener("animationend", () => el.remove());
  // Fallback cleanup so a float can never leak if animationend doesn't fire
  // (interrupted animation, backgrounded tab, etc.).
  setTimeout(() => el.remove(), 1000);
  document.body.appendChild(el);
}

/**
 * Reflect the current era on the stage: the tap target becomes the era's emoji
 * (duck → vortex → globe), the sky palette shifts, and the browser theme-colour
 * follows. The allegory stays unspoken — the screen just quietly changes under
 * the player. Idempotent; safe to call every era advance and on load.
 * @param {number} era
 */
export function applyEra(era) {
  const def = ERAS[era] || ERAS[0];
  document.body.dataset.era = String(def.id);
  if (els.quackBtn) els.quackBtn.textContent = def.emoji;
  const theme = getComputedStyle(document.body).getPropertyValue("--sky-1").trim();
  if (theme) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme);
  }
}

/**
 * Show a duck answer in the speech bubble with a short fade. Reduced-motion
 * safe — skips the animation class but still sets the text.
 * @param {string} text
 */
export function showAnswer(text) {
  const el = els.quackAnswer;
  if (!el) return;
  el.textContent = text;
  if (!prefersReducedMotion()) {
    el.classList.remove("is-fade");
    void /** @type {HTMLElement} */ (el).offsetWidth;
    el.classList.add("is-fade");
  }
}

/**
 * Refresh the live counters. Called every frame.
 * @param {{ ducks: number, breadcrumbs: number, ducksPerSec: number, score: number, questionsAnswered: number, pondFraction: number, scoreBadge: string }} snapshot
 */
export function updateUI(snapshot) {
  if (els.duckCount) els.duckCount.textContent = formatNumber(snapshot.ducks);
  if (els.crumbCount) els.crumbCount.textContent = formatNumber(snapshot.breadcrumbs);
  if (els.scoreCount) els.scoreCount.textContent = formatNumber(snapshot.score);
  if (els.scoreBadge) els.scoreBadge.textContent = snapshot.scoreBadge;
  if (els.duckRate) els.duckRate.textContent = formatNumber(snapshot.ducksPerSec, 1);
  if (els.pondMeter) /** @type {HTMLMeterElement} */ (els.pondMeter).value = snapshot.pondFraction;
  if (els.questionsAnswered && snapshot.questionsAnswered > 0) {
    els.questionsAnswered.textContent = `${formatNumber(snapshot.questionsAnswered)} questions answered`;
  }
}

/** Brief pulse on the duck counter when idle production ticks. */
export function pulseDuckCounter() {
  if (prefersReducedMotion() || !els.duckCount) return;
  els.duckCount.classList.remove("is-pulse");
  void els.duckCount.offsetWidth;
  els.duckCount.classList.add("is-pulse");
}

/**
 * Append a line to the event log (newest on top).
 * @param {string} message
 * @param {boolean} [isBeat]  Highlight as a narrative beat.
 */
export function logMessage(message, isBeat = false) {
  const list = els.logList;
  if (!list) return;
  const li = document.createElement("li");
  li.textContent = message;
  if (isBeat) li.classList.add("is-beat");
  list.prepend(li);
  while (list.children.length > 100 && list.lastChild) {
    list.removeChild(list.lastChild);
  }
}
