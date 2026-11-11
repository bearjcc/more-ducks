// @ts-check
import { pickQuestion } from "../game/quack.js";
import { bindHoldRepeat } from "../game/sfx.js";
/** @type {HTMLElement|null} */ let threadEl = null;
/** @type {HTMLInputElement|null} */ let inputEl = null;
/** @type {HTMLButtonElement|null} */ let sendBtn = null;
/** @type {HTMLButtonElement|null} */ let autoBtn = null;
/** @type {HTMLElement|null} */ let feedHintEl = null;

/** @type {() => boolean} */ let canAsk = () => true;
// aislop-ignore-next-line ai-slop/empty-function -- default no-op handler slot; replaced in initChat
/** @type {(text: string, opts?: { holdRepeat?: boolean }) => void} */ let onSend = () => {};
/** @type {(totalDucks: number) => string} */ let pickAutoQuestion = () => "";
/** @type {number} */ let holdIntervalMs = 450;
/** @type {boolean} */ let holdRepeatEnabled = false;

/** @type {ReturnType<typeof setInterval>|null} */ let holdTimer = null;

/**
 * @param {{
 *   canAsk: () => boolean,
 *   onSend: (text: string, opts?: { holdRepeat?: boolean }) => void,
 *   pickAutoQuestion?: (totalDucks: number) => string,
 *   holdRepeatEnabled?: () => boolean,
 *   holdIntervalMs?: () => number,
 * }} handlers
 */
export function initChat(handlers) {
  threadEl = document.getElementById("chat-thread");
  inputEl = /** @type {HTMLInputElement} */ (document.getElementById("question-input"));
  sendBtn = /** @type {HTMLButtonElement} */ (document.getElementById("send-btn"));
  autoBtn = /** @type {HTMLButtonElement} */ (document.getElementById("auto-btn"));
  feedHintEl = document.getElementById("feed-hint");
  canAsk = handlers.canAsk;
  onSend = handlers.onSend;
  pickAutoQuestion = handlers.pickAutoQuestion ?? ((n) => pickQuestion(n));
  const refreshHold = () => {
    holdRepeatEnabled = handlers.holdRepeatEnabled?.() ?? false;
    holdIntervalMs = handlers.holdIntervalMs?.() ?? 450;
  };

  const trySend = (/** @type {string|undefined} */ override = undefined) => {
    if (!canAsk()) return;
    onSend(override ?? inputEl?.value ?? "");
    if (inputEl) inputEl.value = "";
  };

  const tryAuto = (/** @type {{ holdRepeat?: boolean }} */ opts = {}) => {
    const total = Number(document.body.dataset.totalDucks || "1");
    const q = pickAutoQuestion(total);
    onSend(q, opts);
  };

  const stopHold = () => {
    if (holdTimer) clearInterval(holdTimer);
    holdTimer = null;
    bindHoldRepeat(false);
    if (autoBtn) autoBtn.classList.remove("is-holding");
  };

  const startHold = (/** @type {PointerEvent} */ e) => {
    refreshHold();
    if (!holdRepeatEnabled || e.button !== 0 || !canAsk()) return;
    e.preventDefault();
    autoBtn?.setPointerCapture(e.pointerId);
    autoBtn?.classList.add("is-holding");
    bindHoldRepeat(true);
    tryAuto({ holdRepeat: false });
    holdTimer = setInterval(() => {
      if (canAsk()) tryAuto({ holdRepeat: true });
      else stopHold();
    }, holdIntervalMs);
  };

  if (sendBtn) {
    sendBtn.addEventListener("click", () => trySend());
  }

  if (autoBtn) {
    autoBtn.addEventListener("click", () => {
      refreshHold();
      // ponytail: hold-repeat sends on pointerdown; skip duplicate click
      if (holdRepeatEnabled) return;
      tryAuto();
    });
    autoBtn.addEventListener("pointerdown", startHold);
    autoBtn.addEventListener("pointerup", stopHold);
    autoBtn.addEventListener("pointercancel", stopHold);
  }

  if (inputEl) {
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        trySend();
      }
    });
  }
}

function trimThread() {
  if (!threadEl) return;
  while (threadEl.children.length > 40) {
    threadEl.removeChild(threadEl.firstChild);
  }
}

function scrollThread() {
  if (!threadEl) return;
  threadEl.scrollTop = threadEl.scrollHeight;
}

/**
 * @param {string} question
 * @param {string} answer
 */
export function appendChatExchange(question, answer) {
  if (!threadEl) return;
  const user = document.createElement("div");
  user.className = "chat-msg chat-msg--user";
  user.textContent = question;
  const duck = document.createElement("div");
  duck.className = "chat-msg chat-msg--duck";
  duck.textContent = answer;
  threadEl.appendChild(user);
  threadEl.appendChild(duck);
  scrollThread();
  trimThread();
}

/** Pondering: user question plus first streamed thought. */
export function beginPonderExchange(question, thought) {
  if (!threadEl) return;
  const user = document.createElement("div");
  user.className = "chat-msg chat-msg--user";
  user.textContent = question;
  threadEl.appendChild(user);
  appendChatThought(thought);
}

/** @param {string} thought */
export function appendChatThought(thought) {
  if (!threadEl) return;
  const duck = document.createElement("div");
  duck.className = "chat-msg chat-msg--duck chat-msg--thought";
  duck.textContent = thought;
  threadEl.appendChild(duck);
  scrollThread();
  trimThread();
}

/** Pondering release: final answer bubble after thoughts. */
export function appendChatAnswer(answer) {
  if (!threadEl) return;
  const duck = document.createElement("div");
  duck.className = "chat-msg chat-msg--duck";
  duck.textContent = answer;
  threadEl.appendChild(duck);
  scrollThread();
  trimThread();
}

/** @param {boolean} hungry @param {boolean} canAskNow */
export function updateChatAffordance(hungry, canAskNow) {
  if (sendBtn) {
    sendBtn.disabled = !canAskNow;
    sendBtn.title = hungry ? "The duck is hungry. Tap it." : "Send question";
  }
  if (autoBtn) autoBtn.disabled = !canAskNow;
  if (inputEl) inputEl.disabled = !canAskNow;
  if (feedHintEl) {
    feedHintEl.hidden = !hungry;
    feedHintEl.textContent = hungry ? "The duck is hungry — tap 🦆 to feed." : "";
    feedHintEl.setAttribute("aria-live", hungry ? "polite" : "off");
  }
  document.body.classList.toggle("duck-hungry", hungry);
}
